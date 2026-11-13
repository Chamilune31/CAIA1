/* Vérifie tout le contenu avant chaque build : `npm run check`.
   - schéma des packs et des leçons, identifiants uniques, topics valides
   - QCM : 4 options distinctes, bonne réponse valide, explication présente
   - toutes les formules LaTeX (blocs et $inline$) se compilent avec KaTeX
   - chaque générateur de calcul produit des réponses finies et accepte sa propre réponse */
import katex from 'katex'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { checkAnswer, f, GENERATORS, Rng } from '../src/lib/calc'

const TOPICS = ['ethics', 'intro', 'real', 'pe', 'pd', 'hf', 'digital']
const BLOCKS = ['h', 'p', 'list', 'formula', 'tip', 'trap', 'fr', 'table', 'example']
const errors: string[] = []
const ids = new Map<string, string>()
const err = (where: string, msg: string) => errors.push(`${where} : ${msg}`)

const tex = (where: string, s: string) => {
  try {
    katex.renderToString(s, { throwOnError: true })
  } catch (e) {
    err(where, `LaTeX invalide « ${s} » (${(e as Error).message.split('\n')[0]})`)
  }
}
const inline = (where: string, s: unknown) => {
  if (typeof s !== 'string' || !s.trim()) return err(where, 'texte vide')
  const dollars = (s.match(/\$/g) ?? []).length
  if (dollars % 2) err(where, `nombre impair de $ (écrire les montants « USD 5 » ou « 5 dollars » hors formule) : ${s.slice(0, 80)}`)
  for (const m of s.matchAll(/\$([^$]+)\$/g)) {
    // un mot en minuscules hors commande LaTeX trahit un montant en dollars pris pour une formule
    const bare = m[1].replace(/\\(text|mathrm|operatorname|textbf)\{[^}]*\}/g, '').replace(/\\[a-zA-Z]+/g, '')
    if (/(^|[^a-zA-Z])[a-z]{3,}/.test(bare)) err(where, `formule suspecte « ${m[1].slice(0, 50)} » : écrire les montants « USD 5m », pas avec $`)
    tex(where, m[1])
  }
}
const uid = (id: unknown, where: string) => {
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(id)) return err(where, `id invalide « ${id} »`)
  if (ids.has(id)) err(where, `id « ${id} » déjà utilisé dans ${ids.get(id)}`)
  ids.set(id, where)
}
const topic = (t: unknown, where: string) => !TOPICS.includes(t as string) && err(where, `topic inconnu « ${t} »`)

/* eslint-disable @typescript-eslint/no-explicit-any */
const checkBlocks = (blocks: any[], where: string) => {
  if (!Array.isArray(blocks) || !blocks.length) return err(where, 'blocks vide')
  blocks.forEach((b, i) => {
    const w = `${where} bloc ${i}`
    if (!BLOCKS.includes(b.t)) return err(w, `type inconnu « ${b.t} »`)
    if (b.t === 'formula') tex(w, b.tex)
    if (['h', 'p', 'tip', 'trap', 'fr'].includes(b.t)) inline(w, b.text)
    if (b.t === 'list') (b.items ?? []).forEach((x: string) => inline(w, x))
    if (b.t === 'example') (b.lines ?? []).forEach((x: string) => inline(w, x))
    if (b.t === 'table') {
      if (!b.head?.length) err(w, 'table sans en-tête')
      b.rows?.forEach((r: string[]) => r.length !== b.head.length && err(w, 'ligne de table de mauvaise longueur'))
    }
  })
}

const checkQuestion = (q: any, where: string) => {
  const w = `${where} ${q.id}`
  uid(q.id, where)
  topic(q.topic, w)
  inline(w + ' q', q.q)
  if (!Array.isArray(q.options) || q.options.length !== 4) err(w, 'il faut exactement 4 options')
  else {
    q.options.forEach((o: string) => inline(w + ' option', o))
    if (new Set(q.options.map((o: string) => o.trim().toLowerCase())).size !== 4) err(w, 'options en double')
    if (q.options.some((o: string) => /all of the above|none of the above|both a and b/i.test(o))) err(w, 'éviter « all/none of the above » (les options sont mélangées)')
  }
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) err(w, 'answer doit valoir 0 à 3')
  inline(w + ' explain', q.explain)
  if (![1, 2, 3].includes(q.level)) err(w, 'level doit valoir 1, 2 ou 3')
  if (!q.tag) err(w, 'tag manquant')
}

