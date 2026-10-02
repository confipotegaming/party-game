// Base de questions du Grand Sondage, séparée du code.
// Le projet n'ayant pas de base de données, les données vivent dans un fichier JSON (data/sondage.json,
// ou le chemin donné par la variable d'environnement SONDAGE_DB) organisé comme deux tables :
//   questions : id, question, category, difficulty, language, active, created_at
//   answers   : id, question_id, answer, accepted_variants, votes, position
// Toute la lecture/écriture passe par ce module : le remplacer par une vraie base (SQLite, Postgres…)
// ne demande de toucher à rien d'autre.
const fs = require('fs');
const path = require('path');
const cfg = require('./config');
const { clean } = require('./matcher');

const DEFAULT_FILE = process.env.SONDAGE_DB || path.join(__dirname, '..', '..', 'data', 'sondage.json');
const LIMITS = { question: 200, category: 40, answer: 60, variant: 60, variants: 30, minAnswers: 2, maxAnswers: 10, votes: 1000 };

class ValidationError extends Error {}
const fail = (msg) => { throw new ValidationError(msg); };
const str = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const bool = (v, d = true) => (v === undefined || v === null || v === '' ? d : !['false', '0', 'non', 'no', 'off'].includes(String(v).toLowerCase()));

// Accepte « Facile », « moyen », « difficile », « easy », 1/2/3…
function difficultyOf(v) {
  const k = clean(v);
  const alias = { facile: 'facile', easy: 'facile', 1: 'facile', moyen: 'moyen', medium: 'moyen', normal: 'moyen', 2: 'moyen', difficile: 'difficile', hard: 'difficile', 3: 'difficile' };
  return alias[k] || Object.keys(cfg.DIFFICULTIES).find(d => clean(cfg.DIFFICULTIES[d].label) === k);
}

function variantsOf(v) {
  const list = Array.isArray(v) ? v : String(v ?? '').split(/[|\n]/);
  const out = [];
  for (const x of list.map(x => str(x, LIMITS.variant)).filter(Boolean)) if (!out.some(y => clean(y) === clean(x))) out.push(x);
  return out.slice(0, LIMITS.variants);
}

// Vérifie et nettoie une question au format « imbriqué » (celui de l'import et du back-office).
function sanitize(input) {
  if (!input || typeof input !== 'object') fail('Question invalide.');
  const question = str(input.question, LIMITS.question);
  if (question.length < 5) fail('Le texte de la question est trop court.');
  const difficulty = difficultyOf(input.difficulty ?? 'moyen');
  if (!difficulty) fail(`Difficulté inconnue : « ${input.difficulty} ».`);
  const raw = Array.isArray(input.answers) ? input.answers : [];
  const answers = raw.map((a, i) => ({
    answer: str(a && a.answer, LIMITS.answer),
    accepted_variants: variantsOf(a && a.accepted_variants),
    votes: Math.max(0, Math.min(LIMITS.votes, Math.round(Number(a && a.votes) || 0))),
    position: Number(a && a.position) || i + 1,
  })).filter(a => a.answer);
  if (answers.length < LIMITS.minAnswers) fail(`Il faut au moins ${LIMITS.minAnswers} réponses.`);
  if (answers.length > LIMITS.maxAnswers) fail(`${LIMITS.maxAnswers} réponses maximum.`);
  const seen = new Set();
  for (const a of answers) {
    if (seen.has(clean(a.answer))) fail(`Réponse en double : « ${a.answer} ».`);
    seen.add(clean(a.answer));
  }
  // Positions : ordre donné, à égalité les plus votées d'abord ; renumérotées 1..n.
  answers.sort((a, b) => a.position - b.position || b.votes - a.votes).forEach((a, i) => (a.position = i + 1));
  return {
    question,
    category: str(input.category, LIMITS.category) || 'Culture générale',
    difficulty,
    language: str(input.language, 5).toLowerCase() || cfg.LANGUAGE,
    active: bool(input.active),
    answers,
  };
}

function emptyDb() {
  return { version: 1, next: { question: 1, answer: 1 }, categories: [...cfg.CATEGORIES], synonyms: [], questions: [], answers: [] };
}

class SurveyStore {
  constructor(file = DEFAULT_FILE) {
    this.file = file;
    this.db = null;
  }

  load() {
    if (this.db) return this.db;
    try {
      this.db = { ...emptyDb(), ...JSON.parse(fs.readFileSync(this.file, 'utf8')) };
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      this.db = emptyDb();
    }
    return this.db;
  }

