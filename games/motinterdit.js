// Un joueur décrit un mot par écrit, sans dire les mots interdits ; les autres devinent.
const { shuffle, norm, matches } = require('./_textquiz');
const diff = require('./_difficulty');
// d : difficulté du mot à faire deviner (1 facile, 2 moyen, 3 difficile), puis le mot et ses mots interdits.
const W = (d, w, ...f) => ({ d, w, f });
const WORDS = [
  // ★ Facile
  W(1, 'pizza', 'italie', 'fromage', 'tomate', 'four'), W(1, 'plage', 'sable', 'baignade', 'soleil', 'vacances'),
  W(1, 'vélo', 'roue', 'pédale', 'guidon', 'bicyclette'), W(1, 'chocolat', 'cacao', 'tablette', 'dessert', 'noir'),
  W(1, 'avion', 'voler', 'ciel', 'pilote', 'aéroport'), W(1, 'piscine', 'bassin', 'nager', 'plonger', 'maillot'),
  W(1, 'médecin', 'docteur', 'hôpital', 'soigner', 'malade'), W(1, 'cinéma', 'film', 'salle', 'popcorn', 'écran'),
  W(1, 'anniversaire', 'gâteau', 'bougies', 'cadeau', 'fête'), W(1, 'parapluie', 'pluie', 'mouillé', 'ouvrir', 'protéger'),
  W(1, 'chien', 'aboyer', 'animal', 'croquette', 'niche'), W(1, 'école', 'élève', 'professeur', 'classe', 'cartable'),
  W(1, 'neige', 'blanc', 'froid', 'hiver', 'flocon'), W(1, 'téléphone', 'appeler', 'portable', 'sonner', 'smartphone'),
  W(1, 'pomme', 'fruit', 'arbre', 'rouge', 'verte'), W(1, 'oreiller', 'dormir', 'tête', 'coussin', 'plume'),
  // ★★ Moyen
  W(2, 'dentiste', 'dent', 'carie', 'brosse', 'bouche'), W(2, 'volcan', 'lave', 'éruption', 'montagne', 'cratère'),
  W(2, 'pirate', 'bateau', 'trésor', 'perroquet', 'capitaine'), W(2, 'mariage', 'mariée', 'alliance', 'église', 'robe'),
  W(2, 'football', 'ballon', 'gardien', 'équipe', 'match'), W(2, 'Noël', 'cadeau', 'sapin', 'décembre', 'père'),
  W(2, 'fantôme', 'drap', 'peur', 'château', 'hanté'), W(2, 'boulangerie', 'pain', 'baguette', 'croissant', 'boulanger'),
  W(2, 'cirque', 'clown', 'chapiteau', 'jongler', 'acrobate'), W(2, 'réveil', 'matin', 'sonner', 'heure', 'dormir'),
  W(2, 'pharmacie', 'médicament', 'ordonnance', 'croix', 'malade'), W(2, 'camping', 'tente', 'vacances', 'nature', 'caravane'),
  W(2, 'musée', 'tableau', 'œuvre', 'visite', 'exposition'), W(2, 'dictionnaire', 'définition', 'lettres', 'livre', 'alphabet'),
  W(2, 'aimant', 'attirer', 'métal', 'frigo', 'magnétique'), W(2, 'miroir', 'reflet', 'glace', 'regarder', 'visage'),
  // ★★★ Difficile
  W(3, 'nostalgie', 'passé', 'souvenir', 'triste', 'regret'), W(3, 'embouteillage', 'voiture', 'route', 'bouchon', 'circulation'),
  W(3, 'démocratie', 'vote', 'peuple', 'élection', 'pouvoir'), W(3, 'procrastination', 'remettre', 'demain', 'repousser', 'flemme'),
  W(3, 'horoscope', 'signe', 'astrologie', 'étoiles', 'avenir'), W(3, 'écho', 'bruit', 'répéter', 'montagne', 'voix'),
  W(3, 'jalousie', 'envie', 'amoureux', 'couple', 'jaloux'), W(3, 'gravité', 'tomber', 'newton', 'pomme', 'attraction'),
  W(3, 'recyclage', 'poubelle', 'déchets', 'plastique', 'trier'), W(3, 'insomnie', 'dormir', 'nuit', 'sommeil', 'réveillé'),
  W(3, 'bénévole', 'gratuit', 'aider', 'association', 'volontaire'), W(3, 'mirage', 'désert', 'illusion', 'oasis', 'chaleur'),
  W(3, 'hibernation', 'ours', 'hiver', 'dormir', 'sommeil'), W(3, 'photosynthèse', 'plante', 'soleil', 'lumière', 'feuille'),
  W(3, 'paresse', 'fainéant', 'canapé', 'flemme', 'travailler'), W(3, 'courage', 'peur', 'héros', 'brave', 'audace'),
];

