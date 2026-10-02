// Moteur minimal reproduisant l'API que server.js donne aux jeux (setPhase, ids, name, addScore, end, finish),
// sans réseau ni chrono, pour tester la logique des jeux.
function makeRoom(names = ['Alice', 'Bob']) {
  const room = { players: {}, phase: null, pn: 0, g: null, game: null, broadcasts: 0 };
  names.forEach((name, i) => { const id = 'p' + i; room.players[id] = { id, name, score: 0, connected: true }; });
  const setPhase = (ph) => {
    room.phase = { n: ++room.pn, answers: {}, rawAnswers: {}, expected: [], done: false, ...ph, endsAt: ph.duration ? Date.now() + ph.duration * 1000 : null };
  };
  const endPhase = () => {
    const ph = room.phase;
    if (!ph || ph.done) return;
    ph.done = true;
    room.game.onEnd(room, ph, api);
  };
  const api = {
    setPhase,
    ids: () => Object.values(room.players).filter(p => p.connected).map(p => p.id),
    name: (id) => (room.players[id] || {}).name || '?',
    addScore: (id, n) => { if (room.players[id]) room.players[id].score += n; },
    end: endPhase,
    finish: () => setPhase({ kind: 'scores' }),
  };
  return { room, api, endPhase, start: (game) => { room.game = game; game.start(room, api); } };
}
module.exports = { makeRoom };