  save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.db, null, 2) + '\n');
    fs.renameSync(tmp, this.file); // écriture atomique
  }

  // ----- Lecture -----
  categories() {
    const db = this.load();
    return [...new Set([...(db.categories || []), ...db.questions.map(q => q.category)])];
  }
  synonyms() { return this.load().synonyms || []; }

  answersOf(id) {
    return this.load().answers.filter(a => a.question_id === id).sort((a, b) => a.position - b.position);
  }
  get(id) {
    const q = this.load().questions.find(x => x.id === Number(id));
    return q ? { ...q, answers: this.answersOf(q.id) } : null;
  }

  list({ search, category, difficulty, active, language } = {}) {
    const s = clean(search || '');
    return this.load().questions
      .filter(q => !category || q.category === category)
      .filter(q => !difficulty || q.difficulty === difficulty)
      .filter(q => !language || q.language === language)
      .filter(q => active === undefined || active === '' || q.active === bool(active))
      .map(q => ({ ...q, answers: this.answersOf(q.id) }))
      .filter(q => !s || clean([q.question, q.category, ...q.answers.map(a => a.answer)].join(' ')).includes(s))
      .sort((a, b) => b.id - a.id);
  }

  // Questions jouables (actives, au moins 2 réponses), pour le jeu.
  playable({ category, difficulty, language = cfg.LANGUAGE, exclude = [] } = {}) {
    return this.list({ category, difficulty, language, active: true })
      .filter(q => q.answers.length >= LIMITS.minAnswers && !exclude.includes(q.id));
  }

  // ----- Écriture -----
  findDuplicate(text, exceptId) {
    const k = clean(text);
    return this.load().questions.find(q => q.id !== exceptId && clean(q.question) === k);
  }

  writeAnswers(qid, answers) {
    const db = this.load();
    db.answers = db.answers.filter(a => a.question_id !== qid);
    for (const a of answers) db.answers.push({ id: db.next.answer++, question_id: qid, ...a });
  }

  create(input) {
    const data = sanitize(input);
    if (this.findDuplicate(data.question)) fail('Cette question existe déjà.');
    const db = this.load();
    const { answers, ...q } = data;
    const row = { id: db.next.question++, ...q, created_at: new Date().toISOString() };
    db.questions.push(row);
    this.writeAnswers(row.id, answers);
    this.save();
    return this.get(row.id);
  }

  update(id, input) {
    const row = this.load().questions.find(x => x.id === Number(id));
    if (!row) return null;
    const merged = sanitize({ ...this.get(row.id), ...input });
    if (this.findDuplicate(merged.question, row.id)) fail('Une autre question a déjà ce texte.');
    const { answers, ...q } = merged;
    Object.assign(row, q);
    this.writeAnswers(row.id, answers);
    this.save();
    return this.get(row.id);
  }

  setActive(id, active) {
    const row = this.load().questions.find(x => x.id === Number(id));
    if (!row) return null;
    row.active = bool(active);
    this.save();
    return this.get(row.id);
  }

  remove(id) {
    const db = this.load(), n = db.questions.length;
    db.questions = db.questions.filter(q => q.id !== Number(id));
    if (db.questions.length === n) return false;
    db.answers = db.answers.filter(a => a.question_id !== Number(id));
    this.save();
    return true;
  }

  // Import en masse. mode : 'skip' (ignore les questions déjà présentes) ou 'replace' (les met à jour).
  importMany(list, { mode = 'skip' } = {}) {
    const report = { created: 0, updated: 0, skipped: 0, errors: [] };
    const db = this.load();
    (Array.isArray(list) ? list : []).forEach((input, i) => {
      try {
        const q = sanitize(input);
        const dup = this.findDuplicate(q.question);
        const { answers, ...row } = q;
        if (dup && mode !== 'replace') return report.skipped++;
        if (dup) { Object.assign(dup, row); this.writeAnswers(dup.id, answers); report.updated++; return; }
        const created = { id: db.next.question++, ...row, created_at: new Date().toISOString() };
        db.questions.push(created);
        this.writeAnswers(created.id, answers);
        report.created++;
      } catch (err) {
        if (!(err instanceof ValidationError)) throw err;
        report.errors.push({ index: i, question: input && input.question, error: err.message });
      }
    });
    if (report.created || report.updated) this.save();
    return report;
  }

  // Export au même format que l'import (questions avec leurs réponses imbriquées).
  exportAll() {
    return this.list().reverse().map(({ id, created_at, answers, ...q }) => ({
      ...q, answers: answers.map(({ answer, accepted_variants, votes, position }) => ({ answer, accepted_variants, votes, position })),
    }));
  }
}

module.exports = { SurveyStore, ValidationError, sanitize, difficultyOf, LIMITS, store: new SurveyStore() };
