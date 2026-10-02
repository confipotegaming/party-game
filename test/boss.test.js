// Boss Fight : choix des classes, dégâts en quarts de cœur, métamorphoses, victoire et Game Over.
// La boucle temps réel est remplacée par des appels directs à la simulation (step).
const test = require('node:test');
const assert = require('node:assert');
const { makeRoom } = require('./harness');
const boss = require('../games/boss');
const { step, snapshot, MAX_HP } = boss._sim;

function setup(names = ['Alice', 'Bob', 'Chloé']) {
  const h = makeRoom(names);
  h.start(boss);
  return h;
}
const run = (h, seconds, each) => { for (let t = 0; t < seconds; t += 0.05) { if (h.room.phase.step !== 'fight') return; if (each) each(); step(h.room, h.api, 0.05); } };
const g = h => h.room.g;

test('choix des classes visible par tous, modifiable, et classe au hasard pour les retardataires', () => {
  const h = setup();
  assert.strictEqual(h.room.phase.kind, 'bossPick');
  assert.strictEqual(h.room.phase.data.classes.length, 5);
  assert.deepStrictEqual(boss.playerAction(h.room, 'p0', { pick: 'mage' }), { status: 'ok' });
  boss.playerAction(h.room, 'p0', { pick: 'archer' });
  boss.playerAction(h.room, 'p1', { pick: 'heal' });
  assert.strictEqual(boss.playerAction(h.room, 'p1', { pick: 'dragon' }).status, 'ignored');
  assert.deepStrictEqual(h.room.phase.data.picks, { p0: 'archer', p1: 'heal' });
  h.endPhase();
  assert.strictEqual(h.room.phase.kind, 'boss');
  const heroes = h.room.phase.data.heroes;
  assert.strictEqual(heroes.length, 3);
  assert.strictEqual(heroes.find(x => x.id === 'p0').cls, 'archer');
  assert.ok(boss.CLASSES[heroes.find(x => x.id === 'p2').cls]);
  // trois boss différents parmi les boss mythiques
  assert.strictEqual(new Set(g(h).forms).size, 3);
  g(h).forms.forEach(k => assert.ok(boss.BOSSES[k]));
});

test('5 cœurs, un coup retire un quart de cœur, puis invincibilité temporaire', () => {
  const h = setup(['Alice']);
  boss.playerAction(h.room, 'p0', { pick: 'archer' });
  h.endPhase();
  run(h, 3.5); // fin de la présentation du boss
  const G = g(h), hero = G.heroes[0];
  assert.strictEqual(G.state, 'fight');
  assert.strictEqual(hero.hp, MAX_HP);
  assert.strictEqual(MAX_HP, 20);
  G.bullets = []; G.hazards = [];
  G.boss.next = 99; G.boss.act = null;
  G.bullets.push({ id: 1, kind: 'fire', x: hero.x, y: hero.y, vx: 0, vy: 0, r: 4, life: 5 });
  step(h.room, h.api, 0.05);
  assert.strictEqual(hero.hp, MAX_HP - 1);
  G.bullets.push({ id: 2, kind: 'fire', x: hero.x, y: hero.y, vx: 0, vy: 0, r: 4, life: 5 });
  step(h.room, h.api, 0.05);
  assert.strictEqual(hero.hp, MAX_HP - 1, 'invincible juste après un coup');
  const snap = snapshot(h.room);
  assert.strictEqual(snap.p[0].hp, MAX_HP - 1);
});

test('le tank pare un coup sur deux', () => {
  const h = setup(['Tom']);
  boss.playerAction(h.room, 'p0', { pick: 'tank' });
  h.endPhase();
  run(h, 3.5);
  const G = g(h), hero = G.heroes[0];
  G.boss.next = 99; G.bullets = []; G.hazards = [];
  for (let i = 0; i < 4; i++) {
    hero.inv = 0;
    G.bullets.push({ id: 10 + i, kind: 'fire', x: hero.x, y: hero.y, vx: 0, vy: 0, r: 4, life: 5 });
    step(h.room, h.api, 0.05);
  }
  assert.strictEqual(hero.hp, MAX_HP - 2);
});

