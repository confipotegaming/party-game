const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Base isolée : copie des questions de démonstration.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sondage-game-'));
process.env.SONDAGE_DB = path.join(dir, 'db.json');
fs.copyFileSync(path.join(__dirname, '..', 'data', 'sondage.json'), process.env.SONDAGE_DB);

const game = require('../games/sondage');
const cfg = require('../games/sondage/config');
const { store } = require('../games/sondage/store');
const { makeRoom } = require('./harness');

// Thème « Vacances » réduit à la question de référence (« … oublient souvent avant de partir en vacances »).
for (const q of store.list({ category: 'Vacances' })) if (!q.question.includes('oublient souvent')) store.setActive(q.id, false);

function startRound(category = 'Vacances') {
  const h = makeRoom();
  h.start(game);
  assert.strictEqual(h.room.phase.kind, 'surveySetup');
  game.hostAction(h.room, 'start:' + category, h.api);
  assert.strictEqual(h.room.phase.kind, 'survey');
  return h;
}
const guess = (h, pid, g) => { h.room.g.lastGuess[pid] = 0; return game.playerAction(h.room, pid, { guess: g }, h.api); };

test('la manche démarre avec le thème choisi et ne révèle aucune réponse', () => {
  const h = startRound('Vacances');
  const ph = h.room.phase;
  assert.strictEqual(ph.category, 'Vacances');
  assert.strictEqual(ph.rounds, 1, 'une seule question active dans ce thème → une seule manche');
  assert.ok(ph.data.slots.every(s => !s.answer && s.votes === null), 'réponses et points cachés');
  const json = JSON.stringify(ph);
  for (const a of h.room.g.q.answers) assert.ok(!json.includes(a.answer), `« ${a.answer} » ne doit pas fuiter`);
});

test('bonne réponse : révélée, points = votes × multiplicateur, score global mis à jour', () => {
  const h = startRound();
  const r = guess(h, 'p0', 'mon chargeur de portable');
  assert.strictEqual(r.status, 'found');
  assert.strictEqual(r.pts, 38 * h.room.g.mult);
  assert.strictEqual(h.room.players.p0.score, r.pts);
  const slot = h.room.phase.data.slots[0];
  assert.deepStrictEqual([slot.answer, slot.votes, slot.byName], ['Chargeur de téléphone', 38, 'Alice']);
  assert.strictEqual(h.room.phase.data.events.at(-1).type, 'found');
  assert.strictEqual(guess(h, 'p1', 'chargeur').status, 'already', 'déjà trouvée : ni points ni faute');
  assert.strictEqual(h.room.players.p1.score, 0);
  assert.strictEqual(h.room.phase.data.strikes.p1 || 0, 0);
});

test('mauvaise réponse : faute, 3 fautes = éliminé·e, tout le monde éliminé = fin de manche', () => {
  const h = startRound();
  for (let i = 1; i <= cfg.MAX_STRIKES; i++) assert.deepStrictEqual(guess(h, 'p0', 'girafe ' + i), { status: 'miss', strikes: i, max: cfg.MAX_STRIKES });
  assert.strictEqual(guess(h, 'p0', 'passeport').status, 'out', 'plus de proposition une fois éliminé·e');
  assert.strictEqual(h.room.phase.kind, 'survey');
  for (let i = 0; i < cfg.MAX_STRIKES; i++) guess(h, 'p1', 'zèbre ' + i);
  assert.strictEqual(h.room.phase.kind, 'reveal');
  assert.match(h.room.phase.title, /fautes/);
});

test('tableau complet = fin de manche, écran de révélation puis classement final', () => {
  const h = startRound();
  for (const g of ['chargeur', 'brosse à dents', 'passeport', 'lunettes de soleil']) assert.strictEqual(guess(h, 'p0', g).status, 'found');
  assert.strictEqual(guess(h, 'p1', 'médocs').status, 'found');
  const ph = h.room.phase;
  assert.strictEqual(ph.kind, 'reveal');
  assert.strictEqual(ph.data.survey.found, 5);
  assert.deepStrictEqual(ph.lines.map(l => l.main), ['Alice', 'Bob']);
  assert.strictEqual(h.room.players.p0.score, (38 + 24 + 18 + 12) * h.room.g.mult);
  h.endPhase();
  assert.strictEqual(h.room.phase.kind, 'scores', 'dernière manche → classement final existant');
});

test('temps écoulé : les réponses manquées sont dévoilées', () => {
  const h = startRound();
  guess(h, 'p0', 'passeport');
  h.endPhase();
  const s = h.room.phase.data.survey;
  assert.strictEqual(s.reason, 'time');
  assert.strictEqual(s.slots.filter(x => x.missed).length, 4);
  assert.ok(s.slots.every(x => x.answer));
});

test('partie complète « tous thèmes » : manches, difficultés et multiplicateurs du déroulé', () => {
  const h = makeRoom(['Alice']);
  h.start(game);
  game.hostAction(h.room, 'start:', h.api);
  const seen = [];
  for (let r = 1; r <= cfg.ROUNDS.length; r++) {
    const ph = h.room.phase;
    assert.strictEqual(ph.kind, 'survey');
    assert.strictEqual(ph.round, r);
    assert.strictEqual(ph.data.multiplier, cfg.ROUNDS[r - 1].multiplier);
    assert.strictEqual(h.room.g.q.difficulty, cfg.ROUNDS[r - 1].difficulty);
    assert.ok(ph.data.slots.length <= cfg.DIFFICULTIES[h.room.g.q.difficulty].maxAnswers);
    assert.strictEqual(ph.duration, cfg.DIFFICULTIES[h.room.g.q.difficulty].seconds);
    seen.push(h.room.g.q.id);
    h.endPhase(); h.endPhase();
  }
  assert.strictEqual(new Set(seen).size, seen.length, 'pas de question répétée');
  assert.strictEqual(h.room.phase.kind, 'scores');
});

test('anti-spam, propositions vides et hors manche refusées', () => {
  const h = startRound();
  assert.strictEqual(game.playerAction(h.room, 'p0', { guess: '   ' }, h.api).status, 'empty');
  assert.strictEqual(game.playerAction(h.room, 'p0', { guess: 'girafe' }, h.api).status, 'miss');
  assert.strictEqual(game.playerAction(h.room, 'p0', { guess: 'zèbre' }, h.api).status, 'slow');
  assert.strictEqual(game.playerAction(h.room, 'intrus', { guess: 'passeport' }, h.api).status, 'closed');
  h.endPhase();
  assert.strictEqual(game.playerAction(h.room, 'p0', { guess: 'passeport' }, h.api).status, 'closed');
  assert.strictEqual(game.validate(), undefined, 'le canal « answer » générique n’est pas utilisé');
});

test('sans question active : message d’erreur clair', () => {
  const active = store.list({ active: true });
  active.forEach(q => store.setActive(q.id, false));
  const h = makeRoom();
  h.start(game);
  assert.strictEqual(h.room.phase.kind, 'error');
  active.forEach(q => store.setActive(q.id, true));
});
