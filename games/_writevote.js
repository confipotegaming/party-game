// Fabrique « tout le monde écrit, puis tout le monde vote (pas pour soi) ».
const shuffle = (a) => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

module.exports = function makeWriteVote(cfg) {
  const rounds = cfg.rounds || 3;
  const ask = (room, api) => {
    const g = room.g;
    api.setPhase({
      kind: 'text', step: 'write', title: cfg.title || 'Écrivez votre réponse', prompt: g.prompts[g.i],
      round: g.i + 1, rounds, duration: 60, expected: api.ids(),
    });
  };
  return {
    id: cfg.id, name: cfg.name, desc: cfg.desc,
    start(room, api) { room.g = { prompts: shuffle(cfg.prompts).slice(0, rounds), i: 0 }; ask(room, api); },
    validate(ph, pid, v) {
      if (ph.step === 'write') return String(v || '').trim().slice(0, 120) || undefined;
      if (ph.step === 'vote') { const o = ph.options.find(o => o.id === v); return o && o.by !== pid ? v : undefined; }
    },
    onEnd(room, ph, api) {
      const g = room.g;
      const next = () => { g.i++; g.i >= rounds ? api.finish() : ask(room, api); };
      if (ph.step === 'write') {
        const options = Object.entries(ph.answers).map(([pid, text], i) => ({ id: 'o' + i, text, by: pid }));
        if (options.length < 2) return next();
        return api.setPhase({
          kind: 'vote', step: 'vote', title: 'Votez pour la meilleure', prompt: ph.prompt,
          options: shuffle(options), round: ph.round, rounds, duration: 30, expected: api.ids(),
        });
      }
      if (ph.step === 'vote') {
        const votes = {};
        Object.values(ph.answers).forEach(id => (votes[id] = (votes[id] || 0) + 1));
        const lines = ph.options.map(o => ({ main: o.text, n: votes[o.id] || 0, by: o.by }))
          .sort((a, b) => b.n - a.n)
          .map(l => {
            api.addScore(l.by, l.n * 100);
            return { main: l.main, sub: `${api.name(l.by)} (${l.n} vote${l.n > 1 ? 's' : ''})`, pts: l.n * 100 };
          });
        return api.setPhase({ kind: 'reveal', step: 'reveal', title: 'Résultats', prompt: ph.prompt, lines, round: ph.round, rounds, duration: 12 });
      }
      next();
    },
  };
};
