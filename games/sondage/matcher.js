// Reconnaissance des réponses du Grand Sondage.
// Tolère accents, majuscules, espaces, articles/possessifs, pluriels, fautes de frappe légères,
// ordre des mots, synonymes globaux et variantes enregistrées pour chaque réponse.
// Reste volontairement stricte : un mot-clé incomplet (« brosse ») ne suffit pas pour « brosse à dents »
// sauf si la variante est enregistrée, et une proposition proche de deux réponses est refusée (ambiguë).
const { lev } = require('../_textquiz');

const STOP = new Set(('le la les l un une des du de d au aux a en et mon ma mes ton ta tes son sa ses notre nos ' +
  'votre vos leur leurs se s me m te t je j on il elle ils elles nous vous y ce c cet cette ces ca pour avec par ' +
  'qu que quelque quelqu chose truc faire fait').split(' ')); // « faire la vaisselle » = « vaisselle »

function clean(s) {
  return String(s ?? '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’'`-]/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Pluriels français courants : chevaux → cheval, bateaux → bateau, dents → dent, jeux → jeu.
function singular(w) {
  if (w.length <= 3 || /^\d+$/.test(w)) return w;
  if (w.endsWith('eaux')) return w.slice(0, -1);
  if (w.endsWith('aux') && w.length > 4) return w.slice(0, -3) + 'al';
  if (/[^s][sx]$/.test(w)) return w.slice(0, -1);
  return w;
}

// Table de synonymes : [['telephone', 'portable', 'smartphone'], ...] → chaque variante remplacée par la 1re.
function compileSynonyms(groups) {
  const out = [];
  for (const g of groups || []) {
    const forms = (Array.isArray(g) ? g : []).map(x => clean(x).split(' ').map(singular).join(' ')).filter(Boolean);
    if (forms.length < 2) continue;
    for (const alt of forms.slice(1)) if (alt !== forms[0]) out.push([alt, forms[0]]);
  }
  return out.sort((a, b) => b[0].length - a[0].length); // les expressions longues d'abord
}

function tokens(s, syn = []) {
  let t = ' ' + clean(s).split(' ').map(singular).join(' ') + ' ';
  for (const [alt, canon] of syn) if (t.includes(' ' + alt + ' ')) t = t.split(' ' + alt + ' ').join(' ' + canon + ' ');
  return t.trim().split(' ').filter(w => w && !STOP.has(w));
}

// Nombre de fautes de frappe tolérées selon la longueur (même règle que les autres jeux : 1 dès 6 lettres, 2 dès 12).
const tolerance = len => (len >= 12 ? 2 : len >= 6 ? 1 : 0);
const close = (a, b) => a === b || (a[0] === b[0] && Math.abs(a.length - b.length) <= tolerance(b.length) && lev(a, b) <= tolerance(b.length));

// Score de correspondance entre une proposition et une forme acceptée (0 = aucune).
function score(g, f) {
  const gk = g.join(' '), fk = f.join(' ');
  if (!gk || !fk) return 0;
  if (gk === fk) return 100;
  if (g.length === f.length && [...g].sort().join(' ') === [...f].sort().join(' ')) return 95;
  if (close(gk, fk)) return 85 - lev(gk, fk) * 5;
  // Tous les mots de la forme sont présents dans la proposition (« mon vieux chargeur de portable »),
  // avec au plus 2 mots en plus et une forme assez significative.
  if (f.join('').length >= 4 && g.length - f.length <= 2 && g.length >= f.length) {
    const pool = [...g];
    for (const w of f) {
      const i = pool.findIndex(x => close(x, w));
      if (i < 0) return 0;
      pool.splice(i, 1);
    }
    return 60 + f.length * 2 - pool.length * 3;
  }
  return 0;
}

// Prépare une question : answers = [{ answer, accepted_variants }], synonyms = groupes globaux.
function compile(answers, synonyms) {
  const syn = compileSynonyms(synonyms);
  return {
    syn,
    answers: answers.map(a => ({
      forms: [a.answer, ...(a.accepted_variants || [])].map(x => tokens(x, syn)).filter(f => f.length),
    })),
  };
}

// → { index, score } si une réponse correspond, { ambiguous: true, indexes } si la proposition
//   correspond aussi bien à deux réponses différentes, null sinon.
function match(compiled, guess) {
  const g = tokens(guess, compiled.syn);
  if (!g.length) return null;
  const best = compiled.answers.map((a, index) => ({ index, score: Math.max(0, ...a.forms.map(f => score(g, f))) }))
    .filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  if (!best.length) return null;
  if (best[1] && best[1].score === best[0].score) return { ambiguous: true, indexes: best.filter(x => x.score === best[0].score).map(x => x.index) };
  return best[0];
}

module.exports = { clean, singular, tokens, compile, match };
