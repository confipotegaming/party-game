// Un joueur dessine sur son téléphone, le dessin apparaît sur l'écran de l'hôte, les autres devinent.
const { shuffle, norm, matches } = require('./_textquiz');
const diff = require('./_difficulty');
// d : difficulté du mot à dessiner (1 facile, 2 moyen, 3 difficile).
const W = (d, w, ...alias) => ({ d, w, alias });
const WORDS = [
  // ★ Facile
  W(1, 'chat'), W(1, 'maison'), W(1, 'pizza'), W(1, 'bateau'), W(1, 'soleil'), W(1, 'arbre'), W(1, 'voiture'),
  W(1, 'fleur'), W(1, 'poisson'), W(1, 'lune'), W(1, 'ballon'), W(1, 'gâteau', 'gateau'), W(1, 'banane'),
  W(1, 'escargot'), W(1, 'lunettes'), W(1, 'sapin'), W(1, 'bonhomme de neige'), W(1, 'papillon'),
  W(1, 'serpent'), W(1, 'parapluie'), W(1, 'fusée', 'fusee'), W(1, 'glace'), W(1, 'champignon'),
  // ★★ Moyen
  W(2, 'tour Eiffel', 'eiffel'), W(2, 'éléphant', 'elephant'), W(2, 'guitare'), W(2, 'vélo', 'velo', 'bicyclette'),
  W(2, 'robot'), W(2, 'fantôme', 'fantome'), W(2, 'volcan'), W(2, 'dragon'), W(2, 'baleine'), W(2, 'pirate'),
  W(2, 'château', 'chateau'), W(2, 'girafe'), W(2, 'avion'), W(2, 'arc-en-ciel'), W(2, 'sirène', 'sirene'),
  W(2, 'pingouin', 'manchot'), W(2, 'hélicoptère', 'helico'), W(2, 'phare'), W(2, 'cactus'), W(2, 'crocodile'),
  W(2, 'tortue'), W(2, 'licorne'), W(2, 'clown'), W(2, 'igloo'), W(2, 'pyramide'), W(2, 'dinosaure'),
  W(2, 'téléphone', 'telephone', 'portable'),
  // ★★★ Difficile
  W(3, 'montgolfière', 'montgolfiere'), W(3, 'astronaute', 'cosmonaute'), W(3, 'trampoline'), W(3, 'sous-marin'),
  W(3, 'épouvantail', 'epouvantail'), W(3, 'aspirateur'), W(3, 'pieuvre', 'poulpe'), W(3, 'kangourou'),
  W(3, 'embouteillage', 'bouchon'), W(3, 'statue de la Liberté', 'statue de la liberte'), W(3, 'cerf-volant'),
  W(3, 'moustique'), W(3, 'sablier'), W(3, 'toboggan'), W(3, 'grille-pain'), W(3, 'ascenseur'),
  W(3, 'chauve-souris'), W(3, 'feu d\'artifice', 'feux d artifice'), W(3, 'hamac'), W(3, 'tremblement de terre', 'séisme', 'seisme'),
  W(3, 'boussole'), W(3, 'tondeuse'),
];

function ask(room, api) {
  const g = room.g, ids = api.ids();
  if (ids.length < 2) return api.finish();
  const cand = g.order[g.i % g.order.length], d = ids.includes(cand) ? cand : ids[0];
  const wd = g.words[g.i];
  g.cur = { d, wd };
  api.setPhase({
    kind: 'draw', step: 'draw', title: 'Dessin', prompt: 'Devinez le dessin !', round: g.i + 1, rounds: g.rounds, difficulty: diff.info(wd.d),
    duration: 70, drawer: d, data: { drawer: d }, private: { [d]: { word: wd.w } },
    accepted: [wd.w, ...wd.alias].map(norm), expected: ids.filter(x => x !== d),
  });
}

module.exports = {
  id: 'dessin', category: 'Objets & quotidien', name: 'Dessine-moi ça', words: WORDS, categories: ['Objets & quotidien', 'Animaux', 'Lieux', 'Technologie'],
  desc: 'Dessinez sur votre téléphone, les autres devinent sur l\'écran.',
  difficulty: true,
  start(room, api) {
    const order = shuffle(api.ids());
    const rounds = Math.min(4, order.length);
    room.g = { order, words: diff.pick(WORDS, rounds, diff.modeOf(room)), i: 0, rounds };
    ask(room, api);
  },
  validate(ph, pid, v) {
    if (ph.step !== 'draw') return;
    const g = norm(v);
    if (!g || !matches(ph.accepted, g)) return;
    const left = Math.max(0, (ph.endsAt - Date.now()) / (ph.duration * 1000));
    return Math.round(1000 * (0.4 + 0.6 * left) * diff.bonus(ph.difficulty && ph.difficulty.level) / 10) * 10;
  },
  onEnd(room, ph, api) {
    const g = room.g, { d, wd } = g.cur;
    if (ph.step === 'draw') {
      const found = Object.entries(ph.answers).sort((a, b) => b[1] - a[1]);
      found.forEach(([pid, pts]) => api.addScore(pid, pts));
      const drawerPts = Math.round(found.length * 200 * diff.bonus(wd.d));
      api.addScore(d, drawerPts);
      return api.setPhase({
        kind: 'reveal', step: 'reveal', title: `Le mot : ${wd.w}`, prompt: ph.prompt, round: ph.round, rounds: g.rounds, duration: 6, difficulty: diff.info(wd.d),
        lines: [
          { main: api.name(d) + ' (dessinateur)', sub: `${found.length} joueur(s) ont trouvé`, pts: drawerPts },
          ...found.map(([pid, pts]) => ({ main: api.name(pid), sub: 'a trouvé !', pts })),
        ],
      });
    }
    g.i++;
    g.i >= g.rounds ? api.finish() : ask(room, api);
  },
};
