// Le plus probable : tout le monde vote pour la personne (soi-même compris)
// qui correspond le mieux à la situation. Chaque vote reçu rapporte des points.
const ROUNDS = 5;
const PROMPTS = [
  'oublier son propre anniversaire',
  'finir dans une télé-réalité',
  'se perdre en allant chercher le pain',
  's\'endormir pendant un film au cinéma',
  'devenir millionnaire',
  'parler à son chat comme à un humain',
  'rater son train à cause d\'un croissant',
  'survivre à une invasion de zombies',
  'se faire arrêter pour une raison absurde',
  'pleurer devant un dessin animé',
  'arriver en retard à son propre mariage',
  'commander le même plat à chaque restaurant',
  'ouvrir une boutique de bougies à la campagne',
  'envoyer un message à la mauvaise personne',
  'se faire élire maire d\'un petit village',
];
const shuffle = (a) => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

function ask(room, api) {
  const g = room.g;
  const ids = api.ids();
  api.setPhase({
    kind: 'vote', step: 'vote', title: 'Votez !',
    prompt: 'Qui est le plus susceptible de ' + g.prompts[g.i] + ' ?',
    // Pas de champ "by" : on a le droit de voter pour soi-même.
    options: shuffle(ids.map(id => ({ id, text: api.name(id) }))),
    round: g.i + 1, rounds: ROUNDS, duration: 25, expected: ids,
  });
}

module.exports = {
  id: 'leplusprobable',
  name: 'Le plus probable',
  desc: 'Qui est le plus susceptible de… ? Votez pour un joueur.',

  start(room, api) {
    room.g = { prompts: shuffle(PROMPTS).slice(0, ROUNDS), i: 0 };
    ask(room, api);
  },

  validate(ph, pid, v) {
    return ph.step === 'vote' && ph.options.some(o => o.id === v) ? v : undefined;
  },

  onEnd(room, ph, api) {
    const g = room.g;
    if (ph.step === 'vote') {
      const votes = {};
      Object.values(ph.answers).forEach(id => (votes[id] = (votes[id] || 0) + 1));
      const ranked = ph.options
        .map(o => ({ id: o.id, n: votes[o.id] || 0 }))
        .filter(r => r.n > 0)
        .sort((a, b) => b.n - a.n);
      const top = ranked.length ? ranked[0].n : 0;
      const winners = ranked.filter(r => r.n === top).map(r => api.name(r.id));
      const lines = ranked.map(r => {
        api.addScore(r.id, r.n * 100);
        return { main: api.name(r.id), sub: `${r.n} vote${r.n > 1 ? 's' : ''}`, pts: r.n * 100 };
      });
      return api.setPhase({
        kind: 'reveal', step: 'reveal', prompt: ph.prompt,
        title: winners.length ? `${winners.join(' et ')} : le plus probable !` : 'Personne n\'a voté',
        lines, round: ph.round, rounds: ROUNDS, duration: 8,
      });
    }
    g.i++;
    g.i >= ROUNDS ? api.finish() : ask(room, api);
  },
};
