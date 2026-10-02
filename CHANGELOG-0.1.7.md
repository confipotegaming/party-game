# Party Game v0.1.7

## Dessine-moi ça
- Synchronisation temps réel du canvas téléphone → écran hôte avec paquets courts et accusés de réception.
- Resynchronisation automatique du dessin côté hôte toutes les secondes pendant la manche.
- Snapshot complet conservé côté serveur pour récupérer un dessin même après une perte de paquet.
- Effacement synchronisé et coordonnées normalisées/validées côté serveur.
- Canvas tactile renforcé avec `touch-action: none`, pointer capture et envoi progressif des traits.

## Avatars
- Suppression de trois illustrations qui présentaient des éléments graphiques incomplets.
- Galerie conservée avec 15 avatars illustrés cohérents et vérifiés.
- Vérification des pixels alpha : plus aucun trou transparent interne dans les PNG conservés.

## Technique
- Version serveur/package passée en 0.1.7.
- Tous les fichiers JavaScript et scripts inline HTML passent le contrôle de syntaxe.
