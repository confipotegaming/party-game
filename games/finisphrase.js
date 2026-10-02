const mk = require('./_writevote');
module.exports = mk({
  id: 'finisphrase', category: 'Humour', name: 'Finis la phrase', rounds: 4, title: 'Complétez la phrase', categories: ['Humour', 'Vie quotidienne', 'Famille'],
  desc: 'Une phrase commence, vous la finissez de la façon la plus drôle. On vote.',
  prompts: [
    'Ma grand-mère m\'a toujours dit que le secret du bonheur, c\'est…',
    'Ce matin, j\'ai failli être en retard parce que…',
    'Le jour où j\'ai rencontré le président, j\'ai simplement dit…',
    'Mon super-pouvoir inutile, c\'est…',
    'Si j\'étais maire, la première chose que j\'interdirais, ce serait…',
    'Dans ma prochaine vie, je veux être…',
    'Le plus grand mensonge de ma vie, c\'est quand j\'ai dit que…',
    'Le médecin m\'a dit d\'arrêter immédiatement de…',
    'Ce qui me réveille la nuit, c\'est…',
    'Je ne comprendrai jamais pourquoi les gens…',
  ],
});
