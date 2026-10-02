// Estimation : le plus proche de la bonne valeur gagne.
const ROUNDS = 5;
// d : difficulté (1 facile, 2 moyen, 3 difficile).
const E = (d, q, a, unit = '') => ({ q, a, unit, d });
const QUESTIONS = [
  // ★ Facile
  E(1, 'En quelle année a eu lieu la prise de la Bastille ?', 1789),
  E(1, 'En quelle année la France a-t-elle gagné sa première Coupe du monde de football ?', 1998),
  E(1, 'Combien de touches sur un piano classique ?', 88, 'touches'),
  E(1, 'Combien de cases sur un échiquier ?', 64, 'cases'),
  E(1, 'En quelle année l\'Homme a-t-il marché sur la Lune pour la première fois ?', 1969),
  E(1, 'En quelle année est tombé le mur de Berlin ?', 1989),
  E(1, 'Combien de dents a un adulte (dents de sagesse comprises) ?', 32, 'dents'),
  E(1, 'Combien de cartes dans un jeu classique (sans joker) ?', 52, 'cartes'),
  E(1, 'Combien de secondes dans une heure ?', 3600, 's'),
  E(1, 'Combien d\'étoiles sur le drapeau des États-Unis ?', 50, 'étoiles'),
  E(1, 'En quelle année Christophe Colomb a-t-il atteint l\'Amérique ?', 1492),
  E(1, 'Combien de pays font partie de l\'Union européenne (depuis le Brexit) ?', 27, 'pays'),
  E(1, 'En quelle année les pièces et billets en euros sont-ils arrivés dans nos poches ?', 2002),
  E(1, 'Combien de minutes dure un match de rugby (hors arrêts de jeu) ?', 80, 'min'),
  E(1, 'Combien de cases compte une grille de sudoku classique ?', 81, 'cases'),
  E(1, 'Combien de tomes compte la saga Harry Potter (romans principaux) ?', 7, 'tomes'),
  E(1, 'Combien de milliards d\'humains vivent sur Terre (environ, en 2024) ?', 8, 'milliards'),
  // ★★ Moyen
  E(2, 'Hauteur de la tour Eiffel, antennes comprises ?', 330, 'm'),
  E(2, 'Altitude du mont Blanc ?', 4806, 'm'),
  E(2, 'Combien de pays sont membres de l\'ONU ?', 193, 'pays'),
  E(2, 'En quelle année est mort Louis XIV ?', 1715),
  E(2, 'Combien d\'os dans le corps d\'un adulte ?', 206, 'os'),
  E(2, 'Combien de cartes dans un jeu de tarot ?', 78, 'cartes'),
  E(2, 'Combien de départements compte la France (outre-mer compris) ?', 101, 'départements'),
  E(2, 'En quelle année est sorti le tout premier iPhone ?', 2007),
  E(2, 'Distance d\'un marathon ?', 42.195, 'km'),
  E(2, 'Altitude du mont Everest ?', 8849, 'm'),
  E(2, 'En quelle année a eu lieu la bataille de Marignan ?', 1515),
  E(2, 'En quelle année Charlemagne a-t-il été couronné empereur ?', 800),
  E(2, 'En quelle année a été inaugurée la tour Eiffel ?', 1889),
  E(2, 'En quelle année a eu lieu la première Coupe du monde de football ?', 1930),
  E(2, 'En quelle année la peine de mort a-t-elle été abolie en France ?', 1981),
  E(2, 'Combien d\'éléments compte le tableau périodique ?', 118, 'éléments'),
  E(2, 'Combien de cœurs possède une pieuvre ?', 3, 'cœurs'),
  E(2, 'Combien de litres de sang circulent dans le corps d\'un adulte (environ) ?', 5, 'L'),
  E(2, 'Combien de millions d\'habitants compte la France (environ, en 2024) ?', 68, 'millions'),
  E(2, 'Circonférence de la Terre à l\'équateur ?', 40075, 'km'),
  E(2, 'Combien de symphonies Beethoven a-t-il composées ?', 9, 'symphonies'),
  E(2, 'En quelle année est sorti le film Titanic de James Cameron ?', 1997),
  // ★★★ Difficile
  E(3, 'Combien de marches jusqu\'au sommet de la tour Eiffel ?', 1665, 'marches'),
  E(3, 'Record du monde de vitesse sur rail du TGV (2007) ?', 575, 'km/h'),
  E(3, 'En quelle année est mort Napoléon Ier ?', 1821),
  E(3, 'Distance moyenne entre la Terre et la Lune ?', 384400, 'km'),
  E(3, 'Diamètre de la Terre ?', 12742, 'km'),
  E(3, 'Profondeur de la fosse des Mariannes (environ) ?', 10994, 'm'),
  E(3, 'En quelle année a été créé le Tour de France ?', 1903),
  E(3, 'En quelle année les Françaises ont-elles obtenu le droit de vote ?', 1944),
  E(3, 'Combien de lettres compte l\'alphabet grec ?', 24, 'lettres'),
  E(3, 'Âge de la Terre, en milliards d\'années ?', 4.5, 'milliards d\'années'),
  E(3, 'Hauteur de la statue de la Liberté, socle compris ?', 93, 'm'),
  E(3, 'Combien de rois de France se sont appelés Louis ?', 18, 'rois'),
  E(3, 'Vitesse de la lumière dans le vide ?', 299792, 'km/s'),
  E(3, 'Température d\'ébullition de l\'eau en degrés Fahrenheit ?', 212, '°F'),
  E(3, 'Longueur de la Grande Muraille de Chine (toutes sections, relevé de 2012) ?', 21196, 'km'),
  E(3, 'Combien de mètres mesure un terrain de tennis (longueur) ?', 23.77, 'm'),
];
const POINTS = [1000, 600, 300];
const diff = require('./_difficulty');

function ask(room, api) {
  const g = room.g, q = g.qs[g.i];
  api.setPhase({
    kind: 'number', step: 'guess', title: 'Estimez !', prompt: q.q, unit: q.unit, difficulty: diff.info(q.d),
    round: g.i + 1, rounds: ROUNDS, duration: 30, expected: api.ids(),
  });
}

module.exports = {
  id: 'estimation', category: 'Culture générale', categories: ['Culture générale', 'Histoire', 'Géographie', 'Sciences', 'Sport'],
  name: 'Estimation',
  desc: 'Une question chiffrée : le plus proche de la bonne réponse gagne.',
  difficulty: true,

  start(room, api) {
    room.g = { qs: diff.pick(QUESTIONS, ROUNDS, diff.modeOf(room)), i: 0 };
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
          const pts = Math.round((POINTS[i] || 0) * diff.bonus(q.d) / 10) * 10;
          api.addScore(r.pid, pts);
          return { main: `${api.name(r.pid)} : ${r.v}`, sub: r.diff === 0 ? 'Pile dessus !' : `écart de ${+r.diff.toFixed(3)}`, pts };
        });
      return api.setPhase({
        kind: 'reveal', step: 'reveal', title: `Réponse : ${String(q.a).replace('.', ',')} ${q.unit}`.trim(), prompt: q.q, difficulty: diff.info(q.d),
        lines, round: ph.round, rounds: ROUNDS, duration: 10,
      });
    }
    g.i++;
    g.i >= ROUNDS ? api.finish() : ask(room, api);
  },
};
