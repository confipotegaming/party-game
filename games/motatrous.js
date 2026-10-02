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
// d : difficulté (1 facile, 2 moyen, 3 difficile).
const Q = (d, cat, a, ...alias) => ({ d, p: `Mot à retrouver (${cat})`, a, alias });
module.exports = mk({
  id: 'motatrous', category: 'Culture générale', name: 'Mot à trous', rounds: 5, clueSeconds: 12, categories: ['Culture générale', 'Géographie', 'Sciences', 'Gastronomie', 'Sport'],
  desc: 'Des lettres se dévoilent peu à peu : trouvez le mot avant les autres.',
  clues: (q) => [0, 1, 2].map(s => mask(q.a, s)),
  questions: [
    // ★ Facile
    Q(1, 'un pain', 'baguette'), Q(1, 'une gourmandise', 'chocolat'), Q(1, 'un animal', 'éléphant'),
    Q(1, 'un sport', 'football'), Q(1, 'un pays', 'Espagne'), Q(1, 'une ville de France', 'Marseille'),
    Q(1, 'un appareil', 'ordinateur'), Q(1, 'un objet', 'parapluie'), Q(1, 'un fruit', 'fraise'),
    Q(1, 'une période de l\'année', 'vacances'), Q(1, 'un animal marin', 'dauphin'), Q(1, 'une saison', 'printemps'),
    Q(1, 'une fête', 'anniversaire'), Q(1, 'un moyen de transport', 'trottinette'), Q(1, 'un instrument', 'guitare'),
    Q(1, 'une région', 'Bretagne'), Q(1, 'un légume', 'carotte'), Q(1, 'un métier', 'pompier'),
    // ★★ Moyen
    Q(2, 'un animal', 'hippopotame'), Q(2, 'un pays', 'Argentine'), Q(2, 'un fruit', 'framboise'),
    Q(2, 'une ville de France', 'Strasbourg'), Q(2, 'un sport', 'badminton'), Q(2, 'un ustensile de cuisine', 'casserole'),
    Q(2, 'un monument de Paris', 'Arc de Triomphe'), Q(2, 'un fromage', 'camembert'), Q(2, 'une planète', 'Jupiter'),
    Q(2, 'une viennoiserie', 'croissant'), Q(2, 'un animal', 'kangourou'), Q(2, 'un instrument', 'saxophone'),
    Q(2, 'un sport', 'escalade'), Q(2, 'un légume', 'aubergine'), Q(2, 'une ville de France', 'Bordeaux'),
    Q(2, 'un commerce', 'boulangerie'), Q(2, 'un objet', 'thermomètre'), Q(2, 'un métier', 'astronaute'),
    Q(2, 'un moyen de transport', 'hélicoptère'), Q(2, 'un animal', 'caméléon'), Q(2, 'un plat savoyard', 'tartiflette'),
    Q(2, 'un plat provençal', 'ratatouille'), Q(2, 'une capitale', 'Lisbonne'),
    // ★★★ Difficile
    Q(3, 'un instrument', 'violoncelle'), Q(3, 'un animal', 'ornithorynque'), Q(3, 'un pays', 'Kazakhstan'),
    Q(3, 'un fromage', 'reblochon'), Q(3, 'une capitale', 'Ouagadougou'), Q(3, 'une fleur', 'chrysanthème'),
    Q(3, 'un objet médical', 'stéthoscope'), Q(3, 'une région antique', 'Mésopotamie'), Q(3, 'un arbuste', 'rhododendron'),
    Q(3, 'un fruit', 'pamplemousse'), Q(3, 'un instrument', 'xylophone'), Q(3, 'un pays', 'Liechtenstein'),
    Q(3, 'un phénomène biologique', 'photosynthèse'), Q(3, 'un examen', 'baccalauréat'), Q(3, 'un monument', 'Mont-Saint-Michel', 'Mont Saint Michel'),
    Q(3, 'un métier', 'paléontologue'), Q(3, 'un plat marseillais', 'bouillabaisse'), Q(3, 'une capitale', 'Copenhague'),
    Q(3, 'un ensemble d\'îles', 'archipel'),
  ],
});
