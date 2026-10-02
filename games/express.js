const mk = require('./_textquiz');
const Q = (q, a, ...alias) => ({ p: 'Répondez vite !', clues: [q], a, alias });
module.exports = mk({
  id: 'express', category: 'Culture générale', name: 'Réponse express', rounds: 8, clueSeconds: 8, categories: ['Culture générale', 'Géographie', 'Sciences', 'Sport', 'Vie quotidienne'],
  desc: 'Des questions simples, mais seulement 8 secondes pour répondre.',
  questions: [
    Q('Capitale de l\'Italie ?', 'Rome'), Q('Couleur du cheval blanc d\'Henri IV ?', 'blanc'),
    Q('Combien de jours dans une semaine ?', '7', 'sept'), Q('Le plus grand océan du monde ?', 'Pacifique', 'océan Pacifique'),
    Q('Capitale de l\'Espagne ?', 'Madrid'), Q('Combien de côtés a un hexagone ?', '6', 'six'),
    Q('Quel fleuve traverse Paris ?', 'La Seine', 'Seine'), Q('Quelle planète est surnommée la planète rouge ?', 'Mars'),
    Q('Combien de joueurs sur le terrain dans une équipe de foot ?', '11', 'onze'),
    Q('Quelle langue parle-t-on au Brésil ?', 'portugais'), Q('Quel animal miaule ?', 'chat', 'un chat'),
    Q('2 + 2 × 2 = ?', '6', 'six'), Q('Quel mois suit janvier ?', 'février', 'fevrier'),
    Q('Le plus grand mammifère marin ?', 'baleine bleue', 'baleine'), Q('Combien de minutes dans une heure ?', '60', 'soixante'),
    Q('Quelle est la capitale de l\'Allemagne ?', 'Berlin'),
  ],
});
