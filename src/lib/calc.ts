import type { TopicId } from '../types'

/* Exercices de calcul générés : chaque appel produit de nouveaux chiffres.
   Convention de saisie : les pourcentages se tapent en % (ex. 7.25 pour 7,25 %). */

export type Unit = '%' | '$' | 'x' | ''

export interface CalcExercise {
  prompt: string // énoncé en anglais
  answer: number
  unit: Unit
  decimals: number // décimales affichées dans la correction
  tol: number // tolérance absolue acceptée
  steps: string[] // correction pas à pas (français)
}

export interface Generator {
  id: string
  topic: TopicId
  title: string // nom anglais
  fr: string
  tex: string // formule clé
  make: (r: Rng) => CalcExercise
}

/* ---------- Hasard reproductible ---------- */
export class Rng {
  private s: number
  constructor(seed = Math.floor(Math.random() * 2 ** 31)) {
    this.s = seed >>> 0
  }
  next() {
    let t = (this.s += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  /** nombre entre a et b arrondi au pas */
  num(a: number, b: number, step = 1) {
    const n = Math.round((a + this.next() * (b - a)) / step) * step
    return +n.toFixed(6)
  }
  pick<T>(xs: T[]): T {
    return xs[Math.floor(this.next() * xs.length)]
  }
}

/* ---------- Mise en forme ---------- */
export const f = (x: number, d = 2) =>
  x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const pct = (x: number, d = 2) => `${f(x * 100, d)}%`
const usd = (x: number, d = 0) => `$${f(x, d)}`

const ex = (
  prompt: string,
  answer: number,
  unit: Unit,
  steps: string[],
  decimals = 2,
  tol?: number,
): CalcExercise => ({
  prompt,
  answer,
  unit,
  decimals,
  tol: tol ?? (unit === '%' ? 0.05 : unit === '$' ? Math.max(1, Math.abs(answer) * 0.002) : unit === 'x' ? 0.01 : 0.01),
  steps,
})

/** Vérifie une réponse saisie (accepte virgule, espaces, signe %). */
export const parseNumber = (raw: string) => {
  let s = raw.replace(/[\s$%x×  ']/gi, '').replace('−', '-')
  if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '')
  else if (/^-?[1-9]\d{0,2}(,\d{3})+$/.test(s)) s = s.replace(/,/g, '') // 1,234,567
  else s = s.replace(',', '.') // 7,25 (virgule décimale)
  const v = Number(s)
  return s === '' || !Number.isFinite(v) ? null : v
}

export const checkAnswer = (e: CalcExercise, raw: string) => {
  const v = parseNumber(raw)
  if (v === null) return null
  return Math.abs(v - e.answer) <= e.tol + 1e-9
}

/* ---------- Générateurs ---------- */
export const GENERATORS: Generator[] = [
  /* ===== Introduction ===== */
  {
    id: 'hpr',
    topic: 'intro',
    title: 'Holding period return',
    fr: 'Rendement sur la période de détention',
    tex: 'R = \\dfrac{P_1 - P_0 + D}{P_0}',
    make: (r) => {
      const p0 = r.num(40, 120, 0.5)
      const p1 = +(p0 * (1 + r.num(-0.15, 0.3, 0.005))).toFixed(2)
      const d = r.num(0.5, 4, 0.25)
      const R = (p1 - p0 + d) / p0
      return ex(
        `An asset is bought at ${usd(p0, 2)}, pays an income of ${usd(d, 2)} during the year and is sold at ${usd(p1, 2)}. What is the holding period return (in %)?`,
        R * 100,
        '%',
        [`Gain en capital : ${f(p1)} − ${f(p0)} = ${f(p1 - p0)}`, `Ajouter le revenu : ${f(p1 - p0)} + ${f(d)} = ${f(p1 - p0 + d)}`, `Diviser par le prix initial : ${f(p1 - p0 + d)} / ${f(p0)} = ${pct(R)}`],
      )
    },
  },
  {
    id: 'logret',
    topic: 'intro',
    title: 'Continuously compounded return',
    fr: 'Rendement logarithmique (composé en continu)',
    tex: 'r = \\ln\\left(\\dfrac{P_1}{P_0}\\right) = \\ln(1+R)',
    make: (r) => {
      const R = r.num(-0.25, 0.4, 0.005)
      const lr = Math.log(1 + R)
      return ex(
        `An asset has a simple (discrete) return of ${pct(R, 1)} over one period. What is its continuously compounded return (in %)?`,
        lr * 100,
        '%',
        [`r = ln(1 + R) = ln(${f(1 + R, 3)})`, `r = ${pct(lr)}`, R > 0 ? 'Le rendement log est toujours inférieur au rendement simple quand R > 0.' : 'Pour R < 0, le rendement log est plus négatif que le rendement simple.'],
      )
    },
  },
  {
    id: 'annualize',
    topic: 'intro',
    title: 'Annualized return',
    fr: 'Rendement annualisé à partir d’un rendement cumulé',
    tex: 'R_{ann} = (1 + R_{tot})^{1/T} - 1',
    make: (r) => {
      const T = r.pick([3, 4, 5, 6, 7, 8, 10])
      const tot = r.num(0.2, 1.5, 0.01)
      const a = (1 + tot) ** (1 / T) - 1
      return ex(
        `A fund returned a cumulative ${pct(tot, 0)} over ${T} years. What is its annualized (geometric) return (in %)?`,
        a * 100,
        '%',
        [`(1 + ${f(tot)})^(1/${T}) − 1`, `= ${f(1 + tot, 2)}^(${f(1 / T, 4)}) − 1 = ${pct(a)}`, 'Piège : diviser par T (moyenne arithmétique) surestime le rendement.'],
      )
    },
  },
  {
    id: 'sharpe',
    topic: 'intro',
    title: 'Sharpe ratio',
    fr: 'Ratio de Sharpe',
    tex: 'S = \\dfrac{R_p - R_f}{\\sigma_p}',
    make: (r) => {
      const rp = r.num(0.04, 0.16, 0.001)
      const rf = r.num(0.01, 0.045, 0.0025)
      const s = r.num(0.06, 0.25, 0.005)
      const v = (rp - rf) / s
      return ex(
        `A hedge fund earned an annual return of ${pct(rp, 1)} with a volatility of ${pct(s, 1)}. The risk-free rate is ${pct(rf, 2)}. Compute the Sharpe ratio.`,
        v,
        '',
        [`Prime de risque : ${pct(rp, 1)} − ${pct(rf, 2)} = ${pct(rp - rf)}`, `Diviser par la volatilité totale : ${f((rp - rf) * 100)} / ${f(s * 100, 1)} = ${f(v, 3)}`],
        3,
        0.005,
      )
    },
  },
  {
    id: 'sortino',
    topic: 'intro',
    title: 'Sortino ratio',
    fr: 'Ratio de Sortino',
    tex: '\\text{Sortino} = \\dfrac{R_p - R_{target}}{TSV^{1/2}}',
    make: (r) => {
      const rp = r.num(0.05, 0.15, 0.001)
      const tgt = r.num(0.0, 0.05, 0.005)
      const dd = r.num(0.04, 0.14, 0.0025)
      const v = (rp - tgt) / dd
      return ex(
        `A fund has an average annual return of ${pct(rp, 1)}. The target (minimum acceptable) return is ${pct(tgt, 1)} and the downside deviation (square root of target semivariance) is ${pct(dd, 2)}. Compute the Sortino ratio.`,
        v,
        '',
        [`Rendement excédentaire sur la cible : ${pct(rp, 1)} − ${pct(tgt, 1)} = ${pct(rp - tgt)}`, `Diviser par l’écart à la baisse : ${f((rp - tgt) * 100)} / ${f(dd * 100)} = ${f(v, 3)}`, 'Le Sortino ne pénalise que la volatilité sous la cible.'],
        3,
        0.005,
      )
    },
  },
  {
    id: 'treynor',
    topic: 'intro',
    title: 'Treynor ratio',
    fr: 'Ratio de Treynor',
    tex: 'T = \\dfrac{R_p - R_f}{\\beta_p}',
    make: (r) => {
      const rp = r.num(0.05, 0.15, 0.001)
      const rf = r.num(0.01, 0.04, 0.0025)
      const b = r.num(0.3, 1.4, 0.05)
      const v = (rp - rf) / b
      return ex(
        `A portfolio returned ${pct(rp, 1)} with a beta of ${f(b)}. The risk-free rate is ${pct(rf, 2)}. What is the Treynor ratio (in %)?`,
        v * 100,
        '%',
        [`(${pct(rp, 1)} − ${pct(rf, 2)}) / ${f(b)}`, `= ${pct(rp - rf)} / ${f(b)} = ${pct(v)}`, 'Treynor divise par le bêta (risque systématique), pas par la volatilité.'],
      )
    },
  },
  {
    id: 'jensen',
    topic: 'intro',
    title: 'Jensen’s alpha (CAPM)',
    fr: 'Alpha de Jensen',
    tex: '\\alpha = R_p - [R_f + \\beta (R_m - R_f)]',
    make: (r) => {
      const rp = r.num(0.04, 0.16, 0.001)
      const rf = r.num(0.01, 0.04, 0.0025)
      const rm = r.num(0.05, 0.12, 0.0025)
      const b = r.num(0.3, 1.5, 0.05)
      const req = rf + b * (rm - rf)
      const a = rp - req
      return ex(
        `A manager's portfolio returned ${pct(rp, 1)} over the year. Its beta to the market is ${f(b)}, the market returned ${pct(rm, 2)} and the risk-free rate was ${pct(rf, 2)}. What is Jensen's alpha (in %)?`,
        a * 100,
        '%',
        [`Rendement exigé (CAPM) : ${pct(rf, 2)} + ${f(b)} × (${pct(rm, 2)} − ${pct(rf, 2)}) = ${pct(req)}`, `Alpha : ${pct(rp, 1)} − ${pct(req)} = ${pct(a)}`],
      )
    },
  },
  {
    id: 'ir',
    topic: 'intro',
    title: 'Information ratio',
    fr: 'Ratio d’information',
    tex: 'IR = \\dfrac{R_p - R_b}{TE}',
    make: (r) => {
      const rp = r.num(0.04, 0.14, 0.001)
      const rb = +(rp - r.num(-0.01, 0.04, 0.001)).toFixed(4)
      const te = r.num(0.02, 0.08, 0.0025)
      const v = (rp - rb) / te
      return ex(
        `A fund returned ${pct(rp, 1)} while its benchmark returned ${pct(rb, 1)}. The tracking error is ${pct(te, 2)}. Compute the information ratio.`,
        v,
        '',
        [`Rendement actif : ${pct(rp, 1)} − ${pct(rb, 1)} = ${pct(rp - rb)}`, `Diviser par la tracking error : ${f((rp - rb) * 100)} / ${f(te * 100)} = ${f(v, 3)}`],
        3,
        0.005,
      )
    },
  },
  {
    id: 'var',
    topic: 'intro',
    title: 'Parametric Value at Risk',
    fr: 'VaR paramétrique (loi normale)',
    tex: '\\text{VaR} = (z\\,\\sigma\\sqrt{T} - \\mu T)\\times V',
    make: (r) => {
      const conf = r.pick([
        [95, 1.645],
        [99, 2.33],
      ] as const)
      const V = r.num(5, 200, 5) * 1e6
      const sigA = r.num(0.1, 0.35, 0.01)
      const horizon = r.pick([
        ['one day', 1 / 250, 'σ quotidienne = σ annuelle / √250'],
        ['one week', 1 / 52, 'σ hebdo = σ annuelle / √52'],
        ['one month', 1 / 12, 'σ mensuelle = σ annuelle / √12'],
      ] as const)
      const s = sigA * Math.sqrt(horizon[1])
      const v = conf[1] * s * V
      return ex(
        `A portfolio worth ${usd(V)} has an annual volatility of ${pct(sigA, 0)}. Assuming normally distributed returns with a zero expected return, what is the ${conf[0]}% ${horizon[0]} VaR (in $, z = ${conf[1]})?`,
        v,
        '$',
        [`${horizon[2]} : ${pct(sigA, 0)} × √${f(horizon[1], 5)} = ${pct(s, 3)}`, `VaR = ${conf[1]} × ${pct(s, 3)} × ${usd(V)} = ${usd(v)}`, 'Règle de la racine du temps : σ croît avec √T (rendements i.i.d.).'],
        0,
        Math.max(1, v * 0.006),
      )
    },
  },
  {
    id: 'beta',
    topic: 'intro',
    title: 'Beta from correlation',
    fr: 'Bêta à partir de la corrélation',
    tex: '\\beta = \\dfrac{\\text{Cov}(R_i, R_m)}{\\sigma_m^2} = \\rho_{i,m}\\dfrac{\\sigma_i}{\\sigma_m}',
    make: (r) => {
      const rho = r.num(0.2, 0.9, 0.05)
      const si = r.num(0.08, 0.3, 0.01)
      const sm = r.num(0.12, 0.22, 0.01)
      const b = (rho * si) / sm
      return ex(
        `A fund has a volatility of ${pct(si, 0)} and a correlation of ${f(rho)} with the equity market, whose volatility is ${pct(sm, 0)}. What is the fund's beta?`,
        b,
        '',
        [`β = ρ × σi / σm = ${f(rho)} × ${f(si * 100, 0)} / ${f(sm * 100, 0)}`, `β = ${f(b, 3)}`],
        3,
        0.005,
      )
    },
  },
  {
    id: 'unsmooth',
    topic: 'intro',
    title: 'Unsmoothing reported returns',
    fr: 'Désaisonnalisation (unsmoothing) des rendements lissés',
    tex: 'R_{t,true} = \\dfrac{R_{t,rep} - \\rho\\, R_{t-1,rep}}{1 - \\rho}',
    make: (r) => {
      const rho = r.num(0.3, 0.7, 0.05)
      const rt = r.num(-0.03, 0.05, 0.001)
      const r1 = r.num(-0.03, 0.05, 0.001)
      const v = (rt - rho * r1) / (1 - rho)
      return ex(
        `An appraisal-based real estate index reports ${pct(rt, 1)} this quarter and ${pct(r1, 1)} last quarter. The first-order autocorrelation is ${f(rho)}. Estimate this quarter's unsmoothed (true) return (in %).`,
        v * 100,
        '%',
        [`Numérateur : ${pct(rt, 1)} − ${f(rho)} × ${pct(r1, 1)} = ${pct(rt - rho * r1)}`, `Diviser par (1 − ${f(rho)}) = ${f(1 - rho)} → ${pct(v)}`, 'Le rendement désaisonnalisé est plus volatil que le rendement publié.'],
      )
    },
  },
  {
    id: 'pvol',
    topic: 'intro',
    title: 'Two-asset portfolio volatility',
    fr: 'Volatilité d’un portefeuille à deux actifs',
    tex: '\\sigma_p = \\sqrt{w_1^2\\sigma_1^2 + w_2^2\\sigma_2^2 + 2w_1w_2\\rho\\,\\sigma_1\\sigma_2}',
    make: (r) => {
      const w2 = r.num(0.02, 0.3, 0.01)
      const w1 = 1 - w2
      const s1 = r.num(0.08, 0.16, 0.01)
      const alt = r.pick(['bitcoin', 'a commodity index', 'a hedge fund index', 'private real estate (unsmoothed)'])
      const s2 = alt === 'bitcoin' ? r.num(0.5, 0.8, 0.05) : r.num(0.06, 0.25, 0.01)
      const rho = r.num(-0.2, 0.6, 0.05)
      const v = Math.sqrt(w1 ** 2 * s1 ** 2 + w2 ** 2 * s2 ** 2 + 2 * w1 * w2 * rho * s1 * s2)
      return ex(
        `A portfolio holds ${pct(w1, 0)} in a 60/40 portfolio (volatility ${pct(s1, 0)}) and ${pct(w2, 0)} in ${alt} (volatility ${pct(s2, 0)}). The correlation is ${f(rho)}. What is the portfolio volatility (in %)?`,
        v * 100,
        '%',
        [`w1²σ1² = ${f(w1 ** 2 * s1 ** 2, 5)} ; w2²σ2² = ${f(w2 ** 2 * s2 ** 2, 5)}`, `2·w1·w2·ρ·σ1·σ2 = ${f(2 * w1 * w2 * rho * s1 * s2, 5)}`, `Variance = ${f(v * v, 5)} → σp = ${pct(v)}`],
      )
    },
  },
  {
    id: 'hfee',
    topic: 'intro',
    title: 'Incentive fee with high-water mark',
    fr: 'Commission de performance avec high-water mark',
    tex: '\\text{Incentive} = k \\times \\max(0,\\ NAV_{\\text{after mgmt fee}} - \\max(HWM, \\text{hurdle level}))',
    make: (r) => {
      const nav0 = r.num(80, 120, 1) * 1e6
      const hwm = +(nav0 * r.pick([1, 1, r.num(1.02, 1.1, 0.01)])).toFixed(0)
      const gross = r.num(0.05, 0.25, 0.005)
      const mf = r.pick([0.01, 0.015, 0.02])
      const k = r.pick([0.15, 0.2])
      const hurdle = r.pick([0, 0, 0.05])
      const navG = nav0 * (1 + gross)
      const navM = navG - mf * nav0
      const base = Math.max(hwm, nav0 * (1 + hurdle))
      const fee = k * Math.max(0, navM - base)
      return ex(
        `A hedge fund starts the year with a NAV of ${usd(nav0)} and a high-water mark of ${usd(hwm)}. It earns a gross return of ${pct(gross, 1)}. The management fee is ${pct(mf, 1)} of beginning NAV, and the incentive fee is ${pct(k, 0)} of profits above the ${hurdle ? `higher of the high-water mark and a ${pct(hurdle, 0)} hard hurdle on beginning NAV` : 'high-water mark'}, calculated after the management fee. What is the incentive fee (in $)?`,
        fee,
        '$',
        [
          `NAV brute : ${usd(nav0)} × ${f(1 + gross, 3)} = ${usd(navG)}`,
          `Après frais de gestion (${usd(mf * nav0)}) : ${usd(navM)}`,
          `Seuil : ${hurdle ? `max(HWM ${usd(hwm)}, hurdle ${usd(nav0 * (1 + hurdle))}) = ` : 'HWM = '}${usd(base)}`,
          fee > 0 ? `Commission : ${pct(k, 0)} × (${usd(navM)} − ${usd(base)}) = ${usd(fee)}` : 'NAV sous le seuil → aucune commission de performance.',
        ],
        0,
        Math.max(1000, fee * 0.003),
      )
    },
  },

  /* ===== Real assets ===== */
  {
    id: 'caprate',
    topic: 'real',
    title: 'Property value from cap rate',
    fr: 'Valeur d’un immeuble par le taux de capitalisation',
    tex: 'V = \\dfrac{NOI}{\\text{cap rate}}, \\quad NOI = \\text{revenus} - \\text{charges d’exploitation}',
    make: (r) => {
      const rent = r.num(2, 12, 0.1) * 1e6
      const opex = rent * r.num(0.25, 0.45, 0.01)
      const cap = r.num(0.04, 0.09, 0.0025)
      const noi = rent - opex
      const V = noi / cap
      return ex(
        `An office building generates gross rental income of ${usd(rent)} per year and operating expenses of ${usd(opex)} (excluding debt service and depreciation). The market cap rate is ${pct(cap, 2)}. Estimate the property value (in $).`,
        V,
        '$',
        [`NOI = ${usd(rent)} − ${usd(opex)} = ${usd(noi)}`, `V = ${usd(noi)} / ${pct(cap, 2)} = ${usd(V)}`, 'Le service de la dette et l’amortissement ne sont pas déduits du NOI.'],
        0,
        Math.max(500, V * 0.003),
      )
    },
  },
  {
    id: 'dscr',
    topic: 'real',
    title: 'Debt service coverage ratio',
    fr: 'Ratio de couverture du service de la dette',
    tex: 'DSCR = \\dfrac{NOI}{\\text{annual debt service}}',
    make: (r) => {
      const noi = r.num(0.8, 6, 0.05) * 1e6
      const ds = noi / r.num(1.05, 1.8, 0.01)
      const v = noi / ds
      return ex(
        `A property produces a NOI of ${usd(noi)}. Annual mortgage payments (interest + principal) are ${usd(ds)}. What is the DSCR?`,
        v,
        'x',
        [`DSCR = ${usd(noi)} / ${usd(ds)} = ${f(v, 2)}x`, 'Les prêteurs exigent en général un DSCR supérieur à 1,2–1,3x.'],
        2,
        0.01,
      )
    },
  },
  {
    id: 'mortgage',
    topic: 'real',
    title: 'Fixed-rate mortgage payment',
    fr: 'Mensualité d’un prêt hypothécaire à taux fixe',
    tex: 'PMT = \\dfrac{P\\, i}{1 - (1+i)^{-n}}',
    make: (r) => {
      const P = r.num(200, 900, 10) * 1e3
      const rate = r.num(0.03, 0.08, 0.0025)
      const years = r.pick([15, 20, 25, 30])
      const i = rate / 12
      const n = years * 12
      const pmt = (P * i) / (1 - (1 + i) ** -n)
      return ex(
        `A borrower takes a ${years}-year fully amortizing fixed-rate mortgage of ${usd(P)} at an annual rate of ${pct(rate, 2)}, with monthly payments. What is the monthly payment (in $)?`,
        pmt,
        '$',
        [`i = ${pct(rate, 2)} / 12 = ${pct(i, 4)} ; n = ${n} mois`, `PMT = ${usd(P)} × ${f(i, 6)} / (1 − (1 + ${f(i, 6)})^−${n})`, `PMT = ${usd(pmt, 2)}`, 'Calculatrice : N, I/Y, PV, puis CPT PMT.'],
        2,
        Math.max(1, pmt * 0.002),
      )
    },
  },
  {
    id: 'carry',
    topic: 'real',
    title: 'Futures price (cost of carry)',
    fr: 'Prix à terme d’une matière première (coût de portage)',
    tex: 'F = S\\, e^{(r + c - y)T}',
    make: (r) => {
      const S = r.num(40, 120, 0.5)
      const rf = r.num(0.01, 0.05, 0.0025)
      const c = r.num(0.0, 0.04, 0.0025)
      const y = r.num(0.0, 0.08, 0.005)
      const T = r.pick([0.25, 0.5, 0.75, 1])
      const F = S * Math.exp((rf + c - y) * T)
      return ex(
        `A commodity trades at a spot price of ${usd(S, 2)}. The risk-free rate is ${pct(rf, 2)}, storage costs are ${pct(c, 2)} and the convenience yield is ${pct(y, 1)} (all continuously compounded, per year). What is the arbitrage-free futures price for delivery in ${T * 12} months (in $)?`,
        F,
        '$',
        [`Coût net de portage : ${pct(rf, 2)} + ${pct(c, 2)} − ${pct(y, 1)} = ${pct(rf + c - y)}`, `F = ${f(S)} × e^(${f(rf + c - y, 4)} × ${T}) = ${usd(F, 2)}`, F > S ? 'F > S : marché en contango.' : 'F < S : marché en backwardation (convenience yield élevé).'],
        2,
        0.02,
      )
    },
  },
  {
    id: 'cmdret',
    topic: 'real',
    title: 'Collateralized futures return',
    fr: 'Décomposition du rendement d’un indice de matières premières',
    tex: 'R_{total} = R_{spot} + R_{roll} + R_{collateral}',
    make: (r) => {
      const spot = r.num(-0.1, 0.15, 0.005)
      const roll = r.num(-0.08, 0.05, 0.005)
      const coll = r.num(0.0, 0.05, 0.0025)
      const tot = spot + roll + coll
      return ex(
        `Over a year, the spot prices in a fully collateralized commodity futures index changed by ${pct(spot, 1)}. The index experienced a roll yield of ${pct(roll, 1)}, and the collateral earned ${pct(coll, 2)}. What is the approximate total return of the index (in %)?`,
        tot * 100,
        '%',
        [`${pct(spot, 1)} + ${pct(roll, 1)} + ${pct(coll, 2)} = ${pct(tot)}`, roll < 0 ? 'Roll yield négatif : courbe en contango.' : 'Roll yield positif : courbe en backwardation.'],
      )
    },
  },

  /* ===== Private equity ===== */
  {
    id: 'vc',
    topic: 'pe',
    title: 'Venture capital method',
    fr: 'Méthode du capital-risque (valorisation post-money)',
    tex: 'V_{post} = \\dfrac{V_{exit}}{(1+r)^T}, \\quad \\text{ownership} = \\dfrac{I}{V_{post}}',
    make: (r) => {
      const exit = r.num(50, 400, 10) * 1e6
      const T = r.pick([4, 5, 6, 7])
      const tr = r.pick([0.3, 0.35, 0.4, 0.45, 0.5])
      const I = r.num(3, 20, 0.5) * 1e6
      const post = exit / (1 + tr) ** T
      const own = I / post
      return ex(
        `A VC fund invests ${usd(I)} in a start-up expected to be worth ${usd(exit)} at exit in ${T} years. The VC's target rate of return is ${pct(tr, 0)}. Assuming no further dilution, what ownership stake (in %) must the VC receive?`,
        own * 100,
        '%',
        [`Post-money = ${usd(exit)} / ${f(1 + tr)}^${T} = ${usd(post)}`, `Part = ${usd(I)} / ${usd(post)} = ${pct(own)}`, `Pré-money = post − investissement = ${usd(post - I)}`],
      )
    },
  },
  {
    id: 'multiples',
    topic: 'pe',
    title: 'TVPI, DPI and RVPI',
    fr: 'Multiples TVPI, DPI et RVPI',
    tex: 'TVPI = DPI + RVPI = \\dfrac{\\text{distributions} + NAV}{\\text{paid-in capital}}',
    make: (r) => {
      const paid = r.num(60, 100, 1) * 1e6
      const dist = paid * r.num(0.2, 1.4, 0.01)
      const nav = paid * r.num(0.2, 1.0, 0.01)
      const which = r.pick(['TVPI', 'DPI', 'RVPI'] as const)
      const v = which === 'TVPI' ? (dist + nav) / paid : which === 'DPI' ? dist / paid : nav / paid
      return ex(
        `A private equity fund has called ${usd(paid)} of capital from LPs. It has distributed ${usd(dist)} so far and its remaining NAV is ${usd(nav)}. What is the fund's ${which}?`,
        v,
        'x',
        [`DPI = ${usd(dist)} / ${usd(paid)} = ${f(dist / paid)}x`, `RVPI = ${usd(nav)} / ${usd(paid)} = ${f(nav / paid)}x`, `TVPI = DPI + RVPI = ${f((dist + nav) / paid)}x`, `Réponse : ${which} = ${f(v)}x`],
        2,
        0.01,
      )
    },
  },
  {
    id: 'moicirr',
    topic: 'pe',
    title: 'IRR from a multiple (single cash flows)',
    fr: 'TRI à partir d’un multiple (un seul flux d’entrée et de sortie)',
    tex: 'IRR = MOIC^{1/T} - 1',
    make: (r) => {
      const m = r.num(1.3, 4, 0.1)
      const T = r.pick([3, 4, 5, 6, 7])
      const irr = m ** (1 / T) - 1
      return ex(
        `A buyout fund invests in a company and exits after ${T} years with a gross multiple of ${f(m, 1)}x. There are no interim cash flows. What is the gross IRR (in %)?`,
        irr * 100,
        '%',
        [`IRR = ${f(m, 1)}^(1/${T}) − 1 = ${pct(irr)}`, 'Même multiple sur une durée plus longue → TRI plus faible.'],
      )
    },
  },
  {
    id: 'waterfall',
    topic: 'pe',
    title: 'European waterfall with catch-up',
    fr: 'Cascade européenne (whole-of-fund) avec rattrapage intégral',
    tex: '\\text{Carry} = \\min\\big(k \\cdot \\text{Profit},\\ \\max(0, \\text{Profit} - H)\\big)',
    make: (r) => {
      const C = r.num(50, 200, 5) * 1e6
      const T = r.pick([4, 5, 6])
      const hurdle = 0.08
      const H = C * ((1 + hurdle) ** T - 1)
      const mult = r.pick([r.num(1.3, 1.5, 0.01), r.num(1.5, 2.5, 0.05)])
      const D = C * mult
      const P = D - C
      const k = 0.2
      const carry = Math.min(k * P, Math.max(0, P - H))
      return ex(
        `A PE fund called ${usd(C)} and, after ${T} years, distributes a total of ${usd(D)} (all at the end, for simplicity). The waterfall is whole-of-fund: return of capital, an 8% compounded preferred return, a 100% GP catch-up, then a 80/20 split. How much carried interest does the GP receive (in $)?`,
        carry,
        '$',
        [
          `Profit total = ${usd(D)} − ${usd(C)} = ${usd(P)}`,
          `Preferred return aux LP = ${usd(C)} × (1,08^${T} − 1) = ${usd(H)}`,
          `Carry « plein » = 20 % × profit = ${usd(k * P)}`,
          `Disponible après le preferred return = ${usd(Math.max(0, P - H))}`,
          `Carry = min(${usd(k * P)} ; ${usd(Math.max(0, P - H))}) = ${usd(carry)}`,
          carry < k * P ? 'Le rattrapage n’est pas complet : le GP reçoit tout le surplus au-delà du hurdle.' : 'Le rattrapage est complet : le GP touche 20 % de tout le profit.',
        ],
        0,
        Math.max(1000, carry * 0.003),
      )
    },
  },

  /* ===== Private debt ===== */
  {
    id: 'el',
    topic: 'pd',
    title: 'Expected credit loss',
    fr: 'Perte attendue',
    tex: 'EL = PD \\times LGD \\times EAD, \\quad LGD = 1 - RR',
    make: (r) => {
      const ead = r.num(5, 80, 1) * 1e6
      const pd = r.num(0.005, 0.08, 0.0025)
      const rr = r.num(0.2, 0.7, 0.05)
      const el = pd * (1 - rr) * ead
      return ex(
        `A direct lender has ${usd(ead)} of exposure to a borrower. The one-year probability of default is ${pct(pd, 2)} and the expected recovery rate is ${pct(rr, 0)}. What is the one-year expected loss (in $)?`,
        el,
        '$',
        [`LGD = 1 − ${pct(rr, 0)} = ${pct(1 - rr, 0)}`, `EL = ${pct(pd, 2)} × ${pct(1 - rr, 0)} × ${usd(ead)} = ${usd(el)}`],
        0,
        Math.max(100, el * 0.003),
      )
    },
  },
  {
    id: 'spread',
    topic: 'pd',
    title: 'Credit spread from default intensity',
    fr: 'Spread de crédit (approximation)',
    tex: 's \\approx \\lambda \\times (1 - RR)',
    make: (r) => {
      const lam = r.num(0.005, 0.06, 0.0025)
      const rr = r.num(0.2, 0.7, 0.05)
      const s = lam * (1 - rr)
      return ex(
        `In a reduced-form model, a bond's annual default intensity (hazard rate) is ${pct(lam, 2)} and the recovery rate is ${pct(rr, 0)}. What is the approximate credit spread (in %)?`,
        s * 100,
        '%',
        [`s ≈ ${pct(lam, 2)} × (1 − ${pct(rr, 0)}) = ${pct(s, 3)}`, `Soit environ ${f(s * 1e4, 0)} points de base.`],
        3,
        0.01,
      )
    },
  },
  {
    id: 'merger',
    topic: 'hf',
    title: 'Merger arbitrage spread',
    fr: 'Spread d’arbitrage de fusion (offre en actions)',
    tex: '\\text{spread} = \\text{ratio} \\times P_{acq} - P_{target}',
    make: (r) => {
      const pa = r.num(30, 120, 0.5)
      const ratio = r.num(0.3, 1.5, 0.05)
      const offer = pa * ratio
      const pt = +(offer * (1 - r.num(0.02, 0.15, 0.005))).toFixed(2)
      const sp = offer - pt
      const ret = sp / pt
      return ex(
        `An acquirer trading at ${usd(pa, 2)} offers ${f(ratio)} of its shares for each target share. The target trades at ${usd(pt, 2)}. A merger arbitrageur buys 1 target share and shorts ${f(ratio)} acquirer shares. If the deal closes, what is the return on the target position (in %, ignoring dividends and short rebate)?`,
        ret * 100,
        '%',
        [`Valeur de l’offre : ${f(ratio)} × ${f(pa)} = ${usd(offer, 2)}`, `Spread : ${f(offer)} − ${f(pt)} = ${usd(sp, 2)}`, `Rendement : ${f(sp)} / ${f(pt)} = ${pct(ret)}`, 'Le profil ressemble à une vente de put : gain limité si l’opération réussit, perte forte si elle échoue.'],
      )
    },
  },

  /* ===== Hedge funds ===== */
  {
    id: 'convprem',
    topic: 'hf',
    title: 'Conversion premium',
    fr: 'Prime de conversion d’une obligation convertible',
    tex: '\\text{CV} = \\text{conv. ratio} \\times S, \\quad \\text{premium} = \\dfrac{P_{CB} - CV}{CV}',
    make: (r) => {
      const ratio = r.num(10, 40, 1)
      const S = r.num(15, 80, 0.5)
      const cv = ratio * S
      const pcb = cv * (1 + r.num(0.05, 0.4, 0.005))
      const prem = (pcb - cv) / cv
      return ex(
        `A convertible bond (par $1,000) trades at ${usd(pcb, 2)}. It converts into ${ratio} shares; the stock trades at ${usd(S, 2)}. What is the conversion premium (in %)?`,
        prem * 100,
        '%',
        [`Valeur de conversion = ${ratio} × ${f(S)} = ${usd(cv, 2)}`, `Prime = (${f(pcb)} − ${f(cv)}) / ${f(cv)} = ${pct(prem)}`],
      )
    },
  },
  {
    id: 'deltahedge',
    topic: 'hf',
    title: 'Convertible arbitrage hedge ratio',
    fr: 'Nombre d’actions à vendre à découvert (delta-hedge)',
    tex: 'N_{short} = \\Delta \\times \\text{conv. ratio} \\times N_{bonds}',
    make: (r) => {
      const n = r.num(100, 2000, 50)
      const ratio = r.num(10, 40, 1)
      const delta = r.num(0.3, 0.85, 0.01)
      const v = delta * ratio * n
      return ex(
        `A convertible arbitrage fund buys ${n} convertible bonds, each convertible into ${ratio} shares. The delta of the conversion option is ${f(delta)}. How many shares should it short to be delta-neutral?`,
        v,
        '',
        [`${f(delta)} × ${ratio} × ${n} = ${f(v, 0)} actions`, 'Si l’action monte, le delta augmente (gamma positif) : il faut vendre davantage d’actions.'],
        0,
        1,
      )
    },
  },
  {
    id: 'fof',
    topic: 'hf',
    title: 'Fund of funds: double layer of fees',
    fr: 'Fonds de fonds : double couche de frais',
    tex: 'R_{net} = (R - m)(1-k) \\text{ si } R - m > 0',
    make: (r) => {
      const R = r.num(0.08, 0.25, 0.005)
      const m1 = 0.02
      const k1 = 0.2
      const m2 = r.pick([0.01, 0.01, 0.015])
      const k2 = r.pick([0.1, 0.1, 0.05])
      const n1 = R - m1 > 0 ? (R - m1) * (1 - k1) : R - m1
      const n2 = n1 - m2 > 0 ? (n1 - m2) * (1 - k2) : n1 - m2
      return ex(
        `The underlying hedge funds of a fund of funds earn a gross return of ${pct(R, 1)}. They charge 2% management and 20% incentive fees (incentive on returns net of the management fee). The FoF charges ${pct(m2, 1)} management and ${pct(k2, 0)} incentive on the same basis. What is the investor's net return (in %)?`,
        n2 * 100,
        '%',
        [`Niveau 1 : (${pct(R, 1)} − 2 %) × 80 % = ${pct(n1)}`, `Niveau 2 : (${pct(n1)} − ${pct(m2, 1)}) × ${pct(1 - k2, 0)} = ${pct(n2)}`, `Frais totaux : ${pct(R - n2)} sur ${pct(R, 1)} de performance brute`],
      )
    },
  },
]

export const GEN_BY_ID = new Map(GENERATORS.map((g) => [g.id, g]))
