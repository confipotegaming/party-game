// Le Grand Sondage : trouvez les réponses les plus populaires d'un sondage.
// Tout le monde propose en même temps depuis son téléphone ; le serveur seul connaît les réponses,
// valide les propositions, attribue les points (votes × multiplicateur) et décide de la fin de manche.
// Les réponses cachées ne quittent jamais le serveur avant d'être découvertes.
const cfg = require('./config');
const { store } = require('./store');
const { compile, match } = require('./matcher');

const shuffle = (a) => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const foundLabel = (n) => `${n} réponse${n > 1 ? 's' : ''} trouvée${n > 1 ? 's' : ''}`;

// État visible par tous (hôte et joueurs) : seules les réponses découvertes sont envoyées.
function publicData(g, revealAll = false) {
  const q = g.q;
  return {
    question: q.question, difficulty: cfg.DIFFICULTIES[q.difficulty].label, multiplier: g.mult,
    maxStrikes: cfg.MAX_STRIKES, hidePoints: cfg.HIDE_POINTS,
    slots: q.answers.map((a, i) => {
      const r = g.revealed[i];
      if (r) return { position: a.position, answer: a.answer, votes: a.votes, pts: r.pts, by: r.by, byName: r.name };
      if (revealAll) return { position: a.position, answer: a.answer, votes: a.votes, missed: true };
      return { position: a.position, votes: cfg.HIDE_POINTS ? null : a.votes };
    }),
    strikes: { ...g.strikes }, roundPts: { ...g.roundPts }, events: g.events.slice(-cfg.EVENTS_KEPT),
  };
}

function refresh(room) {
  if (room.phase && room.phase.kind === 'survey') room.phase.data = publicData(room.g);
}

function pickQuestion(g) {
  const plan = cfg.ROUNDS[g.round - 1] || cfg.ROUNDS[cfg.ROUNDS.length - 1];
  const exclude = g.seen;
  const tries = [
    { category: g.category, difficulty: plan.difficulty, exclude },
    { category: g.category, exclude },
    { difficulty: plan.difficulty, exclude },
    { exclude },
    { category: g.category }, // tout a déjà été joué : on repioche
    {},
  ];
  for (const t of tries) {
    const list = store.playable(t);
    if (list.length) return { q: shuffle(list)[0], plan };
  }
  return { q: null, plan };
}

function nextRound(room, api) {
  const g = room.g;
  g.round++;
  const { q, plan } = pickQuestion(g);
  if (!q) return api.finish();
  g.seen.push(q.id);
  const diff = cfg.DIFFICULTIES[q.difficulty] || cfg.DIFFICULTIES.moyen;
  const answers = q.answers.slice(0, diff.maxAnswers);
  g.q = { id: q.id, question: q.question, category: q.category, difficulty: q.difficulty, answers, compiled: compile(answers, store.synonyms()) };
  g.mult = (plan.multiplier || 1) * (diff.pointsMultiplier || 1);
  g.revealed = answers.map(() => null);
  g.strikes = {}; g.roundPts = {}; g.lastGuess = {}; g.events = []; g.reason = 'time';
  api.setPhase({
    kind: 'survey', step: 'play', title: 'Le Grand Sondage', prompt: q.question, category: q.category,
    round: g.round, rounds: g.rounds, duration: diff.seconds, expected: api.ids(), data: publicData(g),
  });
}

function event(g, e) {
  g.seq = (g.seq || 0) + 1;
  g.events.push({ id: g.seq, ...e });
  if (g.events.length > 30) g.events.shift();
}

