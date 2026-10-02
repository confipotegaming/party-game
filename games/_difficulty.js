// Niveaux de difficulté des questions : 1 = facile, 2 = moyen, 3 = difficile.
// Une question plus difficile rapporte davantage de points (bonus).
// L'hôte choisit au lobby : 'mix' (progressif, par défaut) ou un niveau précis.
const LEVELS = {
  1: { label: 'Facile', stars: '★☆☆', bonus: 1 },
  2: { label: 'Moyen', stars: '★★☆', bonus: 1.25 },
  3: { label: 'Difficile', stars: '★★★', bonus: 1.5 },
};
const MODES = ['mix', '1', '2', '3'];
const shuffle = (a) => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

const levelOf = (q) => (LEVELS[q && q.d] ? q.d : 2);
const bonus = (d) => (LEVELS[d] ? LEVELS[d].bonus : 1);
const graded = (questions) => questions.some(q => LEVELS[q && q.d]);
// Infos affichées sur les écrans (puce « ★★☆ Moyen · ×1,25 »).
const info = (d) => {
  const l = LEVELS[d];
  return l ? { level: d, label: l.label, stars: l.stars, bonus: l.bonus } : undefined;
};
const modeOf = (room) => {
  const m = String((room && room.options && room.options.difficulty) || 'mix');
  return MODES.includes(m) ? m : 'mix';
};

// Tire n questions selon le mode :
//  - 'mix' : un mélange des trois niveaux, du plus facile au plus difficile ;
//  - '1' | '2' | '3' : ce niveau en priorité, complété par les niveaux voisins s'il en manque.
function pick(questions, n, mode = 'mix') {
  n = Math.min(n, questions.length);
  const by = { 1: [], 2: [], 3: [] };
  shuffle(questions).forEach(q => by[levelOf(q)].push(q));
  let out = [];
  if (mode === 'mix') {
    const hard = Math.floor(n / 3), easy = Math.ceil((n - hard) / 2), mid = n - hard - easy;
    out = [...by[1].splice(0, easy), ...by[2].splice(0, mid), ...by[3].splice(0, hard)];
    const rest = [...by[2], ...by[1], ...by[3]];
    while (out.length < n && rest.length) out.push(rest.shift());
  } else {
    const d = +mode, order = [d, ...[1, 2, 3].filter(x => x !== d).sort((a, b) => Math.abs(a - d) - Math.abs(b - d))];
    for (const lv of order) out.push(...by[lv].splice(0, n - out.length));
  }
  return out.sort((a, b) => levelOf(a) - levelOf(b));
}

module.exports = { LEVELS, MODES, pick, info, bonus, levelOf, modeOf, graded };
