// Pixel Flou : un personnage culte du jeu vidéo s'affiche en 8×8 pixels, puis devient plus net
// toutes les 3 secondes. Trouver le personnage rapporte le plus de points, trouver le jeu en rapporte aussi.
// Plus on répond tôt (image floue), plus on gagne. Les noms restent côté serveur : seul le sprite est envoyé.
const { norm, matches } = require('../_textquiz');
const diff = require('../_difficulty');
const { resolve } = require('./sprites');

const ROUNDS = 6;
const STEPS = 8; // 8×8 … pleine résolution
const STEP_MS = 3000;
const ROUND_SECONDS = STEPS * 3 + 6; // l'image nette reste affichée quelques secondes
const CHAR_PTS = 1000;
const GAME_PTS = 400;
const COOLDOWN_MS = 400;

// d : difficulté (1 facile, 2 moyen, 3 difficile) · s : sprite · a/alias : personnage · g/galias : jeu
const C = (d, s, a, alias, g, galias) => ({ d, s, a, alias, g, galias });
const MARIO = ['mario', 'super mario', 'mario bros', 'super mario bros', 'mario kart', 'super mario world'];
const POKEMON = ['pokemon', 'pokémon', 'pokemon rouge', 'pokemon bleu', 'pokemon jaune'];
const SONIC = ['sonic', 'sonic the hedgehog', 'sonic le herisson'];
const MINECRAFT = ['minecraft'];
const PACMAN = ['pac man', 'pacman', 'pac-man', 'ms pac man', 'ms pacman'];

