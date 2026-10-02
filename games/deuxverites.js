// Chacun écrit 2 vérités + 1 mensonge ; les autres cherchent le mensonge.
const { shuffle } = require('./_textquiz');
const MAX = 5;
const clean = (s) => String(s || '').trim().slice(0, 100);

function nextVote(room, api) {
  const g = room.g;
  while (g.queue.length && !api.ids().includes(g.queue[0].pid)) g.queue.shift();
  if (!g.queue.length) return api.finish();
  const c = (g.cur = g.queue.shift());
  g.k++;
  api.setPhase({
    kind: 'vote', step: 'vote', title: 'Trouvez le mensonge', prompt: `Quel est le mensonge de ${api.name(c.pid)} ?`,
    options: shuffle(c.s.map((text, i) => ({ id: 's' + i, text, lie: i === c.lie }))),
    round: g.k, rounds: g.total, duration: 25, expected: api.ids().filter(id => id !== c.pid),
  });
}

module.exports = {
  id: 'deuxverites', category: 'Vie quotidienne', name: '2 vérités, 1 mensonge', categories: ['Vie quotidienne', 'Humour', 'Famille'],
  desc: 'Écrivez 2 vérités et 1 mensonge sur vous : saurez-vous tromper les autres ?',
  start(room, api) {
    room.g = { queue: [], k: 0, total: 0 };
    api.setPhase({ kind: 'truths', step: 'write', title: 'Vos 3 affirmations', duration: 90, expected: api.ids() });
  },
  validate(ph, pid, v) {
    if (ph.step === 'write') {
      if (!v || !Array.isArray(v.s) || v.s.length !== 3 || ![0, 1, 2].includes(v.lie)) return;
      const s = v.s.map(clean);
      return s.some(x => !x) ? undefined : { s, lie: v.lie };
    }
    if (ph.step === 'vote') return ph.options.some(o => o.id === v) ? v : undefined;
  },
  onEnd(room, ph, api) {
    const g = room.g;
    if (ph.step === 'write') {
      g.queue = shuffle(Object.entries(ph.answers).map(([pid, a]) => ({ pid, ...a }))).slice(0, MAX);
      g.total = g.queue.length;
      return nextVote(room, api);
    }
    if (ph.step === 'vote') {
      const lie = ph.options.find(o => o.lie), c = g.cur, right = [], wrong = [];
      Object.entries(ph.answers).forEach(([pid, v]) => (v === lie.id ? right : wrong).push(pid));
      right.forEach(pid => api.addScore(pid, 300));
      api.addScore(c.pid, wrong.length * 150);
      const lines = [
        { main: api.name(c.pid) + ' (l\'auteur)', sub: `${wrong.length} personne(s) trompée(s)`, pts: wrong.length * 150 },
        ...right.map(pid => ({ main: api.name(pid), sub: 'a trouvé le mensonge !', pts: 300 })),
      ];
      return api.setPhase({
        kind: 'reveal', step: 'reveal', title: `Le mensonge : « ${lie.text} »`, prompt: ph.prompt,
        lines, round: ph.round, rounds: ph.rounds, duration: 7,
      });
    }
    nextVote(room, api);
  },
};
