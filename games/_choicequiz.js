// Fabrique « choisir parmi des options ».
// mode 'correct'  : une bonne option (ok) rapporte des points (L'intrus)
// mode 'survive'  : les options ok « survivent » (Survivrais-tu ?)
// mode 'majority' : l'option la plus votée rapporte des points à ses électeurs (Le choix du groupe)
const { shuffle } = require('./_textquiz');
const diff = require('./_difficulty');
module.exports = (cfg) => {
  const rounds = Math.min(cfg.rounds || 5, cfg.questions.length);
  const pts = cfg.pts || 500;
  const ask = (room, api) => {
    const g = room.g, q = g.qs[g.i];
    const opts = (cfg.shuffle === false ? q.opts : shuffle(q.opts)).map((o, i) => ({ ...o, id: 'o' + i }));
    api.setPhase({
      kind: 'vote', step: 'vote', title: 'Votez !', prompt: q.p, category: q.category || cfg.category || 'Général', options: opts,
      round: g.i + 1, rounds, duration: cfg.duration || 25, expected: api.ids(),
    });
  };
  return {
    id: cfg.id, name: cfg.name, desc: cfg.desc, category: cfg.category || 'Général', categories: cfg.categories || [cfg.category || 'Général'],
    difficulty: diff.graded(cfg.questions),
    start(room, api) { room.g = { qs: diff.pick(cfg.questions, rounds, diff.modeOf(room)), i: 0 }; ask(room, api); },
    validate(ph, pid, v) { return ph.step === 'vote' && ph.options.some(o => o.id === v) ? v : undefined; },
    onEnd(room, ph, api) {
      const g = room.g, mode = cfg.mode;
      if (ph.step === 'vote') {
        const by = {};
        Object.entries(ph.answers).forEach(([pid, id]) => (by[id] = by[id] || []).push(pid));
        const top = Math.max(0, ...ph.options.map(o => (by[o.id] || []).length));
        const mark = (o) => mode === 'survive' ? (o.ok ? '✅ ' : '💀 ') : mode === 'correct' && o.ok ? '✅ ' : '';
        const lines = ph.options.map(o => {
          const v = by[o.id] || [];
          const win = mode === 'majority' ? v.length > 0 && v.length === top : !!o.ok;
          const p = win && v.length ? pts : 0;
          v.forEach(id => api.addScore(id, p));
          return {
            main: mark(o) + o.text, n: v.length, pts: p,
            sub: [v.length ? v.map(id => api.name(id)).join(', ') : 'personne', o.note].filter(Boolean).join(' · '),
          };
        });
        if (mode === 'majority') lines.sort((a, b) => b.n - a.n);
        const title = mode === 'correct' ? `La bonne réponse : ${(ph.options.find(o => o.ok) || {}).text}`
          : mode === 'survive' ? 'Le verdict' : 'Le groupe a parlé';
        return api.setPhase({ kind: 'reveal', step: 'reveal', title, prompt: ph.prompt, lines, round: ph.round, rounds, duration: 10 });
      }
      g.i++;
      g.i >= rounds ? api.finish() : ask(room, api);
    },
  };
};
