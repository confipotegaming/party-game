# Version 0.1.17

## Nouveau mini-jeu : 📊 Le Grand Sondage
- Principe des jeux de sondage familiaux : une question (« Citez quelque chose que… »), un tableau de réponses cachées
  classées par popularité ; trouvez les réponses les plus citées.
- Tout le monde propose en même temps depuis son téléphone. Bonne réponse : la case se retourne sur tous les écrans,
  avec le nombre de votes, le nom du joueur, « +38 » animé et un son. Mauvaise réponse : grande croix ❌ sur l'écran de l'hôte et une faute ;
  3 fautes et on est éliminé·e de la manche. « Déjà trouvée » et « soyez plus précis·e » ne coûtent pas de faute.
- Fin de manche : tableau complet, temps écoulé ou tout le monde éliminé. Les réponses manquées sont dévoilées sur
  l'écran de résultats habituel (« Suivant »), puis classement final de la soirée.
- Points = votes de la réponse × multiplicateur de la manche (×1, ×1, ×2, ×3 par défaut). Ils s'ajoutent au score global.
- L'hôte choisit un thème (ou « Tous les thèmes ») ; la difficulté monte au fil des manches et fixe le nombre de réponses
  (5 / 6 / 8) et le temps (60 / 75 / 90 s). Tout est réglable dans `games/sondage/config.js`.
- Reconnaissance des réponses côté serveur : accents, majuscules, espaces, articles et possessifs, pluriels, ordre des
  mots, fautes de frappe légères (1 dès 6 lettres, 2 dès 12), synonymes globaux et variantes propres à chaque réponse.
  Une proposition partielle (« brosse ») ou proche de deux réponses n'est pas acceptée.
- Jouable dès 1 joueur.

## Questions et back-office
- Questions séparées du code, dans `data/sondage.json` (tables `questions` et `answers`), 18 questions de démonstration
  dans 16 catégories.
- Back-office : `/sondage-admin.html` (ajout, modification, suppression, activation, réponses, votes, variantes,
  filtres par catégorie / difficulté / état, recherche, test d'une proposition, import JSON / CSV / URL, export JSON).
  Accessible depuis l'ordinateur hôte, ou partout avec la variable d'environnement `ADMIN_TOKEN`.
- Import en ligne de commande : `npm run sondage:import -- fichier.json|fichier.csv|URL [--replace]`
  (exemple CSV : `data/sondage-exemple.csv`).

## Moteur
- Nouvel évènement générique `player:action` : un jeu peut recevoir plusieurs actions d'un joueur pendant une phase,
  les valider côté serveur et renvoyer le résultat au joueur.
- `api.end()` termine la phase en cours avant la fin du chrono.
- Un jeu peut exposer sa propre API HTTP (`router`), montée sur `/api/games/<id>`.
- Tests : `npm test` (reconnaissance, base de questions, déroulé du jeu et non-régression de tous les mini-jeux).
- Version serveur et package : 0.1.17.
