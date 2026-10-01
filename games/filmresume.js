const mk = require('./_textquiz');
const Q = (r, y, a, ...alias) => ({ p: 'Quel film se cache derrière ce résumé ?', clues: [r, `Indice : sorti en ${y}`], a, alias });
module.exports = mk({
  id: 'filmresume', name: 'Film résumé très mal', rounds: 5, clueSeconds: 25,
  desc: 'Retrouvez le film à partir d\'un résumé volontairement catastrophique.',
  questions: [
    Q('Un homme dessine une femme puis un gros glaçon gagne contre un bateau.', 1997, 'Titanic'),
    Q('Un chaton refuse de rentrer chez lui, puis part en vacances avec un phacochère.', 1994, 'Le Roi Lion'),
    Q('Un petit homme marche très longtemps pour jeter une bague dans un volcan.', 2001, 'Le Seigneur des anneaux', 'Seigneur des anneaux', 'La communauté de l\'anneau'),
    Q('Un orphelin découvre qu\'il est sorcier et que son école a un énorme problème de sécurité.', 2001, 'Harry Potter', 'Harry Potter à l\'école des sorciers'),
    Q('Un maire refuse de fermer la plage malgré un gros poisson.', 1975, 'Les Dents de la mer'),
    Q('Deux hommes que tout oppose font des tours de voiture et mangent des pâtisseries.', 2011, 'Intouchables'),
    Q('Une serveuse montmartroise passe son temps à déplacer des nains de jardin.', 2001, 'Amélie Poulain', 'Amélie', 'Le Fabuleux Destin d\'Amélie Poulain'),
    Q('Un monstre vert part en voyage avec un âne qui parle beaucoup trop.', 2001, 'Shrek'),
    Q('Un informaticien apprend que sa vie est fausse et décide de porter un long manteau.', 1999, 'Matrix', 'The Matrix'),
    Q('Des jouets font une crise de jalousie à cause d\'un cow-boy et d\'un astronaute.', 1995, 'Toy Story'),
    Q('Des scientifiques ouvrent un parc d\'attractions sans penser à l\'assurance.', 1993, 'Jurassic Park'),
    Q('Un chevalier et son écuyer arrivent à notre époque et se plaignent de tout.', 1993, 'Les Visiteurs'),
    Q('Un chef de famille règle ses problèmes de voisinage de façon assez directe.', 1972, 'Le Parrain', 'The Godfather'),
    Q('Un homme court beaucoup puis raconte sa vie à des inconnus sur un banc.', 1994, 'Forrest Gump'),
  ],
});
