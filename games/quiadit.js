// Qui a dit ça ? Chacun répond à une question perso ; on lit les réponses une par une
// et les autres devinent l'auteur. +300 si vous devinez, +100 par joueur que vous piégez.
const ROUNDS = 2;
const QUESTIONS = [
  'Ma pire habitude du quotidien :',
  'Le talent inutile dont je suis le plus fier :',
  'La chose la plus bizarre que j\'aie jamais mangée :',
  'Mon rêve secret :',
  'Une phrase que je dis beaucoup trop souvent :',
  'Le film que je regarde en cachette :',
  'Mon pire souvenir de vacances :',
  'Ma plus grosse honte au collège :',
  'Le métier dont je rêvais enfant :',
  'Ce que je commanderais pour mon dernier repas :',
  'La chanson que je chante (faux) sous la douche :',
  'Ma phobie la plus ridicule :',
  'Le pire cadeau que j\'aie reçu :',
  'Ce que je ferais si j\'étais invisible pendant une journée :',
  'Mon plat signature en cuisine :',
  'La célébrité avec qui j\'aimerais dîner :',
  'Le dernier truc inutile que j\'ai acheté :',
  'Ma plus grande fierté (même minuscule) :',
  'Le surnom qu\'on me donnait enfant :',
  'L\'objet dont je ne pourrais pas me séparer :',
  'Le mensonge que je raconte le plus souvent :',
  'La pire coupe de cheveux que j\'aie eue :',
  'Mon super-pouvoir rêvé :',
  'Le pays où je partirais demain si je pouvais :',
  'La série que j\'ai regardée en entier en un week-end :',
  'Ce qui me met de mauvaise humeur à coup sûr :',
  'Mon guilty pleasure musical :',
  'La plus grosse bêtise que j\'aie faite enfant :',
  'Ce que je fais quand personne ne me regarde :',
  'Le conseil que je donnerais à moi-même il y a dix ans :',
];
const shuffle = (a) => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

function write(room, api) {
  const g = room.g;
  api.setPhase({
    kind: 'text', step: 'write', title: 'Répondez honnêtement', prompt: g.qs[g.i],
    round: g.i + 1, rounds: ROUNDS, duration: 60, expected: api.ids(),
  });
}
function guess(room, api) {
  const g = room.g, [author, text] = g.queue[g.k], ids = api.ids();
  api.setPhase({
    kind: 'vote', step: 'guess', title: 'Qui a écrit ça ?', prompt: `« ${text} »`, author, text,
    // by = soi-même : chacun ne voit pas sa propre case. L'auteur ne vote pas.
    options: shuffle(ids.map(id => ({ id, text: api.name(id), by: id }))),
    round: g.i + 1, rounds: ROUNDS, duration: 20, expected: ids.filter(id => id !== author),
  });
}

module.exports = {
  id: 'quiadit', category: 'Vie quotidienne', name: 'Qui a dit ça ?', categories: ['Vie quotidienne', 'Humour', 'Famille'],
  desc: 'Des réponses anonymes s\'affichent : devinez qui les a écrites.',

  start(room, api) { room.g = { qs: shuffle(QUESTIONS).slice(0, ROUNDS), i: 0, queue: [], k: 0 }; write(room, api); },

  validate(ph, pid, v) {
    if (ph.step === 'write') return String(v || '').trim().slice(0, 120) || undefined;
    const o = ph.options.find(o => o.id === v);
    return o && o.by !== pid ? v : undefined;
  },

  onEnd(room, ph, api) {
    const g = room.g;
    const nextQuestion = () => { g.i++; g.i >= ROUNDS ? api.finish() : write(room, api); };

    if (ph.step === 'write') {
      g.queue = shuffle(Object.entries(ph.answers)); g.k = 0;
      return g.queue.length < 2 ? nextQuestion() : guess(room, api);
    }
    if (ph.step === 'guess') {
      const voters = Object.entries(ph.answers);
      const lines = voters.map(([pid, v]) => {
        const right = v === ph.author;
        if (right) api.addScore(pid, 300);
        return { main: api.name(pid), sub: right ? 'a deviné !' : `a voté ${api.name(v)}`, pts: right ? 300 : 0 };
      });
      const fooled = voters.filter(([, v]) => v !== ph.author).length;
      api.addScore(ph.author, fooled * 100);
      lines.push({ main: api.name(ph.author), sub: `a piégé ${fooled} joueur${fooled > 1 ? 's' : ''}`, pts: fooled * 100 });
      return api.setPhase({
        kind: 'reveal', step: 'reveal', title: `C'était ${api.name(ph.author)} !`, prompt: ph.prompt,
        lines, round: ph.round, rounds: ROUNDS, duration: 7,
      });
    }
    g.k++;
    g.k < g.queue.length ? guess(room, api) : nextQuestion();
  },
};
