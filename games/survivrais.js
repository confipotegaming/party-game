const mk = require('./_choice');
const O = (t, ok, r) => ({ t, ok, r });
module.exports = mk({
  id: 'survivrais', name: 'Survivrais-tu ?', rounds: 5, points: 500, mode: 'correct', title: 'Que faites-vous ?',
  desc: 'Une situation absurde, trois décisions. Les survivants marquent des points.',
  questions: [
    { p: 'Vous êtes coincé dans un ascenseur avec un clown qui ne parle pas. Vous…', options: [
      O('Lui proposez un chamallow', true, 'Il pleure de joie. Vous devenez meilleurs amis.'),
      O('Faites semblant de dormir', false, 'Il fait des ballons en forme de chien jusqu\'à votre réveil. Vous ne dormirez plus jamais.'),
      O('Appuyez sur tous les boutons', false, 'L\'ascenseur monte au 53e étage, qui n\'existe pas.')] },
    { p: 'Une invasion de zombies commence pendant le repas de famille. Vous…', options: [
      O('Barricadez la porte avec le frigo', true, 'Le frigo tient. Mamie cuisine pour trois semaines.'),
      O('Allez leur dire bonjour', false, 'Ils sont très impolis. Ils ne répondent pas.'),
      O('Vous cachez sous la table', false, 'Cousin Gérard y était déjà. C\'est lui, le zombie.')] },
    { p: 'Vous perdez votre téléphone au milieu du désert. Vous…', options: [
      O('Suivez un cactus qui vous fait signe', false, 'C\'était une insolation.'),
      O('Marchez vers l\'ombre du seul nuage', true, 'Le nuage vous suit. Vous êtes sauvé et très fier.'),
      O('Attendez qu\'un chameau passe', true, 'Le chameau est en retard mais finit par vous prendre en stop.')] },
    { p: 'Un dragon vous propose un trésor ou un conseil. Vous…', options: [
      O('Prenez le trésor', false, 'Il est maudit : vous ne parlez plus qu\'en rimes.'),
      O('Prenez le conseil', true, 'Le conseil : « Ne parle jamais aux dragons. » Vous obéissez immédiatement.'),
      O('Demandez un selfie', true, 'Photo parfaite, 10 000 likes. Le dragon devient votre manager.')] },
    { p: 'Vous vous réveillez dans un escape game dont vous ignoriez tout. Vous…', options: [
      O('Cherchez un code sous le tapis', true, 'Le code est 1234. Évidemment.'),
      O('Criez « JE VEUX MA MAMAN »', false, 'Un employé vous demande de baisser d\'un ton, puis de payer.'),
      O('Mangez les indices', false, 'Vous ne gagnez aucun point, mais trois kilos.')] },
    { p: 'Le Wi-Fi tombe définitivement. Vous…', options: [
      O('Découvrez la lecture', true, 'Vous lisez trois livres. Vous vous sentez supérieur sans comprendre pourquoi.'),
      O('Allez parler à vos voisins', false, 'Leur perroquet insulte tout le monde. Vous ne reviendrez pas.'),
      O('Montez en haut d\'une colline pour trouver du réseau', true, 'Vous captez une barre. Ça valait tous les efforts.')] },
  ],
});
