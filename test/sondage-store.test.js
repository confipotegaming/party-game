const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { SurveyStore, ValidationError } = require('../games/sondage/store');
const importer = require('../games/sondage/importer');

const tmp = () => new SurveyStore(path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sondage-')), 'db.json'));
const Q = (question, extra = {}) => ({
  question, category: 'Nourriture', difficulty: 'Facile',
  answers: [{ answer: 'Pomme', votes: 40, accepted_variants: 'pommes|golden' }, { answer: 'Banane', votes: 30 }, { answer: 'Fraise', votes: 20 }], ...extra,
});

test('CRUD et persistance au format questions / answers', () => {
  const s = tmp();
  const q = s.create(Q('Citez un fruit que vous aimez.'));
  assert.strictEqual(q.difficulty, 'facile');
  assert.deepStrictEqual(q.answers.map(a => [a.answer, a.position, a.question_id]), [['Pomme', 1, q.id], ['Banane', 2, q.id], ['Fraise', 3, q.id]]);
  assert.deepStrictEqual(q.answers[0].accepted_variants, ['pommes', 'golden']);

  const file = JSON.parse(fs.readFileSync(s.file, 'utf8'));
  assert.deepStrictEqual(Object.keys(file.questions[0]).sort(), ['active', 'category', 'created_at', 'difficulty', 'id', 'language', 'question']);
  assert.deepStrictEqual(Object.keys(file.answers[0]).sort(), ['accepted_variants', 'answer', 'id', 'position', 'question_id', 'votes']);

  const u = s.update(q.id, { answers: [{ answer: 'Kiwi', votes: 50 }, { answer: 'Pomme', votes: 10 }] });
  assert.deepStrictEqual(u.answers.map(a => a.answer), ['Kiwi', 'Pomme']);
  assert.strictEqual(new SurveyStore(s.file).get(q.id).answers.length, 2, 'relu depuis le disque');

  assert.strictEqual(s.setActive(q.id, false).active, false);
  assert.strictEqual(s.playable().length, 0);
  assert.ok(s.remove(q.id));
  assert.strictEqual(s.load().answers.length, 0);
});

test('validation', () => {
  const s = tmp();
  assert.throws(() => s.create({ question: 'Hein ?' }), ValidationError);
  assert.throws(() => s.create(Q('Une question valide ?', { difficulty: 'impossible' })), ValidationError);
  assert.throws(() => s.create(Q('Une question valide ?', { answers: [{ answer: 'Seule', votes: 3 }] })), ValidationError);
  assert.throws(() => s.create(Q('Une question valide ?', { answers: [{ answer: 'Pomme' }, { answer: 'pommé' }] })), /double/);
  s.create(Q('Une question valide ?'));
  assert.throws(() => s.create(Q('une QUESTION valide')), /existe déjà/);
});

test('filtres et recherche', () => {
  const s = tmp();
  s.create(Q('Citez un fruit rouge.'));
  s.create(Q('Citez un sport collectif.', { category: 'Sport', difficulty: 'difficile', answers: [{ answer: 'Football', votes: 50 }, { answer: 'Rugby', votes: 30 }] }));
  assert.strictEqual(s.list({ category: 'Sport' }).length, 1);
  assert.strictEqual(s.list({ difficulty: 'facile' }).length, 1);
  assert.strictEqual(s.list({ search: 'rugby' }).length, 1);
  assert.strictEqual(s.list({ search: 'FRUIT' }).length, 1);
  assert.ok(s.categories().includes('Vie quotidienne') && s.categories().includes('Sport'));
});

test('import JSON et CSV, doublons ignorés ou remplacés', () => {
  const s = tmp();
  const json = JSON.stringify({ questions: [Q('Citez un fruit jaune.'), { question: 'Invalide' }] });
  let r = s.importMany(importer.parse(json));
  assert.deepStrictEqual([r.created, r.skipped, r.errors.length], [1, 0, 1]);
  r = s.importMany(importer.parse(json));
  assert.deepStrictEqual([r.created, r.skipped], [0, 1]);

  const csv = 'question;category;difficulty;answer;votes;accepted_variants\n' +
    '"Citez un fruit jaune.";Nourriture;moyen;Citron;60;citrons|"lemon"\n' +
    'Citez un fruit jaune.;Nourriture;moyen;Banane;40;\n' +
    'Citez une couleur.;Culture générale;facile;Bleu;55;\nCitez une couleur.;Culture générale;facile;Rouge;45;';
  r = s.importMany(importer.parse(csv, 'csv'), { mode: 'replace' });
  assert.deepStrictEqual([r.created, r.updated], [1, 1]);
  const fruit = s.list({ search: 'fruit jaune' })[0];
  assert.strictEqual(fruit.difficulty, 'moyen');
  assert.deepStrictEqual(fruit.answers[0].accepted_variants, ['citrons', 'lemon']);

  const csvComma = 'question,answer,votes\nCitez un légume.,Carotte,70\nCitez un légume.,Poireau,30';
  assert.strictEqual(s.importMany(importer.parse(csvComma)).created, 1);
  assert.throws(() => importer.parse('foo;bar\n1;2', 'csv'), /question/);

  const exported = s.exportAll();
  const s2 = tmp();
  assert.strictEqual(s2.importMany(exported).created, exported.length, 'l’export se réimporte');
});
