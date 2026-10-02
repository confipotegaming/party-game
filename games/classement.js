// Tout le monde classe 5 éléments ; plus votre classement ressemble à celui du groupe, plus vous gagnez.
const { shuffle } = require('./_textquiz');
const ROUNDS = 4;
const Q = (p, ...items) => ({ p, items });
const QUESTIONS = [
  Q('Du plus utile au moins utile dans une soirée :', 'Une enceinte', 'Un tire-bouchon', 'Un chargeur', 'Un jeu de cartes', 'Un canapé'),
  Q('Du plus effrayant au moins effrayant :', 'Les araignées', 'Le noir', 'Parler en public', 'Les clowns', 'Le dentiste'),
  Q('Du meilleur au pire petit-déjeuner :', 'Croissant', 'Céréales', 'Tartines', 'Crêpes', 'Œufs au bacon'),
  Q('Du plus agréable au moins agréable :', 'Un dimanche pluvieux', 'Un lundi matin', 'Un vendredi soir', 'Un trajet en train', 'Une sieste'),
  Q('Du métier le plus cool au moins cool :', 'Astronaute', 'Pâtissier', 'Détective', 'Youtubeur', 'Pirate'),
  Q('Du meilleur au pire fromage :', 'Camembert', 'Comté', 'Roquefort', 'Chèvre', 'Raclette'),
  Q('Du super-pouvoir le plus utile au moins utile :', 'Voler', 'Être invisible', 'Lire dans les pensées', 'Se téléporter', 'Arrêter le temps'),
  Q('De la meilleure à la pire saison :', 'Printemps', 'Été', 'Automne', 'Hiver', 'Les soldes'),
  Q('Du plus au moins indispensable sur une île déserte :', 'Un couteau', 'Un briquet', 'Une bâche', 'Une casserole', 'Un livre'),
  Q('De la meilleure à la pire corvée :', 'La vaisselle', 'L\'aspirateur', 'Le repassage', 'Les courses', 'Sortir les poubelles'),
  Q('Du meilleur au pire animal de compagnie :', 'Chien', 'Chat', 'Poisson rouge', 'Lapin', 'Perroquet'),
  Q('Du meilleur au pire moyen de transport :', 'Train', 'Voiture', 'Vélo', 'Avion', 'Trottinette'),
  Q('Du plus au moins gênant :', 'Appeler sa prof « maman »', 'Trébucher dans la rue', 'Avoir de la salade entre les dents', 'Saluer quelqu\'un qui ne vous saluait pas', 'Rire tout seul dans le métro'),
  Q('Du meilleur au pire dessert :', 'Tiramisu', 'Crème brûlée', 'Tarte au citron', 'Mousse au chocolat', 'Île flottante'),
  Q('De la meilleure à la pire destination de vacances :', 'Plage', 'Montagne', 'Grande ville', 'Campagne', 'Croisière'),
  Q('Du plus au moins énervant :', 'Un moustique la nuit', 'Le Wi-Fi qui coupe', 'Les bouchons', 'Un réveil qui sonne', 'Les pubs avant une vidéo'),
  Q('Du meilleur au pire genre de film :', 'Comédie', 'Horreur', 'Science-fiction', 'Romance', 'Dessin animé'),
  Q('Du meilleur au pire plat à la cantine :', 'Frites', 'Hachis parmentier', 'Poisson pané', 'Lasagnes', 'Épinards'),
  Q('Du plus au moins impressionnant :', 'Sauter en parachute', 'Parler cinq langues', 'Courir un marathon', 'Faire un Rubik\'s Cube en une minute', 'Jongler avec cinq balles'),
  Q('De la meilleure à la pire boisson chaude :', 'Café', 'Thé', 'Chocolat chaud', 'Tisane', 'Vin chaud'),
  Q('Du plus au moins difficile à abandonner pendant un mois :', 'Le téléphone', 'Le sucre', 'Le café', 'Les séries', 'Le fromage'),
  Q('Du meilleur au pire jeu de société :', 'Monopoly', 'Uno', 'Scrabble', 'Cluedo', 'Puissance 4'),
  Q('Du plus au moins romantique :', 'Un pique-nique', 'Un dîner aux chandelles', 'Une balade au clair de lune', 'Une lettre manuscrite', 'Un week-end surprise'),
  Q('Du plus au moins stressant :', 'Un entretien d\'embauche', 'Un examen', 'Un premier rendez-vous', 'Un déménagement', 'Un repas de famille'),
  Q('Du meilleur au pire moment d\'une fête :', 'L\'arrivée', 'Le repas', 'La piste de danse', 'Le gâteau', 'Le rangement'),
];

function ask(room, api) {
  const g = room.g, q = g.qs[g.i];
  api.setPhase({
    kind: 'rank', step: 'rank', title: 'Classez !', prompt: q.p,
    data: { items: shuffle(q.items).map((text, i) => ({ id: 'i' + i, text })) },
    round: g.i + 1, rounds: ROUNDS, duration: 45, expected: api.ids(),
  });
}

module.exports = {
  id: 'classement', category: 'Vie quotidienne', name: 'Classement impossible', categories: ['Vie quotidienne', 'Humour', 'Loisirs'],
  desc: 'Classez 5 éléments : gagnez en pensant comme le reste du groupe.',
  start(room, api) { room.g = { qs: shuffle(QUESTIONS).slice(0, ROUNDS), i: 0 }; ask(room, api); },
  validate(ph, pid, v) {
    const ids = ph.data.items.map(x => x.id);
    return Array.isArray(v) && v.length === ids.length && ids.every(id => v.includes(id)) && new Set(v).size === ids.length ? v : undefined;
  },
  onEnd(room, ph, api) {
    const g = room.g;
    if (ph.step === 'rank') {
      const items = ph.data.items, n = items.length, entries = Object.entries(ph.answers);
      if (!entries.length) {
        return api.setPhase({ kind: 'reveal', step: 'reveal', title: 'Personne n\'a classé', prompt: ph.prompt, lines: [], round: ph.round, rounds: ROUNDS, duration: 5 });
      }
      const sum = Object.fromEntries(items.map(it => [it.id, 0]));
      entries.forEach(([, order]) => order.forEach((id, i) => (sum[id] += i)));
      const cons = [...items].sort((a, b) => sum[a.id] - sum[b.id]);
      const cpos = Object.fromEntries(cons.map((it, i) => [it.id, i]));
      const maxD = Math.floor(n * n / 2);
      const lines = entries.map(([pid, order]) => {
        const D = order.reduce((s, id, i) => s + Math.abs(i - cpos[id]), 0);
        const pts = Math.round(1000 * (1 - D / maxD) / 10) * 10;
        api.addScore(pid, pts);
        return { main: api.name(pid), sub: D === 0 ? 'Pile comme le groupe !' : `écart de ${D}`, pts };
      }).sort((a, b) => b.pts - a.pts);
      return api.setPhase({
        kind: 'reveal', step: 'reveal', title: 'Le groupe : ' + cons.map(c => c.text).join(' › '), prompt: ph.prompt,
        lines, round: ph.round, rounds: ROUNDS, duration: 12,
      });
    }
    g.i++;
    g.i >= ROUNDS ? api.finish() : ask(room, api);
  },
};
