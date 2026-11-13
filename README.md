# CAIA Level I · carnet de révision

Plateforme personnelle pour préparer le CAIA Level I (programme 2027) : fiches, formulaire, flashcards en répétition espacée, QCM corrigés, exercices de calcul générés à l’infini, examens blancs chronométrés et suivi par topic.

## Mettre en ligne (Vercel, gratuit)

1. vercel.com → *Add New… → Project* → importer `Chamilune31/CAIA1`.
2. Vercel détecte Vite : laisser les réglages par défaut (build `npm run build`, dossier `dist`) → *Deploy*.
3. Chaque push sur `main` redéploie automatiquement le site.

## Synchroniser entre appareils

Dans le site : **Réglages → Synchronisation GitHub**, coller un jeton *fine-grained* limité au dépôt CAIA1 avec la permission *Contents : Read and write*. La progression est alors enregistrée dans `progres/progression.json`, et les cours peuvent être envoyés depuis la page **Mes cours**.

## Développement

```bash
npm install
npm run dev
npm run build   # valide le contenu puis construit le site
```

Voir `CLAUDE.md` (architecture) et `GENERATION.md` (ajout de contenu).
