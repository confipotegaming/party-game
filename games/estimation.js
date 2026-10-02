// Estimation : le plus proche de la bonne valeur gagne.
const ROUNDS = 5;
const QUESTIONS = [
  { q: 'Hauteur de la tour Eiffel, antennes comprises ?', a: 330, unit: 'm' },
  { q: 'En quelle année a eu lieu la prise de la Bastille ?', a: 1789, unit: '' },
  { q: 'Combien de marches jusqu\'au sommet de la tour Eiffel ?', a: 1665, unit: 'marches' },
  { q: 'Longueur de la Loire ?', a: 1006, unit: 'km' },
  { q: 'En quelle année la France a-t-elle gagné sa première Coupe du monde ?', a: 1998, unit: '' },
  { q: 'Altitude du Mont Blanc ?', a: 4806, unit: 'm' },
  { q: 'Combien de pays sont membres de l\'ONU ?', a: 193, unit: 'pays' },
  { q: 'En quelle année est mort Louis XIV ?', a: 1715, unit: '' },
  { q: 'Combien d\'os dans le corps d\'un adulte ?', a: 206, unit: 'os' },
  { q: 'Combien de touches sur un piano classique ?', a: 88, unit: 'touches' },
  { q: 'Record de vitesse du TGV (2007) ?', a: 575, unit: 'km/h' },
];
const POINTS = [1000, 600, 300];
const shuffle = (a) => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

function ask(room, api) {
  const g = room.g, q = g.qs[g.i];
  api.setPhase({
    kind: 'number', step: 'guess', title: 'Estimez !', prompt: q.q, unit: q.unit,
    round: g.i + 1, rounds: ROUNDS, duration: 30, expected: api.ids(),
  });
}

module.exports = {
  id: 'estimation', category: 'Culture générale', categories: ['Culture générale', 'Histoire', 'Géographie', 'Sciences', 'Sport'],
  name: 'Estimation',
  desc: 'Une question chiffrée : le plus proche de la bonne réponse gagne.',

  start(room, api) {
    room.g = { qs: shuffle(QUESTIONS).slice(0, ROUNDS), i: 0 };
    ask(room, api);
  },

  validate(ph, pid, v) {
    const n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
  },

  onEnd(room, ph, api) {
    const g = room.g, q = g.qs[g.i];
    if (ph.step === 'guess') {
      const lines = Object.entries(ph.answers)
        .map(([pid, v]) => ({ pid, v, diff: Math.abs(v - q.a) }))
        .sort((a, b) => a.diff - b.diff)
        .map((r, i) => {
          const pts = POINTS[i] || 0;
          api.addScore(r.pid, pts);
          return { main: `${api.name(r.pid)} : ${r.v}`, sub: r.diff === 0 ? 'Pile dessus !' : `écart de ${r.diff}`, pts };
        });
      return api.setPhase({
        kind: 'reveal', step: 'reveal', title: `Réponse : ${q.a} ${q.unit}`.trim(), prompt: q.q,
        lines, round: ph.round, rounds: ROUNDS, duration: 10,
      });
    }
    g.i++;
    g.i >= ROUNDS ? api.finish() : ask(room, api);
  },
};
