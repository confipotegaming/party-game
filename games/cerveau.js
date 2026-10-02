// Cerveau Turbo : 60 secondes pour enchaîner un maximum de mini-défis (calcul, logique, mémoire, réflexes).
// Chaque joueur joue sur son téléphone en même temps que les autres : les défis sont générés côté client
// (public/brain.js), le serveur synchronise le départ, relaie la progression en direct à l'hôte et compte les points.
const { rate, accuracy } = require('../public/brain.js');

const INTRO_MS = 4500; // « PRÊT ? » puis 3, 2, 1
const PLAY_MS = 60000;
const GRACE_S = 6;     // marge pour recevoir les résultats finaux des téléphones

const num = (v, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0; };

// Nettoie les statistiques envoyées par un téléphone (progression ou résultat final).
function clean(v) {
  if (!v || typeof v !== 'object') return;
  const r = {
    score: num(v.score, 500000), solved: num(v.solved, 400), errors: num(v.errors, 400),
    combo: num(v.combo, 400), maxCombo: num(v.maxCombo, 400), avgMs: num(v.avgMs, 60000),
    level: num(v.level, 10), type: String(v.type || '').slice(0, 24),
  };
  r.maxCombo = Math.min(r.maxCombo, r.solved);
  r.combo = Math.min(r.combo, r.maxCombo);
  r.score = Math.min(r.score, r.solved * 2500);
  return r;
}

function play(room, api) {
  const g = room.g;
  g.round++;
  api.setPhase({
    kind: 'brain', step: 'play', title: 'Cerveau Turbo', prompt: 'Enchaînez un maximum de défis avant la fin du chrono !',
    round: g.round, duration: (INTRO_MS + PLAY_MS) / 1000 + GRACE_S, expected: api.ids(), live: {},
    data: { startAt: Date.now() + INTRO_MS, playMs: PLAY_MS, round: g.round },
  });
}

module.exports = {
  id: 'cerveau', name: 'Cerveau Turbo', minPlayers: 1,
  category: 'Réflexion', categories: ['Réflexion', 'Calcul', 'Logique', 'Mémoire', 'Réflexes'],
  desc: '60 secondes de mini-défis : calcul, logique, mémoire et réflexes. Enchaînez les combos ! (jouable en solo)',

  start(room, api) {
    room.g = { round: 0 };
    play(room, api);
  },

  validate(ph, pid, v) {
    return ph.step === 'play' ? clean(v) : undefined;
  },

  // Progression en direct (après chaque défi) : affichée sur l'écran de l'hôte.
  progress(ph, pid, v) {
    const r = ph.step === 'play' && clean(v);
    if (!r) return false;
    ph.live[pid] = r;
    return true;
  },

  hostAction(room, action, api) {
    if (action === 'replay' && room.phase && room.phase.step === 'results') play(room, api);
  },

  onEnd(room, ph, api) {
    if (ph.step === 'play') {
      const rows = ph.expected.map(pid => {
        const r = ph.answers[pid] || ph.live[pid] || clean({});
        const t = rate(r);
        return { id: pid, name: api.name(pid), ...r, accuracy: accuracy(r), title: t.name, icon: t.icon };
      }).sort((a, b) => b.score - a.score || b.solved - a.solved);
      rows.forEach(r => api.addScore(r.id, r.score));
      return api.setPhase({
        kind: 'brainResults', step: 'results', title: 'Temps écoulé !', round: ph.round,
        lines: rows.map(r => ({ main: `${r.icon} ${r.name} — ${r.title}`, sub: `${r.solved} défis réussis · ${r.errors} erreurs · ${r.accuracy} % de précision`, pts: r.score })),
        data: { rows, round: ph.round, playN: ph.n },
      });
    }
    api.finish();
  },
};
