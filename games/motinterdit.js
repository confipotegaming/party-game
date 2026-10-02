// Un joueur décrit un mot par écrit, sans dire les mots interdits ; les autres devinent.
const { shuffle, norm, matches } = require('./_textquiz');
const W = (w, ...f) => ({ w, f });
const WORDS = [
  W('pizza', 'italie', 'fromage', 'tomate', 'four'), W('plage', 'sable', 'mer', 'soleil', 'vacances'),
  W('vélo', 'roue', 'pédale', 'guidon', 'bicyclette'), W('chocolat', 'cacao', 'tablette', 'dessert', 'noir'),
  W('avion', 'voler', 'ciel', 'pilote', 'aéroport'), W('piscine', 'eau', 'nager', 'plonger', 'maillot'),
  W('médecin', 'docteur', 'hôpital', 'soigner', 'malade'), W('cinéma', 'film', 'salle', 'popcorn', 'écran'),
  W('anniversaire', 'gâteau', 'bougies', 'cadeau', 'fête'), W('parapluie', 'pluie', 'mouillé', 'ouvrir', 'protéger'),
];

function ask(room, api) {
  const g = room.g, ids = api.ids();
  if (ids.length < 2) return api.finish();
  const cand = g.order[g.i % g.order.length], d = ids.includes(cand) ? cand : ids[0];
  const wd = g.words[g.i];
  g.cur = { d, wd };
  api.setPhase({
    kind: 'describe', step: 'describe', title: 'Préparez votre indice', round: g.i + 1, rounds: g.rounds, duration: 40,
    data: { describer: d }, private: { [d]: { word: wd.w, forbidden: wd.f } },
    bad: [wd.w, ...wd.f].map(norm), expected: [d],
  });
}
const next = (room, api) => { const g = room.g; g.i++; g.i >= g.rounds ? api.finish() : ask(room, api); };

module.exports = {
  id: 'motinterdit', category: 'Objets & quotidien', name: 'Le mot interdit', words: WORDS, categories: ['Objets & quotidien', 'Gastronomie', 'Loisirs'],
  desc: 'Faites deviner un mot par écrit sans utiliser les mots interdits.',
  start(room, api) {
    const order = shuffle(api.ids());
    room.g = { order, words: shuffle(WORDS), i: 0, rounds: Math.min(5, order.length) };
    ask(room, api);
  },
  validate(ph, pid, v) {
    if (ph.step === 'describe') {
      const t = String(v || '').trim().slice(0, 120);
      if (!t) return;
      const toks = norm(t).split(' ');
      return ph.bad.some(x => toks.some(tk => tk.includes(x))) ? undefined : t;
    }
    if (ph.step === 'guess') {
      const g = norm(v);
      if (!g || !matches(ph.accepted, g)) return;
      const left = Math.max(0, (ph.endsAt - Date.now()) / (ph.duration * 1000));
      return Math.round(1000 * (0.4 + 0.6 * left) / 10) * 10;
    }
  },
  onEnd(room, ph, api) {
    const g = room.g, { d, wd } = g.cur;
    if (ph.step === 'describe') {
      const t = ph.answers[d];
      if (!t) return next(room, api);
      return api.setPhase({
        kind: 'guess', step: 'guess', title: 'Devinez le mot', prompt: `${api.name(d)} fait deviner un mot…`,
        data: { clues: [t], found: [] }, round: ph.round, rounds: g.rounds, duration: 30,
        accepted: [norm(wd.w)], expected: api.ids().filter(x => x !== d),
      });
    }
    if (ph.step === 'guess') {
      const found = Object.entries(ph.answers).sort((a, b) => b[1] - a[1]);
      found.forEach(([pid, pts]) => api.addScore(pid, pts));
      api.addScore(d, found.length * 200);
      return api.setPhase({
        kind: 'reveal', step: 'reveal', title: `Le mot : ${wd.w}`, prompt: ph.prompt, round: ph.round, rounds: g.rounds, duration: 6,
        lines: [
          { main: api.name(d) + ' (a décrit)', sub: `${found.length} joueur(s) ont trouvé`, pts: found.length * 200 },
          ...found.map(([pid, pts]) => ({ main: api.name(pid), sub: 'a trouvé !', pts })),
        ],
      });
    }
    next(room, api);
  },
};
