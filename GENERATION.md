# Content generation — instructions for the scheduled task

You are Claude. Every 3 days you extend the learner’s CAIA Level I revision platform (repository `Chamilune31/CAIA1`, branch `main`). The target is the **CAIA Level I exam, 2027 curriculum** (March 2027 window by default; the real date is in the site’s settings, not in the repository). **Everything you write is in English.**

## 1. Read the current state

1. `git pull` to start from the latest version.
2. Read `progres/progression.json` if it exists (written by the site). For each topic (`ethics`, `intro`, `real`, `pe`, `pd`, `hf`, `digital`), compute accuracy from `q` (key = question id, `ok/seen`) and `calc` (key = generator id). Match ids against `src/content/packs/` to find each question’s topic and `tag`.
   - **Topics or tags under 70%** accuracy → priority.
   - Questions with `streak < 0` → subtopics that need explaining differently.
   - Topics with few questions seen → cover them too.
3. List files in `cours/` (PDF, Word, `.md` notes) that have no lesson yet: a lesson exists if a file in `src/content/cours/*.json` has that file as its `source`.

## 2. Turn uploaded material into lessons (first priority)

For each new file in `cours/`:

- Read it in full (use the pdf / docx skills if needed).
- Create `src/content/cours/<YYYY-MM-DD>-<slug>.json` in the `Lesson` format (see `src/types.ts`): `id`, `topic`, `title`, `source` (file path), `added`, `blocks`, `fixes`, `questions`.
- If the material covers several themes, create **several lessons**.
- `fixes`: list errors or inaccuracies found in the material (wrong formula, confused terms), with the correction.
- `questions`: 5 to 10 questions on the lesson (same rules as §4).
- Lessons are **permanent**: never delete or rewrite an existing lesson unless explicitly asked.

## 3. One new pack

Create **one** file `src/content/packs/<YYYY-MM-DD>-<slug>.json` (`Pack` format), `added` = today, `title` short and descriptive (e.g. “Targeted review: hedge funds and VaR”). Contents:

- **15 to 20 questions**: about 60% on weak topics/tags, the rest spread by exam weight (INT 21–27%, REA 16–22%, HF 15–21%, PD 10–16%, PE 8–14%, ETH 7–13%, DIG 3–9%). At least 4 calculation questions (`"calc": true`).
- **8 to 12 flashcards** on terms not yet in the glossary (check existing `front` values). Optional `hint` field for a memory aid.
- **0 or 1 study note** (`fiches`) if a curriculum subtopic is still missing (check existing notes). Each note needs `title`, `subtitle` (one line), `minutes` and `blocks`.
- New **formulas** only if missing from the formula sheet.

Do not modify existing packs (except to fix a proven error — keep the same `id` if you do).

## 4. Writing rules

- **English only**, plain and precise. Explanations (`explain`) are short and say why the right answer is right and why the most tempting wrong answer is wrong.
- Questions: exactly **4 distinct options**, `answer` = index of the correct one (0–3). Options are **shuffled on display**, so putting the correct one first is fine. Never “all/none of the above” or “both A and B”.
- `level`: 1 (definition), 2 (application), 3 (multi-step reasoning or trap).
- `tag`: reuse existing subtopic names where possible (same spelling) so subtopic statistics work.
- Unique lowercase ids: `q-YYYYMMDD-01`, `c-YYYYMMDD-01`, etc.
- Amounts: write `USD 5 million` (a `$` sign opens a LaTeX formula). Formulas: `$...$` inline, valid LaTeX (backslashes doubled in JSON).
- Note blocks: `h`, `p`, `list`, `formula`, `tip` (key point), `trap` (exam trap), `recap` (in short), `table`, `example`.
- **Verify every calculation** by running it (Python) before writing it; put the steps in `explain`.
- **Original wording**: do not copy text from the official curriculum or textbooks; rephrase.
- Stay within the Level I 2027 curriculum (no Level II content).

## 5. Check and publish

1. `npm ci` (if `node_modules` is missing), then `npm run build` — it runs `npm run check`, which validates all content (schema, ids, LaTeX, generators). Fix until it passes.
2. Commit to `main` with a message like `Content YYYY-MM-DD: <summary>` (plus `Lesson: …` if material was processed), then `git push`. The push triggers the GitHub Pages deployment.
3. If nothing new is justified (no new material, weak spots already well covered), do not create an empty commit.
4. Finish with a 3-line summary: what was added, which topics were targeted and why.
