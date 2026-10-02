const mk = require('./_textquiz');
const Q = (e, a, ...alias) => ({ e: e.join('   '), a, alias });
const letters = (w) => [...w].filter(c => /\p{L}/u.test(c)).length;
module.exports = mk({
  id: 'quatreimages', category: 'Culture pop', name: '4 images 1 mot', rounds: 5, clueSeconds: 20, prompt: 'Quel mot relie ces 4 images ?', categories: ['Culture pop', 'Voyage & lieux', 'Gastronomie', 'Sport', 'Vie quotidienne'],
  desc: 'Quatre emojis, un seul mot en commun. Un indice arrive si ça traîne.',
  clues: (q) => [q.e, `Indice : ${letters(q.a)} lettres`],
  questions: [
    Q(['🌞', '🏖️', '🍹', '🕶️'], 'vacances', 'les vacances', 'été', 'ete'),
    Q(['🎂', '🕯️', '🎁', '🎈'], 'anniversaire', 'fête', 'fete'),
    Q(['🔥', '🏕️', '🌲', '⛺'], 'camping', 'camp'),
    Q(['☔', '🌧️', '🌂', '⛈️'], 'pluie', 'la pluie'),
    Q(['🍕', '🍝', '🍷', '🛵'], 'Italie', 'l\'Italie'),
    Q(['❄️', '⛷️', '🏔️', '🧣'], 'hiver', 'ski', 'neige', 'montagne'),
    Q(['📚', '✏️', '🎒', '🏫'], 'école', 'ecole', 'rentrée', 'la rentrée'),
    Q(['🥖', '🧀', '🍷', '🗼'], 'France', 'la France'),
    Q(['⚽', '🏆', '🥅', '🏟️'], 'football', 'foot'),
    Q(['🌙', '⭐', '🛏️', '😴'], 'nuit', 'dodo', 'sommeil', 'dormir'),
  ],
});
