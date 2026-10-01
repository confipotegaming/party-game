const mk = require('./_choice');
const Q = (p, ...opts) => ({ p, options: opts.map(t => ({ t })) });
module.exports = mk({
  id: 'choixgroupe', name: 'Le choix du groupe', rounds: 5, points: 200, mode: 'majority', title: 'Votre choix',
  desc: 'Des options absurdes : gagnez des points en votant comme la majorité.',
  questions: [
    Q('Vous devez adopter un nouvel animal de compagnie :', 'Un pigeon qui juge tout le monde', 'Un hamster géant', 'Un perroquet qui répète vos secrets', 'Un escargot ultra rapide'),
    Q('Quel super-pouvoir inutile choisir ?', 'Parler aux fourmis', 'Savoir quand quelqu\'un va éternuer', 'Faire apparaître un cornichon', 'Toujours connaître l\'heure exacte'),
    Q('Le nouveau plat national obligatoire :', 'Pizza à l\'ananas', 'Soupe de chocolat', 'Spaghettis au ketchup', 'Fromage glacé'),
    Q('Un seul objet pour une île déserte :', 'Un trampoline', 'Un piano sans touches', 'Un parapluie géant', 'Un GPS qui marche à l\'envers'),
    Q('La pire chose à entendre au réveil :', '« On a rendez-vous avec ta belle-mère »', '« Il n\'y a plus de café »', '« Le chat a mangé tes clés »', '« Aujourd\'hui, c\'est encore lundi »'),
    Q('Un métier devient obligatoire un jour par an pour tout le monde :', 'Boulanger', 'Clown', 'Éboueur', 'Pilote d\'avion'),
  ],
});
