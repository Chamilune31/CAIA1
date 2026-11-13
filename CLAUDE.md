# CAIA1 — CAIA Level I revision platform

A personal static website (single learner) for preparing the **CAIA Level I exam, 2027 curriculum**. Sister project of the German-learning platform (`Chamilune31/Deutsch`): same philosophy, different visual identity.

## Principles

- **No API key**: Claude writes the content (in conversation or via the scheduled task); the site marks everything itself in the browser.
- The whole site is **in English** — interface, notes, questions, explanations, flashcards and calculation steps.
- Progress lives in `localStorage` (`caia1.progress`) and is synced to `progres/progression.json` through the GitHub API using a fine-grained token (Contents read/write, CAIA1 repository only) stored in the browser. Merging across devices is lossless (`mergeProgress`).
- Lessons built from the learner’s own material (`src/content/cours/`) are **permanent**.
- The repository is **public** (GitHub Pages): never commit copyrighted curriculum files or anything private.

## Stack and commands

Vite + React + TypeScript, KaTeX for formulas. Hash routing (`#/quiz`), so no server configuration. Deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main` (pushes that only touch `progres/`, `cours/` or Markdown files are skipped).

```bash
npm install
npm run dev      # development server
npm run check    # validates all content (schema, ids, LaTeX, calculation generators)
npm run build    # check + tsc + build (dist/)
```

## Structure

- `src/topics.ts` — the 7 topics of the 2027 exam and their weights.
- `src/types.ts` — `Pack`, `Fiche` (study note), `Question`, `Card`, `Formula`, `Lesson`, `Progress`.
- `src/content/packs/*.json` — content loaded automatically (`import.meta.glob`). One file per addition; `*-base.json` is the core set.
- `src/content/cours/*.json` — lessons built from material dropped into `cours/`.
- `src/lib/calc.ts` — calculation drill generators (new numbers every time, worked solution). A generator whose `id` equals a formula `id` is linked from the formula sheet.
- `src/lib/plan.ts` — statistics (topics and subtopics), question selection (misses > unseen > due), weighted mock-exam draw, study plan until the exam.
- `src/lib/store.ts` — progress, spaced repetition (questions and flashcards), settings.
- `src/lib/github.ts` — course uploads and progress sync.
- `src/pages/` — Home (today), Notes, Topic hub, Formulas, Flashcards, Courses, Questions, Calc, MockExam, Session, Progress, Settings, Search.
- `scripts/check-content.ts` — validation run before every build.
- `GENERATION.md` — instructions for the scheduled task (new content every 3 days).

## Content conventions

See `GENERATION.md` §4. In short: everything in English; 4 options per question (shuffled on display); explanation says why the answer is right and why the main trap is wrong; amounts written `USD …` (a `$` opens a formula); every calculation verified in Python; original wording (never copy the curriculum). Study notes use block types `h`, `p`, `list`, `formula`, `tip` (key point), `trap` (exam trap), `recap` (in short), `table`, `example`.

## Notes pasted into the conversation

When the learner pastes course notes or attaches a PDF/Word file: turn them directly into one or more lessons in `src/content/cours/` (split by theme), with a `fixes` list for errors in the notes and 5–10 questions; keep the original file in `cours/` only if it is the learner’s own material (the repository is public).

## Design

“Banknote” identity: pale sage security paper `#EEF1EC`, intaglio green `#1F5B49`, ink `#172420`, a single gold accent `#B8862B` (countdown ring, focus, flags). Bricolage Grotesque for interface and figures, Source Serif 4 for everything you read (notes, questions, explanations). The memorable element is the home-page allocation strip: the exam drawn to scale by topic weight, each segment filled by mastery. One colour per topic (`topics.ts`). Dark mode, bottom bar on mobile, sentence-case labels, no monospace labels.
