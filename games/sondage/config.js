// Le Grand Sondage : réglages du mode de jeu (modifiables sans toucher à la logique).

// Catégories proposées par défaut. Une question peut utiliser n'importe quelle autre catégorie :
// la liste affichée (back-office, choix de l'hôte) est l'union de celle-ci et des catégories utilisées.
const CATEGORIES = [
  'Vie quotidienne', 'Nourriture', 'Famille', 'Travail', 'École', 'Vacances', 'Sport', 'Animaux',
  'Technologie', 'Cinéma', 'Musique', 'Jeux vidéo', 'France', 'Culture générale', 'Relations', 'Enfants',
];

// La difficulté influence le nombre de réponses à trouver (les moins évidentes en plus),
// le temps de la manche et, si on le souhaite, un multiplicateur de points.
const DIFFICULTIES = {
  facile: { label: 'Facile', maxAnswers: 5, seconds: 60, pointsMultiplier: 1 },
  moyen: { label: 'Moyen', maxAnswers: 6, seconds: 75, pointsMultiplier: 1 },
  difficile: { label: 'Difficile', maxAnswers: 8, seconds: 90, pointsMultiplier: 1 },
};

// Déroulé d'une partie : une entrée par manche (difficulté visée + multiplicateur de manche).
const ROUNDS = [
  { difficulty: 'facile', multiplier: 1 },
  { difficulty: 'moyen', multiplier: 1 },
  { difficulty: 'moyen', multiplier: 2 },
  { difficulty: 'difficile', multiplier: 3 },
];

module.exports = {
  CATEGORIES,
  DIFFICULTIES,
  ROUNDS,
  MAX_STRIKES: 3,          // fautes autorisées par joueur et par manche
  HIDE_POINTS: true,       // true : les points d'une réponse restent cachés jusqu'à sa découverte
  REVEAL_SECONDS: 12,      // durée de l'écran de fin de manche (le bouton « Suivant » reste disponible)
  GUESS_COOLDOWN_MS: 500,  // anti-spam : délai minimal entre deux propositions d'un même joueur
  MAX_GUESS_LENGTH: 60,
  EVENTS_KEPT: 6,          // derniers évènements affichés (trouvé, faute…)
  LANGUAGE: 'fr',
};
