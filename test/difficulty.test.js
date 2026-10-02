// Difficulté des questions : tirage progressif / par niveau, bonus de points, et cohérence des banques de questions.
const test = require('node:test');
const assert = require('node:assert');
const diff = require('../games/_difficulty');
const { makeRoom } = require('./harness');

const bank = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3].map((d, i) => ({ d, id: i }));

test('mode progressif : mélange des niveaux, du plus facile au plus difficile', () => {
  const qs = diff.pick(bank, 5, 'mix');
  assert.deepStrictEqual(qs.map(q => q.d), [1, 1, 2, 2, 3]);
  assert.strictEqual(new Set(qs.map(q => q.id)).size, 5);
});

test('niveau imposé : priorité au niveau choisi, complété par les voisins', () => {
  assert.ok(diff.pick(bank, 4, '3').every(q => q.d === 3));
  const qs = diff.pick(bank, 6, '1');
  assert.strictEqual(qs.filter(q => q.d === 1).length, 4);
  assert.strictEqual(qs.filter(q => q.d === 2).length, 2);
});

test('bonus de points et mode par défaut', () => {
  assert.strictEqual(diff.bonus(1), 1);
  assert.strictEqual(diff.bonus(3), 1.5);
  assert.strictEqual(diff.bonus(undefined), 1);
  assert.strictEqual(diff.modeOf({}), 'mix');
  assert.strictEqual(diff.modeOf({ options: { difficulty: 'nimporte' } }), 'mix');
  assert.strictEqual(diff.modeOf({ options: { difficulty: '2' } }), '2');
});

const graded = ['estimation', 'emojis', 'filmresume', 'quisuisje', 'motatrous', 'express', 'quatreimages', 'intrus', 'dessin', 'motinterdit', 'pixelflou'];
for (const id of graded) {
  test(`jeu « ${id} » : la question affiche sa difficulté, quel que soit le mode`, () => {
    const game = require('../games/' + id);
    assert.ok(game.difficulty, 'le jeu déclare gérer la difficulté');
    for (const mode of diff.MODES) {
      const h = makeRoom(['Alice', 'Bob', 'Chloé']);
      h.room.options = { difficulty: mode };
      h.start(game);
      const d = h.room.phase.difficulty;
      assert.ok(d && [1, 2, 3].includes(d.level) && d.label, `difficulté affichée (mode ${mode})`);
      if (mode !== 'mix') assert.strictEqual(String(d.level), mode);
    }
  });
}

test('banques de questions : assez de questions et chaque niveau représenté', () => {
  const sizes = {
    emojis: require('../games/emojis').questions, filmresume: require('../games/filmresume').questions,
    quisuisje: require('../games/quisuisje').questions, motatrous: require('../games/motatrous').questions,
    express: require('../games/express').questions, quatreimages: require('../games/quatreimages').questions,
    dessin: require('../games/dessin').words, motinterdit: require('../games/motinterdit').words,
  };
  for (const [id, qs] of Object.entries(sizes)) {
    assert.ok(qs.length >= 30, `${id} : ${qs.length} questions`);
    for (const lv of [1, 2, 3]) assert.ok(qs.filter(q => q.d === lv).length >= 5, `${id} : niveau ${lv}`);
  }
  for (const q of require('../games/quisuisje').questions) assert.strictEqual(q.clues.length, 4, q.a);
});