test('les attaques spéciales : soin, rempart, invocation', () => {
  const h = setup(['Soin', 'Tank', 'Invoc']);
  boss.playerAction(h.room, 'p0', { pick: 'heal' });
  boss.playerAction(h.room, 'p1', { pick: 'tank' });
  boss.playerAction(h.room, 'p2', { pick: 'summoner' });
  h.endPhase();
  run(h, 3.5);
  const G = g(h), [heal, tank, inv] = G.heroes;
  G.boss.next = 99; G.bullets = []; G.hazards = [];
  heal.spCd = 0; tank.spCd = 0; inv.spCd = 0;
  tank.hp = 0; tank.ko = true; inv.hp = 10;
  boss.input(h.room, 'p0', { dx: 0, dy: 0, sp: 1 }); // nouvel appui sur « spécial »
  step(h.room, h.api, 0.05);
  assert.strictEqual(tank.ko, false);
  assert.strictEqual(tank.hp, 8);
  assert.strictEqual(inv.hp, 14);
  boss.input(h.room, 'p1', { sp: 1 });
  step(h.room, h.api, 0.05);
  assert.ok(G.heroes.every(x => x.shield > 0));
  boss.input(h.room, 'p2', { sp: 1 });
  step(h.room, h.api, 0.05);
  assert.strictEqual(G.summons.length, 1);
});

test('3 métamorphoses, puis cinématique de fin et des points pour tous les joueurs', () => {
  const h = setup();
  ['archer', 'mage', 'tank'].forEach((c, i) => boss.playerAction(h.room, 'p' + i, { pick: c }));
  h.endPhase();
  const G = g(h), seen = [];
  const keepAlive = () => { for (const hero of G.heroes) { hero.input.at = Date.now(); hero.hp = MAX_HP; hero.inv = 99; } };
  const until = (cond, max = 12) => { for (let t = 0; t < max && !cond(); t += 0.05) { keepAlive(); step(h.room, h.api, 0.05); } assert.ok(cond(), 'délai dépassé'); };
  boss.input(h.room, 'p0', { atk: true });
  for (let form = 0; form < 3; form++) {
    until(() => G.state === 'fight'); // après la présentation du boss
    seen.push(G.boss.key);
    G.boss.hp = 3;
    if (form < 2) { until(() => G.formIdx === form + 1); assert.strictEqual(G.state, 'intro', 'métamorphose'); }
  }
  until(() => h.room.phase.kind === 'bossEnding');
  assert.deepStrictEqual(seen, G.forms);
  assert.strictEqual(h.room.phase.kind, 'bossEnding');
  const scores = Object.values(h.room.players).map(p => p.score);
  assert.ok(scores.every(s => s >= 500), 'tout le monde gagne des points : ' + scores);
  assert.strictEqual(h.room.phase.data.rows.length, 3);
  h.endPhase();
  assert.strictEqual(h.room.phase.kind, 'scores');
});

test('équipe entière K.O. : Game Over, puis « Continuer » reprend à la même forme', () => {
  const h = setup(['Alice', 'Bob']);
  h.endPhase();
  run(h, 3.5);
  const G = g(h);
  G.formIdx = 1; G.boss.key = G.forms[1];
  for (const hero of G.heroes) { hero.hp = 0; hero.ko = true; }
  run(h, 4);
  assert.strictEqual(h.room.phase.kind, 'bossOver');
  boss.hostAction(h.room, 'continue', h.api);
  assert.strictEqual(h.room.phase.kind, 'boss');
  assert.strictEqual(g(h).formIdx, 1);
  assert.ok(g(h).heroes.every(x => x.hp === MAX_HP && !x.ko));
  assert.strictEqual(g(h).continues, 1);
});

test('commandes invalides ignorées sans planter', () => {
  const h = setup(['Alice']);
  h.endPhase();
  for (const v of [null, 'x', 42, { dx: 'abc', dy: Infinity }, { dx: 5, dy: -9, atk: 1, sp: 'oops' }]) boss.input(h.room, 'p0', v);
  boss.input(h.room, 'inconnu', { dx: 1 });
  const hero = g(h).heroes[0];
  assert.ok(Math.abs(hero.input.dx) <= 1 && Math.abs(hero.input.dy) <= 1);
  run(h, 1);
});
