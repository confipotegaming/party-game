// Cérébrale Académie : un examen de 5 épreuves chronométrées (Perception, Analyse, Maths, Mémoire, Identification).
// Tous les joueurs passent les mêmes épreuves en même temps sur leur téléphone : elles sont générées côté client
// (public/academy.js), le serveur tire le programme, synchronise le départ, relaie la progression et compte les points.
const A = require('../public/academy.js');

const LEAD_MS = A.T.LEAD_MS;
const GRACE_S = 6; // marge pour recevoir les copies des téléphones

const num = (v, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0; };

// Nettoie les résultats envoyés par un téléphone (progression ou copie finale).
function clean(v, plan) {
  if (!v || typeof v !== 'object') return;
  const eps = plan.map((id, i) => {
    const e = (Array.isArray(v.eps) && v.eps[i]) || {};
    const r = { id, score: num(e.score, 20000), solved: num(e.solved, 200), errors: num(e.errors, 200) };
    r.score = Math.min(r.score, r.solved * 600);
    return r;
  });
  const r = {
    score: eps.reduce((a, e) => a + e.score, 0), solved: eps.reduce((a, e) => a + e.solved, 0), errors: eps.reduce((a, e) => a + e.errors, 0),
    avgMs: num(v.avgMs, 60000), ep: num(v.ep, A.EPISODES), eps,
  };
  return r;
}

function play(room, api) {
  const g = room.g;
  g.round++;
  g.plan = A.schedule(g.plan);
  api.setPhase({
    kind: 'academy', step: 'play', title: 'Cérébrale Académie', prompt: '5 épreuves chronométrées : à vos neurones !',
    round: g.round, duration: A.TOTAL_MS / 1000 + GRACE_S, expected: api.ids(), live: {},
    data: { startAt: Date.now() + LEAD_MS, plan: g.plan, round: g.round },
  });
}

module.exports = {
  id: 'academie', name: 'Cérébrale Académie', minPlayers: 1,
  category: 'Réflexion', categories: ['Réflexion', 'Perception', 'Analyse', 'Maths', 'Mémoire', 'Identification'],
  desc: 'Un examen de 5 épreuves de réflexe et de logique : ballons, taupes, rails, balance, mémo, silhouettes… Qui aura le plus gros cerveau ? (jouable en solo)',

  start(room, api) {
    room.g = { round: 0, plan: null };
    play(room, api);
  },

  validate(ph, pid, v) {
    return ph.step === 'play' ? clean(v, ph.data.plan) : undefined;
  },

  progress(ph, pid, v) {
    const r = ph.step === 'play' && clean(v, ph.data.plan);
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
        const r = ph.answers[pid] || ph.live[pid] || clean({}, ph.data.plan);
        const t = A.rate(r);
        return { id: pid, name: api.name(pid), ...r, grams: A.grams(r.score), accuracy: A.accuracy(r), title: t.name, icon: t.icon };
      }).sort((a, b) => b.score - a.score || b.solved - a.solved);
      rows.forEach(r => api.addScore(r.id, r.score));
      return api.setPhase({
        kind: 'academyResults', step: 'results', title: 'Fin de l\'examen !', round: ph.round,
        lines: rows.map(r => ({ main: `${r.icon} ${r.name} — ${r.title}`, sub: `${r.grams} g de cerveau · ${r.solved} réussites · ${r.accuracy} % de précision`, pts: r.score })),
        data: { rows, plan: ph.data.plan, round: ph.round, playN: ph.n },
      });
    }
    api.finish();
  },
};
