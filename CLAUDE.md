# CAIA1 — plateforme de révision du CAIA Level I

Site statique personnel (une seule utilisatrice, francophone) pour préparer le **CAIA Level I, programme 2027**. Projet jumeau de la plateforme d’allemand (`Chamilune31/Deutsch`) : même philosophie, identité visuelle différente.

## Principes

- **Pas de clé API** : Claude rédige le contenu (conversation ou tâche planifiée), le site corrige tout seul dans le navigateur.
- Contenu d’examen **en anglais**, interface et explications **en français**.
- Progression dans `localStorage` (`caia1.progress`), synchronisée dans `progres/progression.json` via l’API GitHub avec un jeton fine-grained (Contents read/write, dépôt CAIA1 seul) stocké dans le navigateur. Fusion sans perte entre appareils (`mergeProgress`).
- Les leçons tirées des cours de l’utilisatrice (`src/content/cours/`) sont **permanentes**.

## Stack et commandes

Vite + React + TypeScript, KaTeX pour les formules. Routage par hash (`#/qcm`), donc aucun réglage serveur.

```bash
npm install
npm run dev      # développement
npm run check    # valide tout le contenu (schéma, ids, LaTeX, générateurs de calcul)
npm run build    # check + tsc + build (dist/)
```

## Structure

- `src/topics.ts` — les 7 topics 2027 et leurs poids.
- `src/types.ts` — formats `Pack`, `Fiche`, `Question`, `Card`, `Formula`, `Lesson`, `Progress`.
- `src/content/packs/*.json` — contenu chargé automatiquement (`import.meta.glob`). Un fichier par ajout ; `*-base.json` = socle initial.
- `src/content/cours/*.json` — leçons issues des supports déposés dans `cours/`.
- `src/lib/calc.ts` — générateurs d’exercices numériques (nouveaux chiffres à chaque fois, correction pas à pas). Un générateur dont l’`id` égale l’`id` d’une formule est relié au formulaire.
- `src/lib/plan.ts` — statistiques, choix des questions (erreurs > jamais vues > à réviser), tirage pondéré des examens blancs, planning jusqu’à l’examen.
- `src/lib/store.ts` — progression, répétition espacée (QCM et flashcards), réglages.
- `src/lib/github.ts` — envoi de cours et synchro de la progression.
- `scripts/check-content.ts` — validation lancée avant chaque build.
- `GENERATION.md` — consignes de la tâche planifiée (nouveau contenu tous les 3 jours).

## Conventions de contenu

Voir `GENERATION.md` §4. En bref : 4 options par QCM (mélangées à l’affichage), explication en français, montants écrits `USD …` (le `$` ouvre une formule), calculs vérifiés en Python, contenu original (pas de copie du curriculum).

## Notes collées dans la conversation

Quand l’utilisatrice colle des notes de cours ou joint un PDF/Word : en faire directement une ou plusieurs leçons dans `src/content/cours/` (découper par thème), avec une partie `fixes` pour les erreurs des notes et 5 à 10 QCM ; conserver le support d’origine dans `cours/`.

## Design

Identité « carnet de marché » : papier crème `#F4F1E8`, encre `#12202B`, vert billet `#0E5E4B`, or `#E2B33C` ; Space Grotesk (titres), IBM Plex Sans (texte), IBM Plex Mono (chiffres). Une couleur par topic (`topics.ts`). Mode sombre, barre du bas sur mobile.
