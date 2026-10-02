// Pixel Flou : sprites valides, banque de personnages, points selon la netteté, personnage + jeu.
const test = require('node:test');
const assert = require('node:assert');
const game = require('../games/pixelflou');
const { SPRITES, resolve } = require('../games/pixelflou/sprites');
const { makeRoom } = require('./harness');

test('sprites : grilles rectangulaires et couleurs définies', () => {
  for (const id of Object.keys(SPRITES)) {
    const s = resolve(id);
    assert.ok(s.px.every(r => r.length === s.w), `${id} : lignes de même largeur`);
    assert.ok(s.w <= 32 && s.h <= 32, `${id} : taille raisonnable`);
    for (const row of s.px) for (const ch of row) if (ch !== '.') assert.match(s.pal[ch] || '', /^#[0-9a-f]{6}$/i, `${id} : couleur « ${ch} »`);
  }
});

test('banque : au moins 50 personnages, tous les niveaux, noms uniques', () => {
  const qs = game.questions;
  assert.ok(qs.length >= 50, `${qs.length} personnages`);
  for (const lv of [1, 2, 3]) assert.ok(qs.filter(q => q.d === lv).length >= 15, `niveau ${lv}`);
  assert.strictEqual(new Set(qs.map(q => q.s)).size, qs.length);
  for (const q of qs) assert.ok(q.acceptChar.length && q.acceptGame.length, q.a);
});

function startOn(id, players = ['Alice', 'Bob']) {
  const h = makeRoom(players);
  h.start(game);
  h.room.g.qs[0] = game.questions.find(q => q.s === id);
  h.room.phase.data.startAt = Date.now();
  return h;
}

test('personnage puis jeu : points, doublons refusés, fautes de frappe tolérées', () => {
  const h = startOn('link');
  const r1 = game.playerAction(h.room, 'p0', { guess: 'Lnk' }, h.api);
  assert.strictEqual(r1.status, 'miss');
  h.room.g.lastGuess = {};
  const r2 = game.playerAction(h.room, 'p0', { guess: 'link' }, h.api);
  assert.deepStrictEqual([r2.status, r2.got, r2.pts], ['found', ['char'], 1000]);
  h.room.g.lastGuess = {};
  assert.strictEqual(game.playerAction(h.room, 'p0', { guess: 'Link' }, h.api).status, 'already');
  h.room.g.lastGuess = {};
  const r3 = game.playerAction(h.room, 'p0', { guess: 'The Legend of Zleda' }, h.api);
  assert.deepStrictEqual([r3.got, r3.pts, r3.done], [['game'], 400, true]);
  assert.strictEqual(h.room.players.p0.score, 1400);
  assert.strictEqual(h.room.phase.kind, 'pixel', 'Bob cherche encore');
});

test('répondre plus tard rapporte moins, et la difficulté donne un bonus', () => {
  assert.ok(game.pointsFor(1000, 0, 1) > game.pointsFor(1000, 3, 1));
  assert.ok(game.pointsFor(1000, 3, 1) > game.pointsFor(1000, 7, 1));
  assert.strictEqual(game.pointsFor(1000, 0, 3), 1500);
  const h = startOn('pikachu');
  h.room.phase.data.startAt = Date.now() - 3 * game.STEP_MS - 10;
  const r = game.playerAction(h.room, 'p1', { guess: 'pikachu' }, h.api);
  assert.strictEqual(r.pts, game.pointsFor(game.CHAR_PTS, 3, 1));
});

test('un nom qui est aussi celui du jeu donne les deux ; la manche finit quand tout le monde a tout trouvé', () => {
  const h = startOn('pacman');
  assert.deepStrictEqual(game.playerAction(h.room, 'p0', { guess: 'Pac-Man' }, h.api).got, ['char', 'game']);
  game.playerAction(h.room, 'p1', { guess: 'pacman' }, h.api);
  assert.strictEqual(h.room.phase.kind, 'reveal');
  assert.strictEqual(h.room.phase.data.pixel.name, 'Pac-Man');
  assert.strictEqual(h.room.phase.lines.length, 2);
});

test('le nom du personnage ne quitte pas le serveur pendant la manche', () => {
  const h = startOn('kirby');
  assert.ok(!JSON.stringify(h.room.phase.data).toLowerCase().includes('kirby'));
});
