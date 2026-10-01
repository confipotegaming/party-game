const mk = require('./_textquiz');
module.exports = mk({
  id: 'quisuisje', name: 'Qui suis-je ?', rounds: 4, clueSeconds: 15, prompt: 'Qui suis-je ?',
  desc: 'Un personnage célèbre, quatre indices de plus en plus faciles.',
  questions: [
    { a: 'Napoléon Bonaparte', alias: ['Napoléon', 'Napoléon 1er', 'Napoléon Ier'], clues: [
      'Je suis né en Corse.', 'J\'ai été empereur des Français.',
      'J\'ai perdu une grande bataille en Belgique en 1815.', 'On me représente souvent la main dans le gilet.'] },
    { a: 'Marie Curie', alias: ['Curie', 'Marie Sklodowska Curie'], clues: [
      'Je suis née à Varsovie.', 'J\'ai reçu deux prix Nobel.',
      'J\'ai découvert le polonium et le radium.', 'Mon nom de famille est aussi une unité de radioactivité.'] },
    { a: 'Zinédine Zidane', alias: ['Zidane', 'Zizou'], clues: [
      'Je suis né à Marseille.', 'J\'ai gagné la Coupe du monde en 1998.',
      'J\'ai marqué deux buts de la tête en finale.', 'J\'ai entraîné le Real Madrid.'] },
    { a: 'Léonard de Vinci', alias: ['Leonardo da Vinci', 'De Vinci', 'Da Vinci', 'Vinci'], clues: [
      'Je suis né en Toscane.', 'Je suis peintre, inventeur et ingénieur.',
      'J\'ai peint une femme au sourire énigmatique.', 'Je suis mort en France, à Amboise.'] },
    { a: 'Albert Einstein', alias: ['Einstein'], clues: [
      'Je suis né en Allemagne.', 'J\'ai reçu le prix Nobel de physique.',
      'J\'ai imaginé la théorie de la relativité.', 'Ma formule la plus célèbre est E = mc².'] },
    { a: 'Victor Hugo', alias: ['Hugo'], clues: [
      'Je suis né à Besançon.', 'J\'ai passé près de vingt ans en exil à Jersey puis Guernesey.',
      'J\'ai écrit un roman sur la cathédrale Notre-Dame.', 'Je suis l\'auteur des Misérables.'] },
    { a: 'Jeanne d\'Arc', alias: ['Jeanne d Arc', 'La Pucelle d\'Orléans'], clues: [
      'Je suis née à Domrémy, en Lorraine.', 'J\'entendais des voix.',
      'J\'ai aidé à libérer Orléans.', 'J\'ai été brûlée à Rouen en 1431.'] },
  ],
});
