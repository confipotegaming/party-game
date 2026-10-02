// Warioware : des micro-jeux de quelques secondes qui s'enchaînent sans pause et accélèrent.
// Chaque joueur joue sur son téléphone en même temps que les autres : les micro-jeux tournent côté client
// (public/wario.js), le serveur synchronise le départ, relaie la progression à l'hôte et compte les points.
const { rate, LIVES } = require('../public/wario.js');

const INTRO_MS = 4500;  // « PRÊT ? » puis 3, 2, 1
const PLAY_MS = 180000; // plafond : la partie s'arrête plus tôt quand tout le monde a perdu ses vies
const GRACE_S = 12;     // marge pour finir le micro-jeu en cours et recevoir les résultats

const num = (v, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0; };

// Nettoie les statistiques envoyées par un téléphone (progression ou résultat final).
function clean(v) {
  if (!v || typeof v !== 'object') return;
  const r = {
    score: num(v.score, 100000), cleared: num(v.cleared, 300), failed: num(v.failed, LIVES),
    lives: num(v.lives, LIVES), played: num(v.played, 400), streak: num(v.streak, 300),
    maxStreak: num(v.maxStreak, 300), speed: Math.max(10, num(v.speed, 40)), type: String(v.type || '').slice(0, 16),
  };
  r.maxStreak = Math.min(r.maxStreak, r.cleared);
  r.streak = Math.min(r.streak, r.maxStreak);
  r.score = Math.min(r.score, r.cleared * 330);
  return r;
}

function play(room, api) {
  const g = room.g;
  g.round++;
  api.setPhase({
    kind: 'wario', step: 'play', title: 'Warioware', prompt: 'Une consigne, quelques secondes : agissez !',
    round: g.round, duration: (INTRO_MS + PLAY_MS) / 1000 + GRACE_S, expected: api.ids(), live: {},
    data: { startAt: Date.now() + INTRO_MS, playMs: PLAY_MS, round: g.round, lives: LIVES },
  });
}

module.exports = {
  id: 'wario', name: 'Warioware', minPlayers: 1,
  category: 'Réflexes', categories: ['Réflexes', 'Adresse', 'Mémoire'],
  desc: 'Attrape ! Évite ! Saute ! Des micro-jeux de 4 secondes qui s\'enchaînent de plus en plus vite. 4 vies. (jouable en solo)',

  start(room, api) {
    room.g = { round: 0 };
    play(room, api);
  },

  validate(ph, pid, v) {
    return ph.step === 'play' ? clean(v) : undefined;
  },

  // Progression en direct (après chaque micro-jeu) : affichée sur l'écran de l'hôte.
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
        return { id: pid, name: api.name(pid), ...r, title: t.name, icon: t.icon };
      }).sort((a, b) => b.score - a.score || b.cleared - a.cleared);
      rows.forEach(r => api.addScore(r.id, r.score));
      return api.setPhase({
        kind: 'warioResults', step: 'results', title: 'Game over !', round: ph.round,
        lines: rows.map(r => ({ main: `${r.icon} ${r.name} — ${r.title}`, sub: `${r.cleared} micro-jeux réussis · vitesse ×${(r.speed / 10).toFixed(1)}`, pts: r.score })),
        data: { rows, round: ph.round, playN: ph.n },
      });
    }
    api.finish();
  },
};
