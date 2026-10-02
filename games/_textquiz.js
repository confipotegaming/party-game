// Fabrique de jeux « texte → vérification automatique ».
// Chaque question a une ou plusieurs indices (révélés petit à petit) et une réponse.
// Plus on trouve tôt (indice et temps restant), plus on gagne de points.
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[’']/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
  .replace(/^(le|la|les|l|un|une|the) /, '');

function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
// Tolère les fautes de frappe sur les réponses longues (1 faute dès 6 lettres, 2 dès 12).
const matches = (accepted, g) =>
  accepted.some(x => x === g || (x.length >= 6 && lev(x, g) <= (x.length >= 12 ? 2 : 1)));

const shuffle = (a) => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

module.exports = function makeTextQuiz(cfg) {
  const rounds = cfg.rounds || 5;
  const clueSeconds = cfg.clueSeconds || 20;
  const cluesOf = cfg.clues || ((q) => q.clues);
  const categoryOf = typeof cfg.category === 'function' ? cfg.category : ((q) => q.category || cfg.category || 'Général');

  function askClue(room, api) {
    const g = room.g, q = g.qs[g.i], clues = cluesOf(q);
    api.setPhase({
      kind: 'guess', step: 'clue', title: 'Trouvez la réponse', prompt: q.p || cfg.prompt, category: categoryOf(q),
      data: { clues: cfg.lastOnly ? [clues[g.clue]] : clues.slice(0, g.clue + 1), found: g.found.map(f => f.pid) },
      round: g.i + 1, rounds, duration: clueSeconds, clueIdx: g.clue, nClues: clues.length,
      accepted: [q.a, ...(q.alias || []), ...(q.accepted || [])].filter(Boolean).map(norm),
      expected: api.ids().filter(id => !g.found.some(f => f.pid === id)),
    });
  }
  function askQuestion(room, api) {
    room.g.found = []; room.g.clue = 0;
    askClue(room, api);
  }

  return {
    id: cfg.id, name: cfg.name, desc: cfg.desc, category: cfg.category || 'Général', categories: cfg.categories || [cfg.category || 'Général'], category: cfg.category || 'Général', categories: cfg.categories || [cfg.category || 'Général'], questions: cfg.questions,

    start(room, api) {
      room.g = { qs: shuffle(cfg.questions).slice(0, rounds), i: 0, found: [], clue: 0 };
      askQuestion(room, api);
    },

    // Renvoie les points si la réponse est bonne, sinon undefined (le joueur peut réessayer).
    validate(ph, pid, v) {
      if (ph.step !== 'clue') return;
      const g = norm(v);
      if (!g || !matches(ph.accepted, g)) return;
      const left = Math.max(0, (ph.endsAt - Date.now()) / (ph.duration * 1000));
      const share = (ph.nClues - ph.clueIdx) / ph.nClues;
      return Math.round(1000 * share * (0.5 + 0.5 * left) / 10) * 10;
    },

    onEnd(room, ph, api) {
      const g = room.g, q = g.qs[g.i];
      if (ph.step === 'clue') {
        for (const [pid, pts] of Object.entries(ph.answers)) {
          g.found.push({ pid, pts, clue: g.clue });
          api.addScore(pid, pts);
        }
        const someoneLeft = api.ids().some(id => !g.found.some(f => f.pid === id));
        if (someoneLeft && g.clue + 1 < ph.nClues) { g.clue++; return askClue(room, api); }
        return api.setPhase({
          kind: 'reveal', step: 'reveal', title: `Réponse : ${q.a}`, prompt: q.p || cfg.prompt, category: categoryOf(q),
          lines: g.found.map(f => ({
            main: api.name(f.pid), sub: ph.nClues > 1 ? `trouvé à l'indice ${f.clue + 1}` : 'trouvé !', pts: f.pts,
          })),
          round: ph.round, rounds, duration: 7,
        });
      }
      g.i++;
      g.i >= rounds ? api.finish() : askQuestion(room, api);
    },
  };
};

module.exports.norm = norm;
module.exports.matches = matches;
module.exports.shuffle = shuffle;
module.exports.lev = lev;