const dir = (p: string) => readdirSync(p).filter((f) => f.endsWith('.json'))
const answerPos = [0, 0, 0, 0]
let nq = 0

for (const file of dir('src/content/packs')) {
  const where = `packs/${file}`
  let pk: any
  try {
    pk = JSON.parse(readFileSync(join('src/content/packs', file), 'utf8'))
  } catch (e) {
    err(where, `JSON invalide : ${(e as Error).message}`)
    continue
  }
  uid(pk.id, where)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pk.added)) err(where, 'added doit être AAAA-MM-JJ')
  if (!pk.title) err(where, 'title manquant')
  for (const fi of pk.fiches ?? []) {
    uid(fi.id, where)
    topic(fi.topic, `${where} ${fi.id}`)
    if (!fi.title || !fi.fr || !fi.minutes) err(`${where} ${fi.id}`, 'title, fr et minutes requis')
    checkBlocks(fi.blocks, `${where} ${fi.id}`)
  }
  for (const q of pk.questions ?? []) {
    checkQuestion(q, where)
    answerPos[q.answer]++
    nq++
  }
  for (const c of pk.cards ?? []) {
    uid(c.id, where)
    topic(c.topic, `${where} ${c.id}`)
    inline(`${where} ${c.id}`, c.front)
    inline(`${where} ${c.id}`, c.back)
    if (c.fr) inline(`${where} ${c.id}`, c.fr)
  }
  for (const fo of pk.formulas ?? []) {
    uid(fo.id, where)
    topic(fo.topic, `${where} ${fo.id}`)
    tex(`${where} ${fo.id}`, fo.tex)
    if (fo.vars) inline(`${where} ${fo.id}`, fo.vars)
    if (fo.note) inline(`${where} ${fo.id}`, fo.note)
  }
}

for (const file of dir('src/content/cours')) {
  const where = `cours/${file}`
  let l: any
  try {
    l = JSON.parse(readFileSync(join('src/content/cours', file), 'utf8'))
  } catch (e) {
    err(where, `JSON invalide : ${(e as Error).message}`)
    continue
  }
  uid(l.id, where)
  topic(l.topic, where)
  if (!l.title || !l.source || !l.added) err(where, 'title, source et added requis')
  checkBlocks(l.blocks, where)
  for (const q of l.questions ?? []) checkQuestion(q, where)
}

/* Générateurs de calcul */
for (const g of GENERATORS) {
  tex(`calc ${g.id}`, g.tex)
  for (let s = 1; s <= 300; s++) {
    const e = g.make(new Rng(s * 7919))
    const w = `calc ${g.id} (graine ${s})`
    if (!Number.isFinite(e.answer)) {
      err(w, 'réponse non finie')
      break
    }
    if (!(e.tol > 0)) err(w, 'tolérance nulle')
    const shown = f(e.answer, e.decimals)
    if (!checkAnswer(e, shown)) {
      err(w, `refuse sa propre réponse affichée ${shown} (réponse ${e.answer}, tol ${e.tol})`)
      break
    }
    if (e.steps.some((x) => /NaN|Infinity|undefined/.test(x)) || /NaN|undefined/.test(e.prompt)) {
      err(w, 'NaN/undefined dans l’énoncé ou la correction')
      break
    }
  }
}

const total = answerPos.reduce((a, b) => a + b, 0)
if (errors.length) {
  console.error(`✗ ${errors.length} erreur(s) dans le contenu :\n` + errors.map((e) => '  - ' + e).join('\n'))
  process.exit(1)
}
console.log(`✓ Contenu valide : ${ids.size} éléments, ${nq} QCM (options mélangées à l’affichage), ${GENERATORS.length} générateurs testés ×300.`)