const CHARACTERS = [
  // ★ Facile
  C(1, 'mario', 'Mario', ['super mario'], 'Super Mario Bros.', MARIO),
  C(1, 'luigi', 'Luigi', [], 'Super Mario Bros.', [...MARIO, 'luigi s mansion', 'luigis mansion']),
  C(1, 'pikachu', 'Pikachu', [], 'Pokémon', POKEMON),
  C(1, 'kirby', 'Kirby', [], 'Kirby', ['kirby', 'kirby s dream land', 'kirbys dream land']),
  C(1, 'sonic', 'Sonic', ['sonic the hedgehog'], 'Sonic the Hedgehog', SONIC),
  C(1, 'link', 'Link', [], 'The Legend of Zelda', ['zelda', 'the legend of zelda', 'legend of zelda']),
  C(1, 'pacman', 'Pac-Man', ['pacman', 'pac man'], 'Pac-Man', PACMAN),
  C(1, 'yoshi', 'Yoshi', [], 'Super Mario World', [...MARIO, 'yoshi s island', 'yoshis island']),
  C(1, 'donkeykong', 'Donkey Kong', ['dk', 'donkey kong'], 'Donkey Kong', ['donkey kong', 'donkey kong country', 'dk']),
  C(1, 'invader', 'Space Invader', ['invader', 'alien', 'envahisseur', 'extraterrestre', 'space invaders'], 'Space Invaders', ['space invaders', 'space invader']),
  C(1, 'bowser', 'Bowser', ['koopa', 'roi koopa'], 'Super Mario Bros.', MARIO),
  C(1, 'peach', 'Princesse Peach', ['peach', 'princess peach'], 'Super Mario Bros.', MARIO),
  C(1, 'creeper', 'Creeper', [], 'Minecraft', MINECRAFT),
  C(1, 'steve', 'Steve', [], 'Minecraft', MINECRAFT),
  C(1, 'toad', 'Toad', [], 'Super Mario Bros.', MARIO),
  C(1, 'rondoudou', 'Rondoudou', ['jigglypuff'], 'Pokémon', POKEMON),
  C(1, 'crewmate', 'Crewmate', ['imposteur', 'impostor', 'astronaute', 'among us'], 'Among Us', ['among us', 'amongus']),
  // ★★ Moyen
  C(2, 'blinky', 'Blinky', ['fantome', 'fantome rouge', 'ghost', 'shadow'], 'Pac-Man', PACMAN),
  C(2, 'megaman', 'Mega Man', ['megaman', 'rockman'], 'Mega Man', ['mega man', 'megaman', 'rockman']),
  C(2, 'bulbizarre', 'Bulbizarre', ['bulbasaur'], 'Pokémon', POKEMON),
  C(2, 'salameche', 'Salamèche', ['charmander'], 'Pokémon', POKEMON),
  C(2, 'carapuce', 'Carapuce', ['squirtle'], 'Pokémon', POKEMON),
  C(2, 'wario', 'Wario', [], 'WarioWare', ['warioware', 'wario ware', 'wario land', ...MARIO]),
  C(2, 'waluigi', 'Waluigi', [], 'Mario Tennis', ['mario tennis', 'mario party', ...MARIO]),
  C(2, 'crash', 'Crash Bandicoot', ['crash'], 'Crash Bandicoot', ['crash bandicoot', 'crash']),
  C(2, 'rayman', 'Rayman', [], 'Rayman', ['rayman']),
  C(2, 'bomberman', 'Bomberman', [], 'Bomberman', ['bomberman', 'super bomberman']),
  C(2, 'knuckles', 'Knuckles', [], 'Sonic the Hedgehog', SONIC),
  C(2, 'tails', 'Tails', ['miles prower', 'miles tails prower'], 'Sonic the Hedgehog', SONIC),
  C(2, 'samus', 'Samus Aran', ['samus'], 'Metroid', ['metroid', 'super metroid', 'metroid prime']),
  C(2, 'lapincretin', 'Lapin crétin', ['lapins cretins', 'rabbid', 'rabbids', 'lapin'], 'The Lapins Crétins', ['lapins cretins', 'the lapins cretins', 'rabbids', 'raving rabbids', 'rayman contre les lapins cretins']),
  C(2, 'ectoplasma', 'Ectoplasma', ['gengar'], 'Pokémon', POKEMON),
  C(2, 'ronflex', 'Ronflex', ['snorlax'], 'Pokémon', POKEMON),
  C(2, 'boo', 'Boo', ['fantome', 'king boo'], 'Super Mario Bros.', [...MARIO, 'luigi s mansion', 'luigis mansion']),
  C(2, 'goomba', 'Goomba', [], 'Super Mario Bros.', MARIO),
  C(2, 'masterchief', 'Master Chief', ['john 117', 'le major', 'chief'], 'Halo', ['halo', 'halo combat evolved']),
  C(2, 'mspacman', 'Ms. Pac-Man', ['ms pac man', 'ms pacman', 'miss pac man', 'miss pacman', 'madame pac man'], 'Ms. Pac-Man', PACMAN),
  C(2, 'shyguy', 'Maskass', ['shy guy', 'shyguy'], 'Super Mario Bros.', [...MARIO, 'yoshi s island', 'yoshis island']),
  C(2, 'ryu', 'Ryu', [], 'Street Fighter', ['street fighter', 'street fighter 2', 'street fighter ii']),
  C(2, 'spyro', 'Spyro', ['spyro the dragon'], 'Spyro the Dragon', ['spyro', 'spyro the dragon']),
  // ★★★ Difficile
  C(3, 'qbert', 'Q*bert', ['qbert', 'q bert'], 'Q*bert', ['qbert', 'q bert']),
  C(3, 'pooka', 'Pooka', [], 'Dig Dug', ['dig dug', 'digdug']),
  C(3, 'bub', 'Bub', ['bob'], 'Bubble Bobble', ['bubble bobble']),
  C(3, 'alexkidd', 'Alex Kidd', [], 'Alex Kidd in Miracle World', ['alex kidd', 'alex kidd in miracle world']),
  C(3, 'ness', 'Ness', [], 'EarthBound', ['earthbound', 'earth bound', 'mother', 'mother 2']),
  C(3, 'earthwormjim', 'Earthworm Jim', ['jim'], 'Earthworm Jim', ['earthworm jim']),
  C(3, 'sackboy', 'Sackboy', [], 'LittleBigPlanet', ['littlebigplanet', 'little big planet', 'sackboy']),
  C(3, 'chunli', 'Chun-Li', ['chun li', 'chunli'], 'Street Fighter', ['street fighter', 'street fighter 2', 'street fighter ii']),
  C(3, 'kratos', 'Kratos', [], 'God of War', ['god of war']),
  C(3, 'cuphead', 'Cuphead', [], 'Cuphead', ['cuphead']),
  C(3, 'shovelknight', 'Shovel Knight', [], 'Shovel Knight', ['shovel knight']),
  C(3, 'slime', 'Slime', ['gluant'], 'Dragon Quest', ['dragon quest', 'dragon warrior']),
  C(3, 'chocobo', 'Chocobo', [], 'Final Fantasy', ['final fantasy', 'ff']),
  C(3, 'isabelle', 'Marie', ['isabelle', 'shizue'], 'Animal Crossing', ['animal crossing', 'animal crossing new horizons']),
  C(3, 'pikmin', 'Pikmin', ['pikmin rouge'], 'Pikmin', ['pikmin']),
  C(3, 'frogger', 'Frogger', ['grenouille'], 'Frogger', ['frogger']),
  C(3, 'gamewatch', 'Mr. Game & Watch', ['mr game and watch', 'mr game watch', 'game and watch', 'game watch'], 'Game & Watch', ['game and watch', 'game watch', 'super smash bros', 'smash bros']),
  C(3, 'metroid', 'Metroid', [], 'Metroid', ['metroid', 'super metroid']),
  C(3, 'hollowknight', 'Le Chevalier', ['chevalier', 'the knight', 'knight', 'hollow knight'], 'Hollow Knight', ['hollow knight']),
  C(3, 'lemming', 'Lemming', ['lemmings'], 'Lemmings', ['lemmings', 'lemming']),
  C(3, 'pit', 'Pit', [], 'Kid Icarus', ['kid icarus', 'kid icarus uprising']),
  C(3, 'inkling', 'Inkling', [], 'Splatoon', ['splatoon']),
];
for (const c of CHARACTERS) {
  c.sprite = resolve(c.s);
  c.acceptChar = [c.a, ...c.alias].map(norm).filter(Boolean);
  c.acceptGame = [c.g, ...c.galias].map(norm).filter(Boolean);
}

