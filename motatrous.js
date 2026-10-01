const mk = require('./_textquiz');
const isLetter = (c) => /\p{L}/u.test(c);
// Dévoile de plus en plus de lettres : 1 seule, puis un tiers, puis deux tiers.
function mask(word, step) {
  const chars = [...word];
  const idx = chars.map((_, i) => i).filter(i => isLetter(chars[i]));
  const mid = idx.slice(1, -1);
  const order = [idx[0], idx[idx.length - 1], ...mid.filter((_, i) => i % 2 === 0), ...mid.filter((_, i) => i % 2)];
  const n = step === 0 ? 1 : Math.ceil(idx.length * (step === 1 ? 1 / 3 : 2 / 3));
  const shown = new Set(order.slice(0, Math.max(1, n)));
  return chars.map((c, i) => (!isLetter(c) ? (c === ' ' ? '\u00a0\u00a0' : c) : shown.has(i) ? c.toUpperCase() : '_')).join(' ');
}
const Q = (cat, a, ...alias) => ({ p: `Mot à retrouver (${cat})`, a, alias });
module.exports = mk({
  id: 'motatrous', name: 'Mot à trous', rounds: 5, clueSeconds: 12,
  desc: 'Des lettres se dévoilent peu à peu : trouvez le mot avant les autres.',
  clues: (q) => [0, 1, 2].map(s => mask(q.a, s)),
  questions: [
    Q('un pain', 'baguette'), Q('un animal', 'hippopotame'), Q('un pays', 'Argentine'),
    Q('un fruit', 'framboise'), Q('un instrument', 'violoncelle'), Q('une ville de France', 'Strasbourg'),
    Q('un sport', 'badminton'), Q('un ustensile de cuisine', 'casserole'),
    Q('un monument de Paris', 'Arc de Triomphe'), Q('un fromage', 'camembert'), Q('une planète', 'Jupiter'),
  ],
});
