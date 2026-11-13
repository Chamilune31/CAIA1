/* Validates all content before every build: `npm run check`.
   - pack and lesson schema, unique ids, valid topics
   - questions: 4 distinct options, valid answer index, explanation present
   - every LaTeX formula (blocks and $inline$) compiles with KaTeX
   - every calculation generator produces finite answers and accepts its own answer */
import katex from 'katex'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { checkAnswer, f, GENERATORS, Rng } from '../src/lib/calc'

const TOPICS = ['ethics', 'intro', 'real', 'pe', 'pd', 'hf', 'digital']
const BLOCKS = ['h', 'p', 'list', 'formula', 'tip', 'trap', 'recap', 'table', 'example']
const errors: string[] = []
const ids = new Map<string, string>()
const err = (where: string, msg: string) => errors.push(`${where} : ${msg}`)

const tex = (where: string, s: string) => {
  try {
    katex.renderToString(s, { throwOnError: true })
  } catch (e) {
    err(where, `invalid LaTeX "${s}" (${(e as Error).message.split('\n')[0]})`)
  }
}
const inline = (where: string, s: unknown) => {
  if (typeof s !== 'string' || !s.trim()) return err(where, 'empty text')
  const dollars = (s.match(/\$/g) ?? []).length
  if (dollars % 2) err(where, `odd number of $ signs (write amounts as "USD 5", outside formulas): ${s.slice(0, 80)}`)
  for (const m of s.matchAll(/\$([^$]+)\$/g)) {
    // a lowercase word outside LaTeX commands betrays a dollar amount parsed as a formula
    const bare = m[1].replace(/\\(text|mathrm|operatorname|textbf)\{[^}]*\}/g, '').replace(/\\[a-zA-Z]+/g, '')
    if (/(^|[^a-zA-Z])[a-z]{3,}/.test(bare)) err(where, `suspicious formula "${m[1].slice(0, 50)}": write amounts as "USD 5m", not with $`)
    tex(where, m[1])
  }
}
const uid = (id: unknown, where: string) => {
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(id)) return err(where, `invalid id "${id}"`)
  if (ids.has(id)) err(where, `id "${id}" already used in ${ids.get(id)}`)
  ids.set(id, where)
}
const topic = (t: unknown, where: string) => !TOPICS.includes(t as string) && err(where, `unknown topic "${t}"`)

/* eslint-disable @typescript-eslint/no-explicit-any */
const checkBlocks = (blocks: any[], where: string) => {
  if (!Array.isArray(blocks) || !blocks.length) return err(where, 'empty blocks')
  blocks.forEach((b, i) => {
    const w = `${where} block ${i}`
    if (!BLOCKS.includes(b.t)) return err(w, `unknown block type "${b.t}"`)
    if (b.t === 'formula') tex(w, b.tex)
    if (['h', 'p', 'tip', 'trap', 'recap'].includes(b.t)) inline(w, b.text)
    if (b.t === 'list') (b.items ?? []).forEach((x: string) => inline(w, x))
    if (b.t === 'example') (b.lines ?? []).forEach((x: string) => inline(w, x))
    if (b.t === 'table') {
      if (!b.head?.length) err(w, 'table without header')
      b.rows?.forEach((r: string[]) => r.length !== b.head.length && err(w, 'table row has the wrong length'))
    }
  })
}

const checkQuestion = (q: any, where: string) => {
  const w = `${where} ${q.id}`
  uid(q.id, where)
  topic(q.topic, w)
  inline(w + ' q', q.q)
  if (!Array.isArray(q.options) || q.options.length !== 4) err(w, 'exactly 4 options required')
  else {
    q.options.forEach((o: string) => inline(w + ' option', o))
    if (new Set(q.options.map((o: string) => o.trim().toLowerCase())).size !== 4) err(w, 'duplicate options')
    if (q.options.some((o: string) => /all of the above|none of the above|both a and b/i.test(o))) err(w, 'avoid "all/none of the above" (options are shuffled)')
  }
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) err(w, 'answer must be 0 to 3')
  inline(w + ' explain', q.explain)
  if (![1, 2, 3].includes(q.level)) err(w, 'level must be 1, 2 or 3')
  if (!q.tag) err(w, 'missing tag')
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
    err(where, `invalid JSON: ${(e as Error).message}`)
    continue
  }
  uid(pk.id, where)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pk.added)) err(where, 'added must be YYYY-MM-DD')
  if (!pk.title) err(where, 'missing title')
  for (const fi of pk.fiches ?? []) {
    uid(fi.id, where)
    topic(fi.topic, `${where} ${fi.id}`)
    if (!fi.title || !fi.subtitle || !fi.minutes) err(`${where} ${fi.id}`, 'title, subtitle and minutes are required')
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
    if (c.fr) err(`${where} ${c.id}`, 'cards use "hint", not "fr"')
    if (c.hint) inline(`${where} ${c.id}`, c.hint)
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
    err(where, `invalid JSON: ${(e as Error).message}`)
    continue
  }
  uid(l.id, where)
  topic(l.topic, where)
  if (!l.title || !l.source || !l.added) err(where, 'title, source and added are required')
  checkBlocks(l.blocks, where)
  for (const q of l.questions ?? []) checkQuestion(q, where)
}

/* Calculation generators */
for (const g of GENERATORS) {
  tex(`calc ${g.id}`, g.tex)
  for (let s = 1; s <= 300; s++) {
    const e = g.make(new Rng(s * 7919))
    const w = `calc ${g.id} (seed ${s})`
    if (!Number.isFinite(e.answer)) {
      err(w, 'non-finite answer')
      break
    }
    if (!(e.tol > 0)) err(w, 'zero tolerance')
    const shown = f(e.answer, e.decimals)
    if (!checkAnswer(e, shown)) {
      err(w, `rejects its own displayed answer ${shown} (answer ${e.answer}, tol ${e.tol})`)
      break
    }
    if (e.steps.some((x) => /NaN|Infinity|undefined/.test(x)) || /NaN|undefined/.test(e.prompt)) {
      err(w, 'NaN/undefined in the prompt or solution')
      break
    }
  }
}

const total = answerPos.reduce((a, b) => a + b, 0)
if (errors.length) {
  console.error(`✗ ${errors.length} content error(s):\n` + errors.map((e) => '  - ' + e).join('\n'))
  process.exit(1)
}
console.log(`✓ Content valid: ${ids.size} items, ${nq} questions (options shuffled on display), ${GENERATORS.length} generators tested ×300.`)
