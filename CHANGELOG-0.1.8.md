# Version 0.1.8

## Écran Host
- Correction du blocage de l’interface après le lancement d’un jeu : les fonctions d’affichage de manche (`head`, `progress`, `nameOf`) étaient absentes.
- Ajout d’une vue générique de secours pour toute phase inconnue.
- Affichage en direct de la phase, du titre, de la catégorie, de la manche, du chrono et de la progression des réponses.
- Gestion d’erreur côté serveur pour éviter qu’une exception d’un jeu laisse l’Host figé sur le menu.
- Le Host peut revenir au lobby depuis une erreur.

## Moteur
- Version serveur et package : 0.1.8.
