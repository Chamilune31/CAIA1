# CAIA Level I · carnet de révision

Plateforme personnelle pour préparer le CAIA Level I (programme 2027) : fiches, formulaire, flashcards en répétition espacée, QCM corrigés, exercices de calcul générés à l’infini, examens blancs chronométrés et suivi par topic.

## Mettre en ligne

**GitHub Pages (recommandé, gratuit)** : une fois dans *Settings → Pages → Build and deployment → Source : GitHub Actions*, le workflow `.github/workflows/deploy.yml` construit et publie le site à chaque push sur `main` (sauf les commits de progression et de cours). Adresse : https://chamilune31.github.io/CAIA1/

**Vercel (alternative)** : importer le dépôt sur vercel.com, réglages par défaut.

Utiliser toujours la même adresse : la progression locale est propre à chaque adresse.

## Synchroniser entre appareils

Dans le site : **Réglages → Synchronisation GitHub**, coller un jeton *fine-grained* limité au dépôt CAIA1 avec la permission *Contents : Read and write*. La progression est alors enregistrée dans `progres/progression.json`, et les cours peuvent être envoyés depuis la page **Mes cours**.

## Développement

```bash
npm install
npm run dev
npm run build   # valide le contenu puis construit le site
```

Voir `CLAUDE.md` (architecture) et `GENERATION.md` (ajout de contenu).
