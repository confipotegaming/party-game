// Non-régression : chaque mini-jeu existant démarre et se déroule jusqu'au classement final sans erreur.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { makeRoom } = require('./harness');

const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const ids = [...src.match(/for \(const id of \[([\s\S]*?)\]\)/)[1].matchAll(/'([a-z]+)'/g)].map(m => m[1]);

test('liste des jeux chargée par le serveur', () => {
  assert.ok(ids.length >= 20);
  assert.ok(ids.includes('sondage'));
});

for (const id of ids) {
  test(`jeu « ${id} » : démarrage et enchaînement des phases`, () => {
    const game = require('../games/' + id);
    assert.strictEqual(game.id, id);
    const h = makeRoom(['Alice', 'Bob', 'Chloé']);
    h.start(game);
    if (h.room.phase.kind === 'surveySetup') game.hostAction(h.room, 'start:', h.api);
    for (let i = 0; i < 200 && h.room.phase.kind !== 'scores'; i++) {
      const kind = h.room.phase.kind;
      if (kind === 'brainResults') { h.api.finish(); break; }
      h.room.phase.done = false;
      h.endPhase();
    }
    assert.strictEqual(h.room.phase.kind, 'scores');
  });
}
