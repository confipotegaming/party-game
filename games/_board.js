// Mode plateau (façon Mario Party) : une roue désigne le mini-jeu suivant, chaque mini-jeu rapporte
// des points de plateau selon le classement, et le meilleur total à la fin des tours l'emporte.
//
// Ce fichier contient la partie « pure » (sans réseau) : quels jeux peuvent sortir, l'algorithme
// de tirage qui garantit la variété, la composition de la roue et le barème des points.

// Le jeu du boss (en développement) ne doit jamais sortir à la roue. Un module peut aussi s'exclure
// lui-même avec `boss: true` ou `board: false`.
const EXCLUDED = ['boss'];

// Famille de gameplay : deux jeux d'une même famille se ressemblent trop pour s'enchaîner.
const FAMILIES = {
  funny: 'ecriture', finislaphrase: 'ecriture',
  leplusprobable: 'social', quiadit: 'social', deuxverites: 'social',
  choixgroupe: 'opinion', classement: 'opinion', survive: 'opinion',
  estimation: 'culture', express: 'culture', intrus: 'culture',
  emojis: 'devinette', filmresume: 'devinette', quatreimages: 'devinette', quisuisje: 'devinette', motatrous: 'devinette', pixelflou: 'devinette',
  dessin: 'creatif', motinterdit: 'creatif',
  cerveau: 'cerveau', academie: 'cerveau',
  wario: 'arcade',
  sondage: 'sondage',
};

const ICONS = {
  funny: '😂', finislaphrase: '✍️', leplusprobable: '👉', quiadit: '🗣️', deuxverites: '🤥',
  choixgroupe: '🤝', classement: '📊', survive: '🏝️', estimation: '📏', express: '⚡', intrus: '🔍',
  emojis: '🎬', filmresume: '🎞️', quatreimages: '🖼️', quisuisje: '🕵️', motatrous: '🧩',
  dessin: '🎨', motinterdit: '🤐', cerveau: '🧠', academie: '🎓', wario: '🕹️', sondage: '📋', pixelflou: '🟪',
};

// Points de plateau selon la place obtenue au mini-jeu (le dernier ne marque rien).
const PLACE_POINTS = [10, 6, 4, 3, 2, 1];
const TURN_CHOICES = [3, 5, 8, 10];
const DEFAULT_TURNS = 5;

const familyOf = (g) => FAMILIES[g.id] || g.family || g.category || g.id;
const iconOf = (g) => ICONS[g.id] || g.icon || '🎲';
const catsOf = (g) => (g.categories && g.categories.length ? g.categories : [g.category || 'Général']);

function isBoss(g) {
  return !!(g && (g.boss || g.board === false || EXCLUDED.includes(g.id) || /boss/i.test(String(g.id || ''))));
}

// Jeux pouvant sortir à la roue pour ce nombre de joueurs (jamais le boss).
function eligible(games, playerCount, minDefault = 2, skip = []) {
  return Object.values(games).filter(g => g && g.id && !isBoss(g) && !skip.includes(g.id)
    && playerCount >= (g.minPlayers || minDefault));
}

