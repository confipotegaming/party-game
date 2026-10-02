// Dialogues d'humour noir affichés dans la scène du classement (accueil hôte, lobby joueur, scores).
// Jetons : {1} {2} {3} = joueurs à cette place, {last} = dernier du classement.
(function () {
  const LINES = [
    '{2} : « {1}, si tu gagnes encore, je dis à tout le monde où tu caches les corps. » — {1} : « Vas-y, il reste de la place. »',
    '{1} : « Je dédie cette victoire à mes ennemis. Surtout à {last}, qui n’existe déjà plus. »',
    '{last} : « Je suis pas dernier, je laisse une chance aux autres. » — {1} : « C’est ce que tes parents disent de toi aussi. »',
    '{2} : « {1}, je t’ai mis dans mon testament. » — {1} : « Trop mignon. » — {2} : « Dans la colonne “suspects”. »',
    '{1} : « La deuxième place, c’est juste le premier des perdants. Hein {2} ? »',
    '{3} : « Troisième, c’est la médaille de ceux qui ont essayé. » — {1} : « Comme ton dernier couple. »',
    '{last} : « Si je perds, je pars avec le wifi. » — {1} : « Et ta dignité ? » — {last} : « Déjà partie. »',
    '{2} : « Je vais te détrôner, {1}. » — {1} : « Avec ces mains ? Elles tremblent depuis la manche 1. »',
    '{1} : « Je joue pour le plaisir. » — {2} : « Le plaisir de voir les autres pleurer ? » — {1} : « Tu comprends vite. »',
    '{last} : « L’important, c’est de participer. » — {1} : « Dit celui qui va payer les pizzas. »',
    '{1} : « Mon psy m’a dit d’arrêter d’écraser les gens. Il a fini troisième aussi. »',
    '{2} : « Si {1} gagne encore, je simule une crise cardiaque. » — {3} : « Simule pas. Vas-y franchement. »',
    '{1} : « Personne ne se souvient du deuxième. » — {2} : « Moi je me souviendrai de ton adresse. »',
    '{last} : « J’ai une stratégie. » — {2} : « Perdre lentement pour qu’on s’ennuie avec toi ? »',
    '{1} : « Sur ma tombe, je veux : “Il a gagné, et {2} a pleuré.” »',
    '{3} : « {1} triche, j’en suis sûr. » — {1} : « Non, j’ai un cerveau. Ils en vendent d’occasion, renseigne-toi. »',
    '{2} : « Allez {last}, on croit en toi ! » — {last} : « Merci… » — {2} : « Je mentais, c’est la tradition. »',
    '{1} : « Je ne souhaite la mort de personne. Juste la défaite de {2}. C’est presque pareil. »',
    '{last} : « Je vais remonter ! » — {3} : « Comme un cadavre dans un lac : au bout de trois jours. »',
    '{1} : « Quand je gagne, un ange perd ses ailes. Et {last} perd ses amis. »',
    '{2} : « J’ai sacrifié mon sommeil, mon couple et mon chat pour ce jeu. » — {1} : « Et t’es toujours deuxième. RIP le chat. »',
    '{1} : « Je voudrais remercier ma famille… Non, en fait j’ai tout fait tout seul. »',
    '{last} : « Achevez-moi. » — {1} : « C’est ce que je fais depuis le début de la partie. »',
    '{3} : « Allions-nous contre {1}. » — {2} : « OK, et après je te poignarde. » — {3} : « Évidemment, c’est dans le contrat. »',
    '{1} : « C’est pas de l’arrogance, c’est des statistiques. Regarde {last} : c’est une statistique. »',
    '{2} : « {1}, j’ai envie de crever tes pneus. » — {1} : « Je suis venu à pied. » — {2} : « Alors tes genoux. »',
    '{last} : « Pourquoi je perds toujours ? » — {1} : « Le karma. Ou la génétique. Sûrement les deux. »',
    '{1} : « Mon seul regret dans la vie ? Ne pas pouvoir humilier {2} deux fois par manche. »',
    '{2} : « Je vais tout donner ! » — {1} : « Tu donnes déjà tout. C’est ça le plus triste. »',
    '{last} : « On peut recommencer ? » — Tout le monde : « Non. » — {1} : « Jamais. Reste là et souffre. »',
  ];

  // Nombre de joueurs distincts nécessaires pour qu'une réplique ait du sens.
  const need = t => {
    const nums = [...t.matchAll(/\{(\d)\}/g)].map(m => +m[1]);
    const top = Math.max(1, ...nums);
    return t.includes('{last}') ? Math.max(2, top + 1) : top;
  };

  // players : triés par score décroissant. seed : entier pour faire tourner les répliques.
  function pick(players, seed) {
    const n = players.length;
    if (!n) return '';
    const pool = LINES.filter(t => need(t) <= n);
    const t = pool[((seed % pool.length) + pool.length) % pool.length];
    return t.replace(/\{(\d|last)\}/g, (_, k) => players[k === 'last' ? n - 1 : +k - 1].name);
  }

  window.partyBanter = { LINES, pick };
})();
