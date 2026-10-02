const O = (text, note, ok) => ({ text, note, ok: !!ok });
module.exports = require('./_choicequiz')({
  id: 'survive', category: 'Survie & aventure', name: 'Survivrais-tu ?', mode: 'survive', pts: 300, rounds: 5, duration: 25, shuffle: false, categories: ['Survie & aventure', 'Nature', 'Humour'],
  desc: 'Une situation absurde, plusieurs décisions : à vous de trouver celle qui vous sauve.',
  questions: [
    { p: 'Un ours entre dans votre tente en pleine nuit. Que faites-vous ?', opts: [
      O('Lui offrir votre sandwich', 'Il adore. Il mange tout et repart ravi.', true),
      O('Lui faire un câlin', 'Il n\'était pas d\'humeur.'),
      O('Vous cacher dans le sac de couchage', 'Il vous prend pour un burrito.'),
      O('Chanter à pleine voix', 'Il a appelé ses amis pour le concert.')] },
    { p: 'Les zombies envahissent le supermarché. Votre plan ?', opts: [
      O('Courir en criant', 'Ils adorent le bruit.'),
      O('Négocier calmement', 'Ils ne parlent pas français.'),
      O('Vous déguiser en zombie et marcher lentement', 'Personne n\'a rien remarqué. Génie.', true),
      O('Vous cacher dans le rayon surgelés', 'Vous êtes devenu un surgelé.')] },
    { p: 'Naufragé sur une île déserte, vous ne gardez qu\'un objet :', opts: [
      O('Un fer à repasser', 'Aucune prise à l\'horizon.'),
      O('Un parapluie', 'Abri, radeau et ombre : le MacGyver du dimanche.', true),
      O('Un canard en plastique', 'Moral excellent, survie nulle.'),
      O('Une baguette', 'Mangée en deux jours.')] },
    { p: 'Un requin tourne autour de votre bateau.', opts: [
      O('Lui faire un check', 'Vous n\'avez plus de bras.'),
      O('Lui lire un poème', 'Critique sévère, et dentée.'),
      O('Sauter pour l\'impressionner', 'Mauvaise idée.'),
      O('Lancer votre déjeuner le plus loin possible', 'Il court après. Vous ramez dans l\'autre sens.', true)] },
    { p: 'Votre belle-famille vous sert un plat mystère. Vous…', opts: [
      O('Mangez sans poser de question', 'C\'était une andouillette. Vous n\'êtes plus le même.'),
      O('Demandez la recette', 'Trois heures de récit. Vous avez fini par manger.'),
      O('Faites semblant de dormir', 'On vous a gardé votre part pour demain.'),
      O('Prétextez une urgence avec le chat', 'Sauvé… sauf que vous n\'avez pas de chat.', true)] },
    { p: 'Vous êtes coincé dans un ascenseur avec un clown qui ne parle pas. Vous…', opts: [
      O('Lui proposez un chamallow', 'Il pleure de joie. Vous devenez meilleurs amis.', true),
      O('Faites semblant de dormir', 'Il fait des ballons en forme de chien jusqu\'à votre réveil. Vous ne dormirez plus jamais.'),
      O('Appuyez sur tous les boutons', 'L\'ascenseur monte au 53e étage, qui n\'existe pas.')] },
    { p: 'Une invasion de zombies commence pendant le repas de famille. Vous…', opts: [
      O('Allez leur dire bonjour', 'Ils sont très impolis. Ils ne répondent pas.'),
      O('Barricadez la porte avec le frigo', 'Le frigo tient. Mamie cuisine pour trois semaines.', true),
      O('Vous cachez sous la table', 'Cousin Gérard y était déjà. C\'est lui, le zombie.')] },
    { p: 'Vous perdez votre téléphone au milieu du désert. Vous…', opts: [
      O('Suivez un cactus qui vous fait signe', 'C\'était une insolation.'),
      O('Marchez vers l\'ombre du seul nuage', 'Le nuage vous suit. Vous êtes sauvé et très fier.', true),
      O('Attendez qu\'un chameau passe', 'Le chameau est en retard mais finit par vous prendre en stop.', true)] },
    { p: 'Un dragon vous propose un trésor ou un conseil. Vous…', opts: [
      O('Prenez le trésor', 'Il est maudit : vous ne parlez plus qu\'en rimes.'),
      O('Prenez le conseil', 'Le conseil : « Ne parle jamais aux dragons. » Vous obéissez immédiatement.', true),
      O('Demandez un selfie', 'Photo parfaite, 10 000 likes. Le dragon devient votre manager.', true)] },
    { p: 'Vous vous réveillez dans un escape game dont vous ignoriez tout. Vous…', opts: [
      O('Cherchez un code sous le tapis', 'Le code est 1234. Évidemment.', true),
      O('Criez « JE VEUX MA MAMAN »', 'Un employé vous demande de baisser d\'un ton, puis de payer.'),
      O('Mangez les indices', 'Vous ne gagnez aucun point, mais trois kilos.')] },
    { p: 'Le Wi-Fi tombe définitivement. Vous…', opts: [
      O('Découvrez la lecture', 'Vous lisez trois livres. Vous vous sentez supérieur sans comprendre pourquoi.', true),
      O('Allez parler à vos voisins', 'Leur perroquet insulte tout le monde. Vous ne reviendrez pas.'),
      O('Montez en haut d\'une colline pour trouver du réseau', 'Vous captez une barre. Ça valait tous les efforts.', true)] },
    { p: 'Une oie vous poursuit dans un parc. Vous…', opts: [
      O('Courez en zigzag', 'Elle connaît le zigzag. Elle a inventé le zigzag.'),
      O('Lui tenez tête en écartant les bras', 'Elle hésite, vous juge, puis repart. Respect mutuel.', true),
      O('Montez dans un arbre', 'Elle vous attend en bas. Depuis trois jours.'),
      O('Lui proposez un contrat', 'Elle a lu les petites lignes. Vous lui devez votre maison.')] },
    { p: 'Vous êtes perdu en forêt à la tombée de la nuit. Vous…', opts: [
      O('Suivez le ruisseau vers l\'aval', 'Il mène à un village… et à une crêperie ouverte.', true),
      O('Hurlez « Y A QUELQU\'UN ? »', 'Oui. Un sanglier. Il est vexé.'),
      O('Construisez une cabane avec vos chaussettes', 'Ingénieux, mais vous avez froid aux pieds.'),
      O('Demandez votre chemin à un hibou', 'Il ne répond que « hou ». Ce n\'est pas une direction.')] },
    { p: 'Vous êtes coincé dans un télésiège en panne au-dessus du vide. Vous…', opts: [
      O('Sautez dans la poudreuse', 'Elle était beaucoup moins poudreuse que prévu.'),
      O('Attendez calmement en chantant', 'Les secouristes arrivent et vous applaudissent.', true),
      O('Lancez vos skis pour appeler à l\'aide', 'Vous avez assommé le moniteur.'),
      O('Faites une sieste', 'Vous vous réveillez en juillet.')] },
    { p: 'Un essaim d\'abeilles fonce vers vous. Vous…', opts: [
      O('Sautez dans la piscine du voisin', 'Elles attendent au bord. Vous aussi. C\'est long.'),
      O('Battez des bras dans tous les sens', 'Elles prennent ça pour une invitation à danser.'),
      O('Vous éloignez calmement en vous couvrant le visage', 'Elles se désintéressent de vous. Bien joué.', true),
      O('Faites le mort', 'Elles sont très patientes.')] },
    { p: 'Vous êtes dans une maison hantée et la porte claque. Vous…', opts: [
      O('Dites « Bonsoir, je viens pour l\'annonce de colocation »', 'Le fantôme est ravi : il cherchait quelqu\'un pour payer la moitié.', true),
      O('Courez vers le grenier', 'Erreur classique. C\'est toujours le grenier.'),
      O('Appelez « Ouhou ? »', 'Une voix répond « Ouhou ». Ce n\'était pas votre écho.'),
      O('Allumez une bougie', 'Le fantôme vous chante joyeux anniversaire. Ce n\'est pas votre anniversaire.')] },
    { p: 'Votre canoë se dirige droit vers une cascade. Vous…', opts: [
      O('Ramez plus vite pour sauter plus loin', 'Vous ne volez pas. Ce n\'est pas un dessin animé.'),
      O('Pagayez fort vers la rive', 'Vous accostez, trempé mais vivant.', true),
      O('Prenez un selfie', 'Superbe photo. Dernière photo.'),
      O('Demandez au canoë de freiner', 'Le canoë n\'a pas de freins. Ni d\'oreilles.')] },
    { p: 'Une méduse vous frôle à la plage. Vous…', opts: [
      O('Rincez à l\'eau de mer et retirez délicatement les filaments', 'Ça pique encore un peu, mais vous survivez avec dignité.', true),
      O('Rincez à l\'eau douce du robinet', 'Les cellules urticantes adorent. Ça repique de plus belle.'),
      O('Frottez avec du sable', 'Vous avez transformé une piqûre en gommage douloureux.'),
      O('Lui demandez des excuses', 'Elle n\'a pas de cerveau. Ni de remords.')] },
    { p: 'Vous êtes invité par erreur à un mariage d\'inconnus. Vous…', opts: [
      O('Partez discrètement', 'Trop tard, on vous a placé à la table d\'honneur.'),
      O('Faites un discours improvisé', 'Standing ovation. On vous invite au prochain baptême.', true),
      O('Dites que vous êtes le traiteur', 'On vous tend un tablier et 200 assiettes.'),
      O('Volez la pièce montée', 'Elle pèse 40 kilos. Vous êtes rattrapé au portail.')] },
    { p: 'Un orage éclate pendant votre randonnée en montagne. Vous…', opts: [
      O('Vous abritez sous le grand arbre isolé', 'Il attire la foudre. Lui aussi a passé une mauvaise journée.'),
      O('Montez au sommet pour voir le spectacle', 'Vous êtes le point le plus haut. La foudre vous a remarqué.'),
      O('Descendez et vous accroupissez loin des arbres isolés', 'Trempé, mais toujours entier. Le bon réflexe.', true),
      O('Brandissez votre bâton de marche', 'Vous êtes un paratonnerre très motivé.')] },
  ],
});
