# Version 0.2.0

## 📺 Refonte complète : « Les Confipotes · Le Show »
Tout le site devient le plateau d'une émission TV prime time, entre game show américain et Buzz! sur PS2,
avec une direction artistique sombre, premium et beaucoup plus spectaculaire.

- **Nouvelle identité visuelle** (`public/showtv.css`) : studio bleu nuit, projecteurs qui balaient la scène,
  silhouettes du public, murs LED, néons. Typographie massive et condensée (Anton, Barlow Condensed),
  couleurs saturées (bleu électrique, magenta, jaune, cyan, violet, orange) réservées aux moments forts.
- **Max Paillettes, le présentateur** (`public/mascot.js`) : une mascotte en relief avec une tête-télé,
  une veste à paillettes et un micro. Son visage change sur l'écran (sourire en coin, yeux étoilés, regard caméra,
  yeux en croix…) et il prend la pose selon la situation : victoire, écrasement total, défaite, égalité,
  come-back, record, élimination, suspense, grande finale. Il commente la partie dans une bulle, avec des
  répliques volontairement insolentes.
- **Régie automatique** (`public/showfx.js`) : confettis, flashs, secousses, bandeaux plein écran
  (« ÉPREUVE 03 », « ROUND 02 », « NOUVEAU LEADER ! », « QUEL COME-BACK ! », « ÉGALITÉ ! »), « +500 POINTS »
  qui s'envolent, scores qui défilent, chrono qui s'emballe dans les 5 dernières secondes, étincelles à chaque clic.
- **Page d'accueil** façon générique d'émission : logo géant sur écran LED, caméras de plateau, présentateur,
  gros bouton JOUER MAINTENANT (créer le plateau sur grand écran, rejoindre sur téléphone), bandeau défilant
  et programme complet des épreuves avec leur numéro, leur accroche, leur intensité et un bouton LANCER L'ÉPREUVE.
- **Écran de l'hôte** : code de partie en lettres LED, candidats sur leurs podiums, le présentateur sur scène,
  chaque mini-jeu présenté comme une épreuve numérotée, et un pupitre de lancement toujours visible.
- **Grande finale** : podium révélé marche par marche (3ᵉ, 2ᵉ, roulement de tambour, CHAMPION !), titre qui
  s'adapte (Champion / Écrasement total / Égalité), puis trophées de la soirée : machine à points,
  meilleur come-back, roi du chaos, catastrophe de la soirée et records personnels (gardés sur l'appareil de l'hôte).
- **Téléphone** : même univers, présentateur compact qui réagit à vos points, et un vrai écran de résultat
  (place XXL, score, classement). Le présentateur s'efface pendant les jeux d'action pour ne pas gêner.
- Nouvelle route `GET /api/catalog` pour afficher le programme des épreuves sur l'accueil.
