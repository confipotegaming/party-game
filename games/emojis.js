const mk = require('./_textquiz');
const Q = (p, e, h, a, ...alias) => ({ p, clues: [e, h], a, alias });
module.exports = mk({
  id: 'emojis', category: 'Cinéma & séries', name: 'Devine en emojis', rounds: 5, clueSeconds: 20, categories: ['Cinéma & séries', 'Expressions', 'Personnages'],
  desc: 'Films, dessins animés et expressions racontés en emojis.',
  questions: [
    Q('Quel film ?', '🦁👑', 'Un dessin animé Disney de 1994', 'Le Roi Lion'),
    Q('Quel film ?', '🧊👸❄️', 'Une chanson qu\'on a tous entendue 1000 fois', 'La Reine des neiges'),
    Q('Quel film ?', '🚢🧊💔', 'Sorti en 1997', 'Titanic'),
    Q('Quel film ?', '🐠🔍', 'Un petit poisson-clown se perd', 'Le Monde de Nemo', 'Nemo', 'Finding Nemo'),
    Q('Quel film ?', '🦈🏖️', 'Un classique de 1975 qui fait peur de se baigner', 'Les Dents de la mer'),
    Q('Quel film ?', '🐀👨‍🍳', 'Ça se passe dans une cuisine à Paris', 'Ratatouille'),
    Q('Quel film ?', '🍫🏭🎫', 'Un ticket doré à gagner', 'Charlie et la chocolaterie', 'Charlie et la chocolaterie'),
    Q('Quel film ?', '🤖🌱❤️', 'Un petit robot nettoyeur', 'WALL-E', 'Wall E', 'Wally'),
    Q('Quel film ?', '🏴‍☠️🦜🌊', 'Johnny Depp en capitaine', 'Pirates des Caraïbes', 'Pirates des Caraibes'),
    Q('Quel super-héros ?', '🕷️🕸️🏙️', 'Il balance des toiles', 'Spider-Man', 'Spiderman', 'L\'homme araignée'),
    Q('Quelle expression ?', '🐰📍⏰', 'Quand on ne vient pas à un rendez-vous', 'Poser un lapin'),
    Q('Quel duo ?', '🐱🐭💥', 'Un dessin animé de poursuite sans fin', 'Tom et Jerry'),
  ],
});
