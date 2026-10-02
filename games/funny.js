module.exports = require('./_textvote')({
  id: 'funny', category: 'Humour', name: 'Réponse la plus drôle', title: 'Écrivez votre réponse', categories: ['Humour', 'Vie quotidienne', 'Cinéma'],
  desc: 'Une question absurde, vous écrivez, on vote pour la meilleure.',
  prompts: [
    'La pire excuse pour arriver en retard à un mariage :',
    'Le nom du pire super-héros de l\'histoire :',
    'Ce qu\'il ne faut jamais dire à son boulanger :',
    'Le titre du film le moins attendu de l\'année :',
    'Une règle absurde qu\'un pays aurait vraiment inventée :',
    'Ce que le chat pense vraiment de nous :',
    'Le pire cadeau à offrir à sa belle-mère :',
    'La phrase qu\'on entend juste avant une catastrophe :',
    'Le slogan d\'un dentiste peu rassurant :',
    'Un métier qui n\'existe pas encore mais qui devrait :',
  ],
});
