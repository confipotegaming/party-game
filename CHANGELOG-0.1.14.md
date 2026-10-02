# Version 0.1.14

## Nouveau mini-jeu : 🧠 Cerveau Turbo
- 60 secondes pour enchaîner un maximum de mini-défis, chacun sur son téléphone, tous en même temps.
- « PRÊT ? » puis 3… 2… 1… GO ! synchronisés sur les téléphones et l'écran de l'hôte.
- 18 types de défis répartis en 5 familles, alternées pour faire réfléchir, mémoriser et réagir :
  - 🧮 Calcul : addition, soustraction, multiplication, nombre manquant, calcul en chaîne.
  - 🧩 Logique : suite logique, intrus, comparaison (qui apparaît le moins / le plus), formes qui se répètent.
  - 🧠 Mémoire : symbole à retrouver (position ou ordre), bonneteau de cartes, séquence de couleurs à reproduire.
  - ⚡ Réflexes : « clique sur le rouge » (avec piège de couleur), feu vert (avec faux départs), « touche uniquement ⭐ ».
  - 🔢 Rapidité : plus grand / plus petit nombre, comptage, symbole en double.
- Difficulté adaptative : elle monte quand on répond juste et vite, redescend après des erreurs (plus d'éléments,
  calculs plus durs, séquences plus longues, symboles plus petits et ressemblants, moins de temps).
- Score : 100 pts + bonus de rapidité (jusqu'à 50) + bonus de difficulté, multiplié par le combo
  (×2 à 3 bonnes réponses d'affilée, jusqu'à ×5). Erreur : 0 pt, combo remis à zéro et −2 s.
- Animations rapides (particules, points flottants, « COMBO ×3 »), sons et vibration sur téléphone.
- Fin de partie : score, défis réussis, erreurs, précision, temps moyen, meilleur combo, bilan par famille,
  titre (🌱 Débutant, ⭐ Rapide, ⚡ Éclair, 🧠 Génie, 🏆 Maître des réflexes) et records personnels
  (meilleur score, plus grand combo, plus de défis réussis, meilleur temps moyen) avec « NOUVEAU RECORD ! 🏆 ».
- Écran hôte : classement en direct (score, combo, défi en cours), puis résultats avec 🔁 Rejouer,
  🏠 Retour aux mini-jeux et 🏆 Classement final. Les points s'ajoutent au classement de la soirée.
- Jouable dès 1 joueur.

## Moteur
- Un jeu peut fixer son nombre minimum de joueurs (`minPlayers`).
- Nouveaux évènements génériques : `progress` (progression en direct relayée à l'hôte) et `host:action`
  (action propre au jeu, ex. « Rejouer »).
- Version serveur et package : 0.1.14.
