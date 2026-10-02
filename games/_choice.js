// Fabrique « tout le monde choisit une option ».
//  mode 'correct'  : certaines options sont bonnes (ok: true) -> points à ceux qui les ont choisies
//  mode 'majority' : on gagne des points si on a voté comme la majorité
const shuffle = (a) => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const diff = require('./_difficulty');

module.exports = function makeChoice(cfg) {
  const rounds = cfg.rounds || 5, points = cfg.points || 500;
  const ask = (room, api) => {
    const g = room.g, q = g.qs[g.i];
    api.setPhase({
      kind: 'vote', step: 'vote', title: cfg.title || 'Votre choix', prompt: q.p, category: q.category || cfg.category || 'Général', q, difficulty: diff.info(q.d),
      options: shuffle(q.options.map((o, i) => ({ id: 'o' + i, text: o.t }))),
      round: g.i + 1, rounds, duration: cfg.seconds || 25, expected: api.ids(),
    });
  };
  return {
    id: cfg.id, name: cfg.name, desc: cfg.desc, category: cfg.category || 'Général', categories: cfg.categories || [cfg.category || 'Général'],
    difficulty: diff.graded(cfg.questions),
    start(room, api) { room.g = { qs: diff.pick(cfg.questions, rounds, diff.modeOf(room)), i: 0 }; ask(room, api); },
    validate(ph, pid, v) { return ph.step === 'vote' && ph.options.some(o => o.id === v) ? v : undefined; },
    onEnd(room, ph, api) {
      const g = room.g;
      if (ph.step === 'vote') {
        const q = ph.q, picked = {}, gain = Math.round(points * diff.bonus(q.d) / 10) * 10;
        for (const [pid, id] of Object.entries(ph.answers)) (picked[id] = picked[id] || []).push(pid);
        const rows = ph.options.map(o => ({ opt: q.options[+o.id.slice(1)], pids: picked[o.id] || [] }));
        let win;
        if (cfg.mode === 'majority') {
          const top = Math.max(0, ...rows.map(r => r.pids.length));
          win = top > 0 ? rows.filter(r => r.pids.length === top) : [];
        } else win = rows.filter(r => r.opt.ok);
        rows.sort((a, b) => (win.includes(b) - win.includes(a)) || b.pids.length - a.pids.length);
        const lines = rows.map(r => {
          const gets = win.includes(r);
          if (gets) r.pids.forEach(p => api.addScore(p, gain));
          return {
            main: (cfg.mode !== 'majority' && r.opt.ok ? '✓ ' : '') + r.opt.t + (r.opt.r ? ' — ' + r.opt.r : ''),
            sub: r.pids.map(p => api.name(p)).join(', ') || 'Personne',
            pts: gets && r.pids.length ? gain : 0,
          };
        });
        const title = cfg.mode === 'majority'
          ? (win.length ? `Le groupe a choisi : ${win.map(r => r.opt.t).join(' / ')}` : 'Personne n\'a voté')
          : (cfg.revealTitle ? cfg.revealTitle(q) : 'Verdict');
        return api.setPhase({
          kind: 'reveal', step: 'reveal', title, prompt: q.p, lines, difficulty: diff.info(q.d),
          round: ph.round, rounds, duration: cfg.revealSeconds || 10,
        });
      }
      g.i++;
      g.i >= rounds ? api.finish() : ask(room, api);
    },
  };
};
