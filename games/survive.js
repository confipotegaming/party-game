const O = (text, note, ok) => ({ text, note, ok: !!ok });
module.exports = require('./_choicequiz')({
  id: 'survive', category: 'Survie & aventure', name: 'Survivrais-tu ?', mode: 'survive', pts: 300, rounds: 5, duration: 25, shuffle: false, categories: ['Survie & aventure', 'Nature', 'Humour'],
  desc: 'Une situation absurde, quatre décisions : une seule vous sauve.',
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
  ],
});
