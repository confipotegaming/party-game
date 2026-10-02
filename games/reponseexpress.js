const mk = require('./_textquiz');
const Q = (q, a, ...alias) => ({ clues: [q], a, alias });
module.exports = mk({
  id: 'reponseexpress', category: 'Culture générale', name: 'Réponse express', rounds: 8, clueSeconds: 8, prompt: 'Vite !', categories: ['Culture générale', 'Géographie', 'Sciences', 'Sport', 'Vie quotidienne'],
  desc: 'Des questions toutes simples, mais seulement 8 secondes pour répondre.',
  questions: [
    Q('Capitale de l\'Italie ?', 'Rome'), Q('Combien de côtés a un hexagone ?', '6', 'six'),
    Q('Bleu + jaune = quelle couleur ?', 'vert'), Q('Quel fleuve traverse Paris ?', 'la Seine'),
    Q('7 × 8 = ?', '56', 'cinquante six'), Q('Quelle planète est surnommée la planète rouge ?', 'Mars'),
    Q('Capitale de l\'Espagne ?', 'Madrid'), Q('Quel est l\'animal terrestre le plus rapide ?', 'le guépard', 'guepard'),
    Q('Combien de joueurs sur le terrain pour une équipe de foot ?', '11', 'onze'),
    Q('Quel est le plus grand océan ?', 'Pacifique', 'océan Pacifique'), Q('Formule chimique de l\'eau ?', 'H2O'),
    Q('Combien de lettres dans l\'alphabet ?', '26', 'vingt six'), Q('Capitale de l\'Allemagne ?', 'Berlin'),
    Q('Quel animal est surnommé le roi de la jungle ?', 'le lion'),
  ],
});
