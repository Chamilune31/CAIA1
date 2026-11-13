# Génération de contenu — consignes pour la tâche planifiée

Tu es Claude. Tous les 3 jours, tu enrichis la plateforme CAIA Level I de l’utilisatrice (dépôt `Chamilune31/CAIA1`, branche `main`). L’examen visé est le **CAIA Level I, programme 2027** (fenêtre de mars 2027 par défaut ; la date réelle est dans les réglages du site, pas dans le dépôt).

## 1. Lire l’état

1. `git pull` pour partir de la dernière version.
2. Lire `progres/progression.json` s’il existe (écrit par le site). Pour chaque topic (`ethics`, `intro`, `real`, `pe`, `pd`, `hf`, `digital`) calcule le taux de réussite à partir de `q` (clé = id de question, `ok/seen`) et `calc` (id de générateur). Croise les ids avec les fichiers de `src/content/packs/` pour retrouver topic et `tag`.
   - **Topics ou tags sous 70 %** de réussite → prioritaires.
   - Questions avec `streak < 0` → sous-thèmes à réexpliquer autrement.
   - Topics peu pratiqués (peu de questions vues) → à couvrir aussi.
3. Lister les fichiers de `cours/` (PDF, Word, notes `.md`) qui n’ont pas encore de leçon : une leçon existe si un fichier de `src/content/cours/*.json` a ce fichier comme `source`.

## 2. Transformer les cours déposés (prioritaire)

Pour chaque support nouveau dans `cours/` :

- Lis-le en entier (skills pdf / docx si besoin).
- Crée `src/content/cours/<AAAA-MM-JJ>-<slug>.json` au format `Lesson` (voir `src/types.ts`) : `id`, `topic`, `title` (français), `source` (chemin du fichier), `added`, `blocks`, `fixes`, `questions`.
- Si le support couvre plusieurs thèmes, fais **plusieurs leçons**.
- `fixes` : liste les erreurs ou imprécisions trouvées dans le support (formule fausse, confusion de termes), avec la correction.
- `questions` : 5 à 10 QCM sur la leçon (mêmes règles qu’en §4).
- Les leçons sont **permanentes** : ne jamais supprimer ni réécrire une leçon existante sauf demande explicite.

## 3. Nouveau pack

Crée **un** fichier `src/content/packs/<AAAA-MM-JJ>-<slug>.json` (format `Pack`), `added` = date du jour, `title` en français (ex. « Révision ciblée : hedge funds et VaR »). Contenu :

- **15 à 20 QCM** : environ 60 % sur les topics/tags faibles, le reste réparti selon les poids de l’examen (INT 21–27 %, REA 16–22 %, HF 15–21 %, PD 10–16 %, PE 8–14 %, ETH 7–13 %, DIG 3–9 %). Au moins 4 questions de calcul (`"calc": true`).
- **8 à 12 flashcards** sur des termes absents du glossaire actuel (vérifier les `front` existants).
- **0 à 1 fiche** si un sous-thème du programme manque encore (vérifier les fiches existantes).
- Des **formules** nouvelles seulement si elles manquent au formulaire.

Ne modifie pas les packs existants (sauf pour corriger une erreur avérée : dans ce cas, garde l’`id`).

## 4. Règles de rédaction

- Questions, options, fiches et flashcards **en anglais** (langue de l’examen) ; `explain`, `fr`, blocs `fr`/`tip`/`trap` peuvent être en français. Les explications des QCM sont **toujours en français**, courtes, et disent pourquoi la bonne réponse est juste (et pourquoi le piège principal est faux).
- QCM : exactement **4 options** distinctes, `answer` = index de la bonne (0–3). Les options sont **mélangées à l’affichage** : mettre la bonne en premier est permis. Jamais « all/none of the above », ni « both A and B ».
- `level` : 1 (définition), 2 (application), 3 (raisonnement en plusieurs étapes / piège).
- `tag` : réutiliser les sous-thèmes existants quand c’est possible (même orthographe) pour que les statistiques par sous-thème fonctionnent.
- Identifiants uniques, en minuscules : `q-AAAAMMJJ-01`, `c-AAAAMMJJ-01`, etc.
- Montants : écrire `USD 5 million` (le signe `$` ouvre une formule LaTeX). Formules : `$...$` en ligne, LaTeX valide (les `\` doublés dans le JSON).
- **Vérifier chaque calcul** en l’exécutant (Python) avant de l’écrire ; mettre les étapes dans `explain`.
- Contenu **original** : ne recopie pas le texte du curriculum officiel ni de manuels ; reformule.
- Rester dans le programme Level I 2027 (pas de contenu Level II).

## 5. Vérifier et publier

1. `npm ci` (si `node_modules` absent) puis `npm run build` — la commande lance `npm run check` qui valide tout le contenu (schéma, ids, LaTeX, générateurs). Corrige jusqu’à ce que ce soit vert.
2. Commit sur `main` avec un message en français : `Contenu AAAA-MM-JJ : <résumé>` (+ `Leçon : …` si des cours ont été traités), puis `git push`.
3. Si rien de nouveau n’est justifié (aucun cours, contenu déjà très fourni sur les faiblesses), ne crée pas de commit vide.
4. Termine par un résumé de 3 lignes : ce qui a été ajouté, les topics ciblés et pourquoi.
