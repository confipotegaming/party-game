// Import de questions du Grand Sondage : JSON, CSV ou URL externe (API renvoyant du JSON ou du CSV).
//
// JSON : un tableau (ou { "questions": [...] }) de
//   { "question", "category", "difficulty", "language", "active", "answers": [{ "answer", "accepted_variants", "votes", "position" }] }
//
// CSV (séparateur « ; » ou « , », première ligne = en-têtes), une ligne par réponse :
//   question;category;difficulty;language;active;answer;votes;accepted_variants;position
//   les variantes sont séparées par « | ». Les lignes d'une même question sont regroupées par son texte.
const { ValidationError } = require('./store');

function parseJSON(text) {
  const data = typeof text === 'string' ? JSON.parse(text) : text;
  const list = Array.isArray(data) ? data : data && Array.isArray(data.questions) ? data.questions : null;
  if (!list) throw new ValidationError('JSON attendu : un tableau de questions ou { "questions": [...] }.');
  return list;
}

// Petit lecteur CSV (guillemets, guillemets doublés, retours à la ligne dans un champ).
function csvRows(text, sep) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}

function parseCSV(text) {
  text = String(text).replace(/^﻿/, '');
  const first = text.split(/\r?\n/, 1)[0];
  const sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ',';
  const [head, ...rows] = csvRows(text, sep);
  if (!head) throw new ValidationError('CSV vide.');
  const cols = head.map(h => h.trim().toLowerCase());
  for (const need of ['question', 'answer']) if (!cols.includes(need)) throw new ValidationError(`Colonne « ${need} » manquante dans le CSV.`);
  const byText = new Map();
  for (const r of rows) {
    const o = Object.fromEntries(cols.map((c, i) => [c, (r[i] || '').trim()]));
    if (!o.question) continue;
    if (!byText.has(o.question)) {
      byText.set(o.question, { question: o.question, category: o.category, difficulty: o.difficulty || undefined, language: o.language, active: o.active, answers: [] });
    }
    byText.get(o.question).answers.push({
      answer: o.answer, votes: o.votes, accepted_variants: o.accepted_variants || o.variants || '',
      position: o.position || byText.get(o.question).answers.length + 1,
    });
  }
  return [...byText.values()];
}

function parse(text, format) {
  const f = String(format || '').toLowerCase();
  if (f === 'csv') return parseCSV(text);
  if (f === 'json') return parseJSON(text);
  return /^\s*[[{]/.test(text) ? parseJSON(text) : parseCSV(text); // détection automatique
}

// API externe : n'importe quelle URL http(s) renvoyant le format JSON ou CSV ci-dessus.
async function fetchUrl(url, { timeoutMs = 10000, maxBytes = 2_000_000 } = {}) {
  const u = new URL(url);
  if (!['http:', 'https:'].includes(u.protocol)) throw new ValidationError('Seules les URL http(s) sont acceptées.');
  const res = await fetch(u, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new ValidationError(`La source a répondu ${res.status}.`);
  const text = await res.text();
  if (text.length > maxBytes) throw new ValidationError('Fichier trop volumineux.');
  const type = res.headers.get('content-type') || '';
  return parse(text, type.includes('json') || u.pathname.endsWith('.json') ? 'json' : type.includes('csv') || u.pathname.endsWith('.csv') ? 'csv' : '');
}

module.exports = { parse, parseJSON, parseCSV, fetchUrl };
