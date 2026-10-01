const mk = require('./_choice');
const Q = (items, r) => ({ p: 'Quel est l\'intrus ?', options: items.map((t, i) => (i === 0 ? { t, ok: true, r } : { t })) });
module.exports = mk({
  id: 'intrus', name: 'L\'intrus', rounds: 6, points: 500, mode: 'correct', title: 'Trouvez l\'intrus', seconds: 20, revealSeconds: 8,
  desc: 'Quatre propositions, une seule ne va pas avec les autres.',
  revealTitle: (q) => `L'intrus : ${q.options.find(o => o.ok).t}`,
  questions: [
    Q(['Carotte', 'Pomme', 'Poire', 'Banane'], 'C\'est un légume, les autres sont des fruits.'),
    Q(['Madrid', 'Paris', 'Lyon', 'Marseille'], 'Les autres sont des villes françaises.'),
    Q(['Triangle', 'Rouge', 'Bleu', 'Vert'], 'Ce n\'est pas une couleur.'),
    Q(['Tamise', 'Seine', 'Loire', 'Rhône'], 'Les autres sont des fleuves français.'),
    Q(['Loup', 'Lion', 'Tigre', 'Panthère'], 'Ce n\'est pas un félin.'),
    Q(['Lune', 'Mars', 'Vénus', 'Saturne'], 'C\'est un satellite, les autres sont des planètes.'),
    Q(['Natation', 'Football', 'Basket', 'Handball'], 'Les autres se jouent avec un ballon.'),
    Q(['Molière', 'Mozart', 'Beethoven', 'Bach'], 'C\'est un écrivain, les autres sont des compositeurs.'),
  ],
});