module.exports = {
  id: 'sondage', name: 'Le Grand Sondage', minPlayers: 1,
  category: 'Culture générale', categories: ['Culture générale', 'Vie quotidienne', 'Famille'],
  router: require('./admin'), // back-office : /api/games/sondage (voir public/sondage-admin.html)
  desc: '100 personnes ont répondu au sondage : trouvez les réponses les plus populaires ! 3 fautes et vous êtes éliminé·e de la manche.',

  start(room, api) {
    const all = store.playable();
    if (!all.length) {
      return api.setPhase({ kind: 'error', step: 'error', title: 'Aucune question disponible', prompt: 'Ajoutez ou activez des questions dans le back-office du Grand Sondage (/sondage-admin.html).' });
    }
    room.sondageSeen = room.sondageSeen || []; // évite de rejouer les mêmes questions dans la soirée
    room.g = { round: 0, rounds: cfg.ROUNDS.length, category: null, seen: room.sondageSeen };
    const counts = {};
    for (const q of all) counts[q.category] = (counts[q.category] || 0) + 1;
    api.setPhase({
      kind: 'surveySetup', step: 'setup', title: 'Le Grand Sondage', prompt: "Choisissez le thème de la partie",
      data: { total: all.length, rounds: cfg.ROUNDS.length, categories: store.categories().filter(c => counts[c]).map(name => ({ name, count: counts[name] })) },
    });
  },

  // Les propositions passent par playerAction (plusieurs essais par manche), pas par « answer ».
  validate() { return undefined; },

  hostAction(room, action, api) {
    const ph = room.phase;
    if (!ph || ph.step !== 'setup' || !action.startsWith('start:')) return;
    const g = room.g;
    g.category = action.slice(6) || null;
    const available = store.playable({ category: g.category }).length;
    if (!available) g.category = null;
    g.rounds = Math.max(1, Math.min(cfg.ROUNDS.length, g.category ? available : store.playable().length));
    nextRound(room, api);
  },

  playerAction(room, pid, value, api) {
    const ph = room.phase, g = room.g;
    if (!ph || ph.kind !== 'survey' || ph.step !== 'play' || ph.done || !ph.expected.includes(pid)) return { status: 'closed' };
    const guess = String((value && typeof value === 'object' ? value.guess : value) ?? '').replace(/\s+/g, ' ').trim().slice(0, cfg.MAX_GUESS_LENGTH);
    if (!guess) return { status: 'empty' };
    if ((g.strikes[pid] || 0) >= cfg.MAX_STRIKES) return { status: 'out' };
    const now = Date.now();
    if (now - (g.lastGuess[pid] || 0) < cfg.GUESS_COOLDOWN_MS) return { status: 'slow' };
    g.lastGuess[pid] = now;

    const m = match(g.q.compiled, guess);
    if (m && m.ambiguous) return { status: 'ambiguous' };
    if (m && g.revealed[m.index]) {
      const a = g.q.answers[m.index];
      return { status: 'already', answer: a.answer, byName: g.revealed[m.index].name };
    }
    if (m) {
      const a = g.q.answers[m.index], pts = a.votes * g.mult, name = api.name(pid);
      g.revealed[m.index] = { by: pid, name, pts };
      g.roundPts[pid] = (g.roundPts[pid] || 0) + pts;
      api.addScore(pid, pts);
      event(g, { type: 'found', by: pid, name, position: a.position, answer: a.answer, votes: a.votes, pts });
      refresh(room);
      if (g.revealed.every(Boolean)) { g.reason = 'all'; api.end(); }
      return { status: 'found', answer: a.answer, votes: a.votes, pts, position: a.position };
    }

    const strikes = g.strikes[pid] = (g.strikes[pid] || 0) + 1;
    event(g, { type: 'miss', by: pid, name: api.name(pid), guess, strikes });
    if (strikes >= cfg.MAX_STRIKES) event(g, { type: 'out', by: pid, name: api.name(pid) });
    refresh(room);
    const inGame = ph.expected.filter(id => api.ids().includes(id) && (g.strikes[id] || 0) < cfg.MAX_STRIKES);
    if (!inGame.length) { g.reason = 'strikes'; api.end(); }
    return { status: 'miss', strikes, max: cfg.MAX_STRIKES };
  },

  onEnd(room, ph, api) {
    const g = room.g;
    if (ph.step === 'setup') return module.exports.hostAction(room, 'start:', api); // « Suivant » sans choix = tous thèmes
    if (ph.step === 'play') {
      const found = g.revealed.filter(Boolean).length, total = g.revealed.length;
      const title = { all: 'Tableau complet ! 🎉', strikes: 'Trop de fautes ! ❌', time: 'Temps écoulé ! ⏰' }[g.reason];
      return api.setPhase({
        kind: 'reveal', step: 'reveal', title, prompt: g.q.question, category: g.q.category,
        round: ph.round, rounds: ph.rounds, duration: cfg.REVEAL_SECONDS,
        lines: Object.entries(g.roundPts).sort((a, b) => b[1] - a[1]).map(([pid, pts]) => ({
          main: api.name(pid),
          sub: foundLabel(g.revealed.filter(r => r && r.by === pid).length) + (g.mult > 1 ? ` · points ×${g.mult}` : ''),
          pts,
        })),
        data: { survey: { ...publicData(g, true), reason: g.reason, found, total } },
      });
    }
    g.round >= g.rounds ? api.finish() : nextRound(room, api);
  },
};
