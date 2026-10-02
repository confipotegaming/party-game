// Mode plateau : tirage varié des mini-jeux, roue, barème des points, et exclusion du jeu du boss.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const B = require('../games/_board');

const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const ids = [...src.match(/for \(const id of \[([\s\S]*?)\]\)/)[1].matchAll(/'([a-z]+)'/g)].map(m => m[1]);
const games = Object.fromEntries(ids.map(id => [id, require('../games/' + id)]));
// Graine fixe pour des tests reproductibles.
const seeded = (seed = 42) => () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

// Simule `turns` tirages successifs comme le fait le serveur.
function draw(pool, turns, { rng = seeded(), history = [] } = {}) {
  const session = [];
  for (let i = 0; i < turns; i++) session.push(B.pickNext(pool, { session, history }, rng).id);
  return session;
}

test('le jeu du boss ne sort jamais à la roue', () => {
  const withBoss = { ...games, boss: { id: 'boss', name: 'Le Boss', category: 'Boss', minPlayers: 1 },
    'boss-final': { id: 'bossfinal', name: 'Boss final', minPlayers: 1 }, autre: { id: 'secret', name: 'Secret', boss: true } };
  const pool = B.eligible(withBoss, 4);
  assert.ok(!pool.some(g => /boss/i.test(g.id) || g.boss));
  assert.strictEqual(pool.length, ids.filter(id => id !== 'boss').length); // le vrai jeu « boss » est enregistré mais exclu
  assert.ok(ids.includes('boss') && B.isBoss(games.boss));
  for (let s = 1; s <= 20; s++) assert.ok(!draw(pool, 30, { rng: seeded(s) }).some(id => /boss/i.test(id)));
  const w = B.wheel(pool, pool[0], seeded());
  assert.ok(!w.segments.some(x => /boss/i.test(x.id)));
});

test('jeux filtrés selon le nombre de joueurs', () => {
  const solo = B.eligible(games, 1);
  assert.ok(solo.length > 0);
  assert.ok(solo.every(g => (g.minPlayers || 2) <= 1));
});

test('aucun jeu ne revient avant que tous les autres soient sortis', () => {
  const pool = B.eligible(games, 4);
  for (let s = 1; s <= 30; s++) {
    const seq = draw(pool, pool.length * 2, { rng: seeded(s) });
    assert.strictEqual(new Set(seq.slice(0, pool.length)).size, pool.length, 'premier cycle complet');
    assert.strictEqual(new Set(seq.slice(pool.length)).size, pool.length, 'second cycle complet');
  }
});

test('jamais deux fois de suite le même jeu, et presque jamais la même famille de gameplay', () => {
  const pool = B.eligible(games, 4);
  let same = 0, pairs = 0;
  for (let s = 1; s <= 200; s++) {
    const seq = draw(pool, 60, { rng: seeded(s) });
    for (let i = 1; i < seq.length; i++) assert.notStrictEqual(seq[i], seq[i - 1]);
    const fam = seq.map(id => B.familyOf(games[id]));
    same += fam.filter((f, i) => i && f === fam[i - 1]).length;
    pairs += seq.length - 1;
  }
  // Seule la fin d'un cycle complet peut l'imposer (quand il ne reste qu'une famille à jouer).
  assert.ok(same / pairs < 0.03, `familles identiques enchaînées : ${(100 * same / pairs).toFixed(1)} %`);
});

test('une partie de 5 tours couvre au moins 4 familles différentes', () => {
  const pool = B.eligible(games, 4);
  for (let s = 1; s <= 50; s++) {
    const fams = new Set(draw(pool, 5, { rng: seeded(s) }).map(id => B.familyOf(games[id])));
    assert.ok(fams.size >= 4, `seulement ${fams.size} familles`);
  }
});

test('une nouvelle partie évite les jeux de la partie précédente', () => {
  const pool = B.eligible(games, 4);
  for (let s = 1; s <= 30; s++) {
    const first = draw(pool, 5, { rng: seeded(s) });
    const second = draw(pool, 3, { rng: seeded(s + 100), history: first });
    assert.ok(second.every(id => !first.includes(id)), `${second} déjà dans ${first}`);
  }
});

test('le premier jeu tiré est bien réparti sur l’ensemble des jeux', () => {
  const pool = B.eligible(games, 4), count = {}, rng = seeded(7), N = 6000;
  for (let i = 0; i < N; i++) { const id = B.pickNext(pool, {}, rng).id; count[id] = (count[id] || 0) + 1; }
  assert.strictEqual(Object.keys(count).length, pool.length);
  const expected = N / pool.length;
  for (const [id, n] of Object.entries(count)) assert.ok(n > expected * 0.5 && n < expected * 1.6, `${id} : ${n}`);
});

test('la roue contient le jeu tiré, sans doublon', () => {
  const pool = B.eligible(games, 4), chosen = games.wario;
  const w = B.wheel(pool, chosen, seeded(3));
  assert.strictEqual(w.segments.length, 8);
  assert.strictEqual(w.segments[w.target].id, 'wario');
  assert.strictEqual(new Set(w.segments.map(x => x.id)).size, 8);
  const small = B.wheel(pool.slice(0, 3), pool[1], seeded(3));
  assert.strictEqual(small.segments.length, 3);
  assert.strictEqual(small.segments[small.target].id, pool[1].id);
});

test('barème : places, ex æquo, dernier à zéro, manche finale doublée', () => {
  const r = Object.fromEntries(B.placements({ a: 900, b: 500, c: 500, d: 100 }).map(x => [x.id, x]));
  assert.deepStrictEqual([r.a.place, r.b.place, r.c.place, r.d.place], [1, 2, 2, 4]);
  assert.deepStrictEqual([r.a.gain, r.b.gain, r.c.gain, r.d.gain], [10, 6, 6, 0]);
  const x2 = Object.fromEntries(B.placements({ a: 3, b: 1 }, 2).map(x => [x.id, x.gain]));
  assert.deepStrictEqual(x2, { a: 20, b: 0 });
  assert.ok(B.placements({ a: 0, b: 0 }).every(x => x.gain === 0), 'personne n’a marqué');
  assert.ok(B.placements({ a: 50, b: 50 }).every(x => x.gain === 10), 'tous premiers ex æquo');
});
