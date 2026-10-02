// Tout le monde classe 5 éléments ; plus votre classement ressemble à celui du groupe, plus vous gagnez.
const { shuffle } = require('./_textquiz');
const ROUNDS = 4;
const Q = (p, ...items) => ({ p, items });
const QUESTIONS = [
  Q('Du plus utile au moins utile dans une soirée :', 'Une enceinte', 'Un tire-bouchon', 'Un chargeur', 'Un jeu de cartes', 'Un canapé'),
  Q('Du plus effrayant au moins effrayant :', 'Les araignées', 'Le noir', 'Parler en public', 'Les clowns', 'Le dentiste'),
  Q('Du meilleur au pire petit-déjeuner :', 'Croissant', 'Céréales', 'Tartines', 'Crêpes', 'Œufs au bacon'),
  Q('Du plus agréable au moins agréable :', 'Un dimanche pluvieux', 'Un lundi matin', 'Un vendredi soir', 'Un trajet en train', 'Une sieste'),
  Q('Du métier le plus cool au moins cool :', 'Astronaute', 'Pâtissier', 'Détective', 'Youtubeur', 'Pirate'),
];

function ask(room, api) {
  const g = room.g, q = g.qs[g.i];
  api.setPhase({
    kind: 'rank', step: 'rank', title: 'Classez !', prompt: q.p,
    data: { items: shuffle(q.items).map((text, i) => ({ id: 'i' + i, text })) },
    round: g.i + 1, rounds: ROUNDS, duration: 45, expected: api.ids(),
  });
}

module.exports = {
  id: 'classement', category: 'Vie quotidienne', name: 'Classement impossible', categories: ['Vie quotidienne', 'Humour', 'Loisirs'],
  desc: 'Classez 5 éléments : gagnez en pensant comme le reste du groupe.',
  start(room, api) { room.g = { qs: shuffle(QUESTIONS).slice(0, ROUNDS), i: 0 }; ask(room, api); },
  validate(ph, pid, v) {
    const ids = ph.data.items.map(x => x.id);
    return Array.isArray(v) && v.length === ids.length && ids.every(id => v.includes(id)) && new Set(v).size === ids.length ? v : undefined;
  },
  onEnd(room, ph, api) {
    const g = room.g;
    if (ph.step === 'rank') {
      const items = ph.data.items, n = items.length, entries = Object.entries(ph.answers);
      if (!entries.length) {
        return api.setPhase({ kind: 'reveal', step: 'reveal', title: 'Personne n\'a classé', prompt: ph.prompt, lines: [], round: ph.round, rounds: ROUNDS, duration: 5 });
      }
      const sum = Object.fromEntries(items.map(it => [it.id, 0]));
      entries.forEach(([, order]) => order.forEach((id, i) => (sum[id] += i)));
      const cons = [...items].sort((a, b) => sum[a.id] - sum[b.id]);
      const cpos = Object.fromEntries(cons.map((it, i) => [it.id, i]));
      const maxD = Math.floor(n * n / 2);
      const lines = entries.map(([pid, order]) => {
        const D = order.reduce((s, id, i) => s + Math.abs(i - cpos[id]), 0);
        const pts = Math.round(1000 * (1 - D / maxD) / 10) * 10;
        api.addScore(pid, pts);
        return { main: api.name(pid), sub: D === 0 ? 'Pile comme le groupe !' : `écart de ${D}`, pts };
      }).sort((a, b) => b.pts - a.pts);
      return api.setPhase({
        kind: 'reveal', step: 'reveal', title: 'Le groupe : ' + cons.map(c => c.text).join(' › '), prompt: ph.prompt,
        lines, round: ph.round, rounds: ROUNDS, duration: 12,
      });
    }
    g.i++;
    g.i >= ROUNDS ? api.finish() : ask(room, api);
  },
};