// Poids de chaque candidat. Principes :
//  1. Dans une même partie, aucun jeu ne revient avant que tous les autres soient sortis (cycle).
//  2. Les derniers jeux joués dans la soirée (même hors plateau) sont écartés tant que c'est possible.
//  3. Pas la même famille de gameplay que les 3 derniers jeux (si possible), et pénalités si même
//     famille ou même thème que les jeux précédents.
//  4. Bonus pour les familles peu jouées, les familles encore nombreuses dans le cycle (pour les étaler)
//     et les jeux les moins joués : la répartition s'équilibre d'elle-même.
function weights(pool, { session = [], history = [] } = {}) {
  if (!pool.length) return [];
  const byId = Object.fromEntries(pool.map(g => [g.id, g]));
  const meta = (id) => (byId[id] ? { family: familyOf(byId[id]), cat: byId[id].category || catsOf(byId[id])[0], cats: catsOf(byId[id]) } : null);

  // 1. Cycle : seuls les jeux les moins joués dans la partie en cours restent candidats.
  const inSession = (id) => session.filter(x => x === id).length;
  const minSession = Math.min(...pool.map(g => inSession(g.id)));
  let cands = pool.filter(g => inSession(g.id) === minSession);
  // Familles encore nombreuses dans le cycle : à étaler dès maintenant pour ne pas les enchaîner à la fin.
  // (Seulement une fois 30 % du cycle joué, pour garder des débuts de partie très variés.)
  const left = {}, spread = cands.length <= Math.ceil(pool.length * 0.7);
  for (const g of cands) left[familyOf(g)] = (left[familyOf(g)] || 0) + 1;

  // 2. Fenêtre anti-répétition sur l'historique de la soirée (session comprise).
  const recent = [...history, ...session];
  const windowSize = Math.min(10, Math.floor(pool.length / 2));
  const lastIds = recent.slice(-windowSize);
  const fresh = cands.filter(g => !lastIds.includes(g.id));
  if (fresh.length) cands = fresh;
  // Ne jamais rejouer le tout dernier jeu, même en fin de cycle.
  const last = recent[recent.length - 1];
  if (cands.length > 1) cands = cands.filter(g => g.id !== last);
  // Pas la même famille de gameplay que l'un des 3 derniers jeux, tant qu'il reste d'autres choix.
  const lastFams = recent.slice(-3).map(meta).filter(Boolean).map(m => m.family);
  const varied = cands.filter(g => !lastFams.includes(familyOf(g)));
  if (varied.length) cands = varied;

  // 3. et 4. Pondérations de variété.
  const prev = recent.slice(-3).reverse().map(meta).filter(Boolean); // prev[0] = le plus récent
  const famCount = {};
  for (const id of session) { const m = meta(id); if (m) famCount[m.family] = (famCount[m.family] || 0) + 1; }
  const maxFam = Math.max(0, ...Object.values(famCount));
  const gapOf = (id) => { const i = recent.lastIndexOf(id); return i < 0 ? Infinity : recent.length - i; };
  const plays = (id) => recent.filter(x => x === id).length;

  return cands.map(g => {
    const fam = familyOf(g), cats = catsOf(g), cat = g.category || cats[0];
    let w = 1;
    [0.08, 0.35, 0.7].forEach((f, i) => { if (prev[i] && prev[i].family === fam) w *= f; });
    if (prev[0] && prev[0].cat === cat) w *= 0.35;
    if (prev[1] && prev[1].cat === cat) w *= 0.7;
    if (prev[0] && prev[0].cats.some(c => cats.includes(c))) w *= 0.75;
    w *= 1 + 0.3 * (maxFam - (famCount[fam] || 0));
    if (spread) w *= 1 + 2 * ((left[fam] || 1) - 1);
    const gap = gapOf(g.id);
    w *= gap === Infinity ? 1.6 : Math.min(1.4, 0.4 + gap / pool.length);
    w *= 1 / (1 + 0.25 * plays(g.id));
    return { game: g, w: Math.max(w, 1e-4) };
  });
}

// Tire le prochain mini-jeu. `rng` est injectable pour les tests.
function pickNext(pool, ctx = {}, rng = Math.random) {
  const ws = weights(pool, ctx);
  if (!ws.length) return null;
  const total = ws.reduce((s, x) => s + x.w, 0);
  let r = rng() * total;
  for (const x of ws) { if ((r -= x.w) <= 0) return x.game; }
  return ws[ws.length - 1].game;
}

const shuffle = (a, rng = Math.random) => a.map(x => [rng(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const segment = (g) => ({ id: g.id, name: g.name, icon: iconOf(g), category: g.category || 'Général' });

// Roue de `size` cases contenant le jeu tiré et d'autres jeux possibles (sans doublon),
// répartis pour éviter deux familles identiques côte à côte quand c'est possible.
function wheel(pool, chosen, rng = Math.random, size = 8) {
  const others = shuffle(pool.filter(g => g.id !== chosen.id), rng).slice(0, Math.max(0, size - 1));
  let segs = [chosen, ...others];
  for (let tries = 0; tries < 20; tries++) {
    segs = shuffle(segs, rng);
    if (segs.every((g, i) => familyOf(g) !== familyOf(segs[(i + 1) % segs.length]))) break;
  }
  return { segments: segs.map(segment), target: segs.findIndex(g => g.id === chosen.id) };
}

// Classement d'un mini-jeu → points de plateau. Les ex æquo partagent la meilleure place ;
// le dernier ne marque rien, et personne ne marque si personne n'a marqué au mini-jeu.
function placements(scores, multiplier = 1) {
  const rows = Object.entries(scores).map(([id, score]) => ({ id, score: Number(score) || 0 }))
    .sort((a, b) => b.score - a.score);
  const n = rows.length, worst = n ? rows[n - 1].score : 0, anyone = rows.some(r => r.score > 0);
  rows.forEach((r, i) => {
    r.place = i && rows[i - 1].score === r.score ? rows[i - 1].place : i + 1;
    const last = n > 1 && r.score === worst && r.place > 1;
    r.gain = anyone && !last ? (PLACE_POINTS[r.place - 1] || 1) * multiplier : 0;
  });
  return rows;
}

const clampTurns = (t) => { const n = Math.round(Number(t)); return Number.isFinite(n) ? Math.max(1, Math.min(20, n)) : DEFAULT_TURNS; };

module.exports = { EXCLUDED, FAMILIES, ICONS, PLACE_POINTS, TURN_CHOICES, DEFAULT_TURNS, familyOf, iconOf, isBoss, eligible, weights, pickNext, wheel, placements, clampTurns, segment };
