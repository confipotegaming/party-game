// Un joueur dessine sur son téléphone, le dessin apparaît sur l'écran de l'hôte, les autres devinent.
const { shuffle, norm, matches } = require('./_textquiz');
const W = (w, ...alias) => ({ w, alias });
const WORDS = [
  W('chat'), W('maison'), W('pizza'), W('tour Eiffel', 'eiffel'), W('bateau'), W('éléphant', 'elephant'),
  W('guitare'), W('vélo', 'velo'), W('parapluie'), W('robot'), W('fantôme', 'fantome'), W('escargot'),
  W('volcan'), W('lunettes'), W('dragon'), W('fusée', 'fusee'), W('sapin'), W('baleine'),
];

function ask(room, api) {
  const g = room.g, ids = api.ids();
  if (ids.length < 2) return api.finish();
  const cand = g.order[g.i % g.order.length], d = ids.includes(cand) ? cand : ids[0];
  const wd = g.words[g.i];
  g.cur = { d, wd };
  api.setPhase({
    kind: 'draw', step: 'draw', title: 'Dessin', prompt: 'Devinez le dessin !', round: g.i + 1, rounds: g.rounds,
    duration: 70, drawer: d, data: { drawer: d }, private: { [d]: { word: wd.w } },
    accepted: [wd.w, ...wd.alias].map(norm), expected: ids.filter(x => x !== d),
  });
}

module.exports = {
  id: 'dessin', category: 'Objets & quotidien', name: 'Dessine-moi ça', words: WORDS, categories: ['Objets & quotidien', 'Animaux', 'Lieux', 'Technologie'],
  desc: 'Dessinez sur votre téléphone, les autres devinent sur l\'écran.',
  start(room, api) {
    const order = shuffle(api.ids());
    room.g = { order, words: shuffle(WORDS), i: 0, rounds: Math.min(4, order.length) };
    ask(room, api);
  },
  validate(ph, pid, v) {
    if (ph.step !== 'draw') return;
    const g = norm(v);
    if (!g || !matches(ph.accepted, g)) return;
    const left = Math.max(0, (ph.endsAt - Date.now()) / (ph.duration * 1000));
    return Math.round(1000 * (0.4 + 0.6 * left) / 10) * 10;
  },
  onEnd(room, ph, api) {
    const g = room.g, { d, wd } = g.cur;
    if (ph.step === 'draw') {
      const found = Object.entries(ph.answers).sort((a, b) => b[1] - a[1]);
      found.forEach(([pid, pts]) => api.addScore(pid, pts));
      api.addScore(d, found.length * 200);
      return api.setPhase({
        kind: 'reveal', step: 'reveal', title: `Le mot : ${wd.w}`, prompt: ph.prompt, round: ph.round, rounds: g.rounds, duration: 6,
        lines: [
          { main: api.name(d) + ' (dessinateur)', sub: `${found.length} joueur(s) ont trouvé`, pts: found.length * 200 },
          ...found.map(([pid, pts]) => ({ main: api.name(pid), sub: 'a trouvé !', pts })),
        ],
      });
    }
    g.i++;
    g.i >= g.rounds ? api.finish() : ask(room, api);
  },
};