// Étape de netteté atteinte (0 = 8×8 … STEPS-1 = image nette).
const stepAt = (ph, now = Date.now()) => Math.max(0, Math.min(STEPS - 1, Math.floor((now - ph.data.startAt) / STEP_MS)));
// Points pour une trouvaille à l'étape `step` : 100 % en 8×8, puis −12,5 % par étape.
const pointsFor = (base, step, level) => Math.round(base * (STEPS - step) / STEPS * diff.bonus(level) / 10) * 10;

function publicFound(g) {
  const out = {};
  for (const [pid, f] of Object.entries(g.found)) out[pid] = { char: !!f.char, game: !!f.game };
  return out;
}
function refresh(room) {
  if (room.phase && room.phase.kind === 'pixel') room.phase.data = { ...room.phase.data, found: publicFound(room.g) };
}

function askRound(room, api) {
  const g = room.g, q = g.qs[g.i];
  g.found = {}; g.lastGuess = {}; g.events = [];
  const level = diff.info(q.d);
  api.setPhase({
    kind: 'pixel', step: 'play', title: 'Pixel Flou', prompt: 'Qui est ce personnage ? Et de quel jeu vient-il ?', category: 'Jeux vidéo',
    difficulty: level, round: g.i + 1, rounds: g.qs.length, duration: ROUND_SECONDS, expected: api.ids(),
    data: {
      sprite: q.sprite, startAt: Date.now(), stepMs: STEP_MS, steps: STEPS, found: {}, events: [],
      pts: { char: pointsFor(CHAR_PTS, 0, q.d), game: pointsFor(GAME_PTS, 0, q.d) },
    },
  });
}