function ask(room, api) {
  const g = room.g, ids = api.ids();
  if (ids.length < 2) return api.finish();
  const cand = g.order[g.i % g.order.length], d = ids.includes(cand) ? cand : ids[0];
  const wd = g.words[g.i];
  g.cur = { d, wd };
  api.setPhase({
    kind: 'describe', step: 'describe', title: 'Préparez votre indice', round: g.i + 1, rounds: g.rounds, duration: 40, difficulty: diff.info(wd.d),
    data: { describer: d }, private: { [d]: { word: wd.w, forbidden: wd.f } },
    bad: [wd.w, ...wd.f].map(norm), expected: [d],
  });
}
const next = (room, api) => { const g = room.g; g.i++; g.i >= g.rounds ? api.finish() : ask(room, api); };

module.exports = {
  id: 'motinterdit', category: 'Objets & quotidien', name: 'Le mot interdit', words: WORDS, categories: ['Objets & quotidien', 'Gastronomie', 'Loisirs'],
  desc: 'Faites deviner un mot par écrit sans utiliser les mots interdits.',
  difficulty: true,
  start(room, api) {
    const order = shuffle(api.ids());
    const rounds = Math.min(5, order.length);
    room.g = { order, words: diff.pick(WORDS, rounds, diff.modeOf(room)), i: 0, rounds };
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
      return Math.round(1000 * (0.4 + 0.6 * left) * diff.bonus(ph.difficulty && ph.difficulty.level) / 10) * 10;
    }
  },
  onEnd(room, ph, api) {
    const g = room.g, { d, wd } = g.cur;
    if (ph.step === 'describe') {
      const t = ph.answers[d];
      if (!t) return next(room, api);
      return api.setPhase({
        kind: 'guess', step: 'guess', title: 'Devinez le mot', prompt: `${api.name(d)} fait deviner un mot…`,
        data: { clues: [t], found: [] }, round: ph.round, rounds: g.rounds, duration: 30, difficulty: diff.info(wd.d),
        accepted: [norm(wd.w)], expected: api.ids().filter(x => x !== d),
      });
    }
    if (ph.step === 'guess') {
      const found = Object.entries(ph.answers).sort((a, b) => b[1] - a[1]);
      found.forEach(([pid, pts]) => api.addScore(pid, pts));
      const describerPts = Math.round(found.length * 200 * diff.bonus(wd.d));
      api.addScore(d, describerPts);
      return api.setPhase({
        kind: 'reveal', step: 'reveal', title: `Le mot : ${wd.w}`, prompt: ph.prompt, round: ph.round, rounds: g.rounds, duration: 6, difficulty: diff.info(wd.d),
        lines: [
          { main: api.name(d) + ' (a décrit)', sub: `${found.length} joueur(s) ont trouvé`, pts: describerPts },
          ...found.map(([pid, pts]) => ({ main: api.name(pid), sub: 'a trouvé !', pts })),
        ],
      });
    }
    next(room, api);
  },
};
