# CAIA Level I — revision desk

A personal platform for the CAIA Level I exam (2027 curriculum): study notes, a formula sheet, flashcards with spaced repetition, practice questions with explanations, endless calculation drills, timed mock exams, topic and subtopic tracking, and a daily session built around your weak spots.

Live site: https://chamilune31.github.io/CAIA1/

## Deployment

GitHub Pages deploys the site automatically on every push to `main` (`.github/workflows/deploy.yml`). One-time setup: *Settings → Pages → Build and deployment → Source: GitHub Actions*.

Always use the same address: progress saved in the browser belongs to that address.

## Sync across devices

On the site: **Settings → Sync across devices**, paste a fine-grained GitHub token limited to the CAIA1 repository with *Contents: Read and write*. Progress is then saved to `progres/progression.json` and merged across devices, and course material can be uploaded from **My courses**.

The repository is public, so anything committed (progress, uploaded files) is visible to anyone.

## Development

```bash
npm install
npm run dev
npm run build   # validates the content, then builds the site
```

See `CLAUDE.md` (architecture) and `GENERATION.md` (adding content).
