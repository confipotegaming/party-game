const mk = require('./_textquiz');
// d : difficulté (1 facile, 2 moyen, 3 difficile). Les indices vont du plus dur au plus facile.
const P = (d, a, alias, clues) => ({ d, a, alias, clues });
module.exports = mk({
  id: 'quisuisje', category: 'Personnalités', name: 'Qui suis-je ?', rounds: 4, clueSeconds: 15, prompt: 'Qui suis-je ?', categories: ['Personnalités', 'Histoire', 'Sciences', 'Sport', 'Arts'],
  desc: 'Un personnage célèbre, quatre indices de plus en plus faciles.',
  questions: [
    // ★ Facile
    P(1, 'Napoléon Bonaparte', ['Napoléon', 'Napoléon 1er', 'Napoléon Ier'], [
      'Je suis né en Corse.', 'J\'ai été empereur des Français.',
      'J\'ai perdu une grande bataille en Belgique en 1815.', 'On me représente souvent la main dans le gilet.']),
    P(1, 'Zinédine Zidane', ['Zidane', 'Zizou'], [
      'Je suis né à Marseille.', 'J\'ai gagné la Coupe du monde en 1998.',
      'J\'ai marqué deux buts de la tête en finale.', 'J\'ai entraîné le Real Madrid.']),
    P(1, 'Albert Einstein', ['Einstein'], [
      'Je suis né en Allemagne.', 'J\'ai reçu le prix Nobel de physique.',
      'J\'ai imaginé la théorie de la relativité.', 'Ma formule la plus célèbre est E = mc².']),
    P(1, 'Jeanne d\'Arc', ['Jeanne d Arc', 'La Pucelle d\'Orléans'], [
      'Je suis née à Domrémy, en Lorraine.', 'J\'entendais des voix.',
      'J\'ai aidé à libérer Orléans.', 'J\'ai été brûlée à Rouen en 1431.']),
    P(1, 'Louis XIV', ['Louis 14', 'Le Roi-Soleil', 'Roi Soleil'], [
      'Je suis né à Saint-Germain-en-Laye en 1638.', 'J\'ai régné 72 ans, un record en Europe.',
      'J\'ai fait du château de Versailles ma résidence.', 'On m\'appelait le Roi-Soleil.']),
    P(1, 'Kylian Mbappé', ['Mbappé', 'Mbappe', 'Kylian Mbappe'], [
      'Je suis né à Paris en 1998.', 'J\'ai grandi et appris le football à Bondy.',
      'J\'ai été champion du monde à 19 ans.', 'J\'ai quitté le PSG pour le Real Madrid en 2024.']),
    P(1, 'Wolfgang Amadeus Mozart', ['Mozart', 'Amadeus Mozart'], [
      'Je suis né à Salzbourg.', 'Enfant prodige, je jouais devant les cours d\'Europe.',
      'J\'ai composé La Flûte enchantée.', 'Mes prénoms sont Wolfgang Amadeus.']),
    P(1, 'Charles de Gaulle', ['De Gaulle', 'Général de Gaulle'], [
      'Je suis né à Lille en 1890.', 'J\'ai lancé un appel depuis Londres le 18 juin 1940.',
      'J\'ai fondé la Ve République.', 'Le plus grand aéroport de Paris porte mon nom.']),
    P(1, 'Michael Jackson', ['Jackson', 'MJ'], [
      'Je suis né dans l\'Indiana en 1958.', 'J\'ai débuté enfant dans un groupe avec mes frères.',
      'Mon album Thriller est le plus vendu de l\'histoire.', 'On m\'appelle le roi de la pop et j\'ai popularisé le moonwalk.']),
    // ★★ Moyen
    P(2, 'Marie Curie', ['Curie', 'Marie Sklodowska Curie'], [
      'Je suis née à Varsovie.', 'J\'ai reçu deux prix Nobel.',
      'J\'ai découvert le polonium et le radium.', 'Mon nom de famille est aussi une unité de radioactivité.']),
    P(2, 'Léonard de Vinci', ['Leonardo da Vinci', 'De Vinci', 'Da Vinci', 'Vinci'], [
      'Je suis né en Toscane.', 'Je suis peintre, inventeur et ingénieur.',
      'J\'ai peint une femme au sourire énigmatique.', 'Je suis mort en France, à Amboise.']),
    P(2, 'Victor Hugo', ['Hugo'], [
      'Je suis né à Besançon.', 'J\'ai passé près de vingt ans en exil à Jersey puis Guernesey.',
      'J\'ai écrit un roman sur la cathédrale Notre-Dame.', 'Je suis l\'auteur des Misérables.']),
    P(2, 'Pablo Picasso', ['Picasso'], [
      'Je suis né à Malaga en 1881.', 'J\'ai passé l\'essentiel de ma vie d\'artiste en France.',
      'J\'ai cofondé le cubisme.', 'J\'ai peint Guernica.']),
    P(2, 'Molière', ['Moliere', 'Jean-Baptiste Poquelin', 'Poquelin'], [
      'Je suis né à Paris en 1622.', 'Je dirigeais une troupe et je jouais dans mes propres pièces.',
      'J\'ai écrit Le Bourgeois gentilhomme et Le Tartuffe.', 'On surnomme le français « la langue de M… ». C\'est moi !']),
    P(2, 'Coco Chanel', ['Chanel', 'Gabrielle Chanel'], [
      'Je suis née à Saumur en 1883.', 'J\'ai commencé comme modiste, en créant des chapeaux.',
      'J\'ai popularisé la petite robe noire.', 'Mon parfum N°5 est mondialement célèbre.']),
    P(2, 'Louis Pasteur', ['Pasteur'], [
      'Je suis né à Dole, dans le Jura, en 1822.', 'Je suis chimiste et biologiste.',
      'J\'ai mis au point le vaccin contre la rage.', 'Mon nom désigne un procédé pour conserver le lait.']),
    P(2, 'Cléopâtre', ['Cleopatre', 'Cléopâtre VII'], [
      'Je suis née à Alexandrie.', 'J\'ai été la dernière reine de la dynastie des Ptolémées.',
      'J\'ai été la compagne de Jules César, puis de Marc Antoine.', 'Reine d\'Égypte, on dit que je suis morte mordue par un serpent.']),
    P(2, 'Jules César', ['César', 'Cesar', 'Jules Cesar'], [
      'Je suis né à Rome vers l\'an 100 avant J.-C.', 'J\'ai écrit La Guerre des Gaules.',
      'J\'ai vaincu Vercingétorix à Alésia.', 'J\'ai été assassiné aux ides de mars.']),
    P(2, 'Gustave Eiffel', ['Eiffel'], [
      'Je suis né à Dijon en 1832.', 'Je suis ingénieur, spécialiste des structures métalliques.',
      'J\'ai conçu l\'ossature intérieure de la statue de la Liberté.', 'Ma tour de fer domine Paris.']),
    P(2, 'Usain Bolt', ['Bolt'], [
      'Je suis né en Jamaïque en 1986.', 'J\'ai remporté huit médailles d\'or olympiques.',
      'J\'ai couru le 100 mètres en 9,58 secondes.', 'Ma pose de l\'éclair est célèbre dans le monde entier.']),
    P(2, 'Freddie Mercury', ['Mercury'], [
      'Je suis né à Zanzibar en 1946.', 'Mon vrai nom est Farrokh Bulsara.',
      'J\'ai écrit Bohemian Rhapsody.', 'J\'étais le chanteur du groupe Queen.']),
    P(2, 'Neil Armstrong', ['Armstrong'], [
      'Je suis né dans l\'Ohio en 1930.', 'J\'ai été pilote d\'essai avant de devenir astronaute.',
      'J\'ai commandé la mission Apollo 11.', 'J\'ai été le premier homme à marcher sur la Lune.']),
    P(2, 'Édith Piaf', ['Piaf', 'Edith Piaf'], [
      'Je suis née à Paris en 1915.', 'On m\'appelait « la Môme ».',
      'J\'ai chanté L\'Hymne à l\'amour.', 'Je ne regrette rien et je vois la vie en rose.']),
    P(2, 'Charlie Chaplin', ['Chaplin', 'Charlot'], [
      'Je suis né à Londres en 1889.', 'J\'ai fait carrière à Hollywood au temps du cinéma muet.',
      'J\'ai réalisé Le Dictateur et Les Temps modernes.', 'Mon personnage, Charlot, a un chapeau melon et une canne.']),
    // ★★★ Difficile
    P(3, 'Simone Veil', ['Veil'], [
      'Je suis née à Nice en 1927.', 'J\'ai survécu à la déportation à Auschwitz.',
      'J\'ai été la première présidente du Parlement européen élu au suffrage universel.', 'La loi de 1975 sur l\'IVG porte mon nom.']),
    P(3, 'Isaac Newton', ['Newton'], [
      'Je suis né en Angleterre au XVIIe siècle.', 'J\'ai étudié puis enseigné à Cambridge.',
      'J\'ai décomposé la lumière blanche avec un prisme.', 'Une pomme m\'aurait inspiré la loi de la gravitation.']),
    P(3, 'Alexandre Dumas', ['Dumas'], [
      'Je suis né à Villers-Cotterêts en 1802.', 'Mon fils, qui porte le même nom, a écrit La Dame aux camélias.',
      'J\'ai écrit Le Comte de Monte-Cristo.', 'Je suis l\'auteur des Trois Mousquetaires.']),
    P(3, 'Galilée', ['Galilee', 'Galileo', 'Galileo Galilei'], [
      'Je suis né à Pise en 1564.', 'J\'ai perfectionné la lunette astronomique.',
      'J\'ai découvert quatre lunes de Jupiter.', 'Après mon procès, j\'aurais murmuré « Et pourtant elle tourne ! »']),
    P(3, 'Vercingétorix', ['Vercingetorix'], [
      'Je suis né chez les Arvernes, en Auvergne.', 'J\'ai uni de nombreux peuples gaulois contre Rome.',
      'J\'ai remporté la bataille de Gergovie.', 'Je me suis rendu à Jules César après le siège d\'Alésia.']),
    P(3, 'Claude Monet', ['Monet'], [
      'Je suis né à Paris en 1840.', 'J\'ai vécu à Giverny, où j\'ai créé un célèbre jardin.',
      'J\'ai peint toute une série de Nymphéas.', 'Mon tableau Impression, soleil levant a donné son nom à un mouvement.']),
    P(3, 'Frida Kahlo', ['Kahlo', 'Frida'], [
      'Je suis née à Coyoacán, au Mexique.', 'Un grave accident de bus m\'a clouée au lit pendant des mois.',
      'J\'ai été mariée au peintre Diego Rivera.', 'Je suis célèbre pour mes autoportraits et mes sourcils.']),
    P(3, 'Nikola Tesla', ['Tesla'], [
      'Je suis né en 1856 dans l\'actuelle Croatie.', 'J\'ai travaillé un temps pour Thomas Edison.',
      'J\'ai développé les systèmes à courant alternatif.', 'Une marque de voitures électriques porte mon nom.']),
    P(3, 'Marie-Antoinette', ['Marie Antoinette'], [
      'Je suis née à Vienne en 1755.', 'J\'étais archiduchesse d\'Autriche.',
      'Je me suis fait construire un hameau à Versailles.', 'Épouse de Louis XVI, j\'ai été guillotinée en 1793.']),
    P(3, 'Jules Verne', ['Verne'], [
      'Je suis né à Nantes en 1828.', 'J\'ai passé une grande partie de ma vie à Amiens.',
      'J\'ai imaginé le Nautilus et le capitaine Nemo.', 'J\'ai écrit Le Tour du monde en quatre-vingts jours.']),
    P(3, 'Charles Darwin', ['Darwin'], [
      'Je suis né en Angleterre en 1809.', 'J\'ai fait le tour du monde à bord du Beagle.',
      'J\'ai étudié les pinsons des îles Galápagos.', 'J\'ai écrit L\'Origine des espèces.']),
    P(3, 'Gandhi', ['Mahatma Gandhi', 'Mohandas Gandhi'], [
      'Je suis né à Porbandar, en Inde, en 1869.', 'J\'ai été avocat en Afrique du Sud.',
      'J\'ai mené la marche du sel en 1930.', 'Figure de la non-violence, on m\'appelait « Mahatma ».']),
  ],
});
