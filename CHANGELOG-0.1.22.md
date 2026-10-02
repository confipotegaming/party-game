# Version 0.1.22

## 🎲 Nouveau : le mode plateau (façon Mario Party)
- Depuis le lobby, **« Lancer le plateau »** : on choisit le nombre de tours (3, 5, 8 ou 10) et la difficulté des questions.
- À chaque tour, **une roue tourne** sur l'écran de l'hôte et désigne le mini-jeu à jouer, qui se lance tout seul.
- Chaque mini-jeu rapporte des **points de plateau selon la place** : 🥇 10 · 🥈 6 · 🥉 4 · 3 · 2 · 1, le dernier ne marque rien
  (les ex æquo partagent la meilleure place). **Le dernier tour compte double.**
- Entre deux mini-jeux, **le plateau** montre la course des joueurs vers l'arrivée 🏁, les points gagnés et les jeux déjà joués.
- Le plus gros total gagne ; en cas d'égalité, le nombre de mini-jeux gagnés départage.
- L'hôte peut **passer un mini-jeu** (personne ne marque, la roue retourne) ou quitter le plateau.

## 🎯 Un tirage vraiment varié
- Aucun mini-jeu ne revient avant que **tous les autres** soient sortis dans la partie.
- Jamais la même **famille de gameplay** (écriture + vote, devinettes, quiz de culture, jeux téléphone…) que l'un des 3 derniers jeux.
- Les jeux joués récemment dans la soirée (plateau ou non) sont écartés : une nouvelle partie ne reprend pas les mêmes jeux.
- Bonus pour les jeux et familles les moins joués, pénalité pour un thème identique au jeu précédent.
- Seuls les jeux jouables avec le nombre de joueurs présents peuvent sortir.
- **Le jeu du boss est exclu de la roue** (id contenant « boss », ou `boss: true` / `board: false` dans son module).
