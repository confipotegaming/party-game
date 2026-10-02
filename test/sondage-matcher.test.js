const test = require('node:test');
const assert = require('node:assert');
const { compile, match } = require('../games/sondage/matcher');

const SYN = [['téléphone', 'portable', 'smartphone', 'mobile'], ['télévision', 'télé', 'tv']];
const Q = compile([
  { answer: 'Chargeur de téléphone', accepted_variants: ['chargeur'] },
  { answer: 'Brosse à dents', accepted_variants: ['dentifrice'] },
  { answer: 'Passeport', accepted_variants: ["carte d'identité", 'papiers'] },
  { answer: 'Lunettes de soleil' },
  { answer: 'Médicaments' },
  { answer: 'Brosse à cheveux' },
], SYN);
const idx = (g) => { const m = match(Q, g); return m && !m.ambiguous ? m.index : m; };

test('accents, majuscules, espaces et articles', () => {
  assert.strictEqual(idx('  MEDICAMENTS '), 4);
  assert.strictEqual(idx('la brosse a dents'), 1);
  assert.strictEqual(idx('Les lunettes de soleil'), 3);
});
test('pluriels', () => {
  assert.strictEqual(idx('passeports'), 2);
  assert.strictEqual(idx('médicament'), 4);
  assert.strictEqual(idx('brosse à dent'), 1);
});
test('fautes de frappe légères', () => {
  assert.strictEqual(idx('passport'), 2);
  assert.strictEqual(idx('paseport'), 2);
  assert.strictEqual(idx('pasport'), null, '2 fautes sur 9 lettres : trop loin');
  assert.strictEqual(idx('medicamant'), 4);
  assert.strictEqual(idx('chargeur de telefone'), 0);
});
test('synonymes et variantes enregistrées', () => {
  assert.strictEqual(idx('chargeur de portable'), 0);
  assert.strictEqual(idx('mon chargeur de smartphone'), 0);
  assert.strictEqual(idx('chargeur'), 0);
  assert.strictEqual(idx("carte d’identité"), 2);
  assert.strictEqual(idx('dentifrice'), 1);
});
test('ordre des mots', () => {
  assert.strictEqual(idx('soleil lunettes'), 3);
});
test('pas trop permissif', () => {
  for (const g of ['brosse', 'lunettes', 'téléphone', 'pass', 'chien', 'soleil', 'dents', '', '!!!']) assert.strictEqual(idx(g), null, g);
  assert.strictEqual(idx('brosse à cheveux'), 5);
  assert.notStrictEqual(idx('brosse à cheveux'), 1);
});
test('une proposition qui correspond à deux réponses est ambiguë', () => {
  const q = compile([{ answer: 'Chat', accepted_variants: ['animal'] }, { answer: 'Chien', accepted_variants: ['animal'] }], []);
  assert.deepStrictEqual(match(q, 'animal'), { ambiguous: true, indexes: [0, 1] });
});
test('toutes les questions de démonstration reconnaissent leurs propres variantes', () => {
  const db = require('../data/sondage.json');
  for (const q of db.questions) {
    const answers = db.answers.filter(a => a.question_id === q.id).sort((a, b) => a.position - b.position);
    const c = compile(answers, db.synonyms);
    answers.forEach((a, i) => [a.answer, ...a.accepted_variants].forEach(v => {
      const m = match(c, v);
      assert.ok(m && !m.ambiguous && m.index === i, `${q.question} → « ${v} » devrait donner « ${a.answer} »`);
    }));
  }
});

test('au moins 10 questions actives par catégorie, avec les 3 difficultés', () => {
  const db = require('../data/sondage.json');
  const cfg = require('../games/sondage/config');
  for (const cat of cfg.CATEGORIES) {
    const qs = db.questions.filter(q => q.category === cat && q.active);
    assert.ok(qs.length >= 10, `${cat} : ${qs.length} questions`);
    for (const d of Object.keys(cfg.DIFFICULTIES)) assert.ok(qs.some(q => q.difficulty === d), `${cat} : aucune question ${d}`);
  }
});