module.exports = {
  id: 'pixelflou', name: 'Pixel Flou', category: 'Jeux vidéo', categories: ['Jeux vidéo', 'Culture pop'], minPlayers: 1,
  desc: 'Un personnage culte du jeu vidéo en 8×8 pixels qui devient plus net toutes les 3 secondes. Trouvez son nom (et son jeu) le plus tôt possible !',
  questions: CHARACTERS,
  difficulty: diff.graded(CHARACTERS),
  STEPS, STEP_MS, CHAR_PTS, GAME_PTS, stepAt, pointsFor,

  start(room, api) {
    room.g = { qs: diff.pick(CHARACTERS, ROUNDS, diff.modeOf(room)), i: 0, found: {} };
    askRound(room, api);
  },

  // Les propositions passent par playerAction (plusieurs essais : personnage puis jeu).
  validate() { return undefined; },

  playerAction(room, pid, value, api) {
    const ph = room.phase, g = room.g;
    if (!ph || ph.kind !== 'pixel' || ph.step !== 'play' || ph.done || !ph.expected.includes(pid)) return { status: 'closed' };
    const guess = norm(String((value && typeof value === 'object' ? value.guess : value) ?? '').slice(0, 60));
    if (!guess) return { status: 'empty' };
    const now = Date.now();
    if (now - (g.lastGuess[pid] || 0) < COOLDOWN_MS) return { status: 'slow' };
    g.lastGuess[pid] = now;

    const q = g.qs[g.i], f = g.found[pid] = g.found[pid] || { char: 0, game: 0 };
    const step = stepAt(ph, now);
    const isChar = matches(q.acceptChar, guess), isGame = matches(q.acceptGame, guess);
    let pts = 0;
    const got = [];
    if (isChar && !f.char) { f.char = pointsFor(CHAR_PTS, step, q.d); pts += f.char; got.push('char'); }
    if (isGame && !f.game) { f.game = pointsFor(GAME_PTS, step, q.d); pts += f.game; got.push('game'); }
    if (!got.length) {
      if (isChar || isGame) return { status: 'already', what: isChar ? 'char' : 'game' };
      return { status: 'miss' };
    }
    api.addScore(pid, pts);
    g.events.push({ pid, name: api.name(pid), got, pts, step });
    ph.data.events = g.events.map(e => ({ name: e.name, got: e.got, pts: e.pts }));
    refresh(room);
    const allDone = ph.expected.filter(id => api.ids().includes(id)).every(id => g.found[id] && g.found[id].char && g.found[id].game);
    if (allDone) api.end();
    return { status: 'found', got, pts, char: got.includes('char') ? q.a : undefined, game: got.includes('game') ? q.g : undefined, done: !!(f.char && f.game) };
  },

  onEnd(room, ph, api) {
    const g = room.g, q = g.qs[g.i];
    if (ph.step === 'play') {
      const rows = Object.entries(g.found).filter(([, f]) => f.char || f.game)
        .map(([pid, f]) => ({ pid, f, pts: (f.char || 0) + (f.game || 0) })).sort((a, b) => b.pts - a.pts);
      return api.setPhase({
        kind: 'reveal', step: 'reveal', title: `C'était ${q.a} !`, prompt: `Jeu : ${q.g}`, category: 'Jeux vidéo', difficulty: diff.info(q.d),
        round: ph.round, rounds: ph.rounds, duration: 8,
        lines: rows.map(({ pid, f, pts }) => ({
          main: api.name(pid),
          sub: [f.char ? `personnage (+${f.char})` : '', f.game ? `jeu (+${f.game})` : ''].filter(Boolean).join(' · '),
          pts,
        })),
        data: { pixel: { sprite: q.sprite, name: q.a, game: q.g } },
      });
    }
    g.i++;
    g.i >= g.qs.length ? api.finish() : askRound(room, api);
  },
};
