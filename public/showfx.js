// Le show : effets visuels (confettis, flashs, bandeaux, compteurs), catalogue des épreuves
// et « régie » qui fait réagir le présentateur à ce qui se passe dans la partie.
(function () {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#ffd60a', '#ff2fb3', '#21e6ff', '#8b5cff', '#ff7a1a', '#2f7bff', '#ffffff'];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fill = (t, v) => String(t).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- Catalogue des épreuves ----------
  const TAGLINES = {
    funny: 'Voyons qui est vraiment drôle… et qui le croit seulement.',
    finislaphrase: 'Une phrase. Votre plume. Le jugement impitoyable de vos amis.',
    estimation: 'Personne ne sait. Mais quelqu’un va se tromper plus fort que les autres.',
    leplusprobable: 'Le moment précis où l’amitié est mise à rude épreuve.',
    quiadit: 'L’anonymat ne vous protégera pas très longtemps.',
    deuxverites: 'Mentez-leur droit dans les yeux. En direct.',
    emojis: 'Un film, quelques emojis, zéro excuse.',
    filmresume: 'Le cinéma comme vous ne l’avez jamais massacré.',
    quisuisje: 'Quatre indices. Un seul génie. Peut-être.',
    motatrous: 'Les lettres tombent. Les masques aussi.',
    express: 'Huit secondes. Pas une de plus. Respirez.',
    quatreimages: 'Quatre images, un mot, un cerveau en surchauffe.',
    intrus: 'Il y a un imposteur. Et ce n’est peut-être pas une des réponses.',
    survive: 'Votre instinct de survie passe à l’antenne.',
    choixgroupe: 'Pensez comme la meute. Ou périssez seul.',
    classement: 'Classez l’impossible. Le groupe vous jugera.',
    motinterdit: 'Faites deviner sans le dire. Bon courage.',
    dessin: 'Picasso n’est pas invité. Ça va se voir.',
    cerveau: '60 secondes pour prouver que vous en avez un.',
    sondage: 'Nous avons interrogé 100 personnes. Vous allez les décevoir.',
    academie: 'L’examen d’entrée que personne n’a révisé.',
    wario: 'Quatre secondes par épreuve. Le chaos à l’état pur.',
    boss: 'Tous ensemble contre un monstre. Pour une fois.',
  };
  const INTENSITY = { funny: 1, finislaphrase: 1, leplusprobable: 1, choixgroupe: 1, express: 3, cerveau: 3, academie: 3, wario: 3, boss: 3 };
  const TONES = { 'Humour': 'magenta', 'Culture générale': 'blue', 'Réflexion': 'cyan', 'Réflexes': 'cyan', 'Action': 'orange', 'Vie quotidienne': 'violet', 'Cinéma & séries': 'yellow', 'Culture pop': 'yellow', 'Personnalités': 'violet', 'Survie & aventure': 'orange', 'Objets & quotidien': 'blue' };
  const pad2 = n => String(n).padStart(2, '0');
  const ICONS = { boss: '⚔️', sondage: '📊' };
  function episode(g, i) {
    return {
      ...g, icon: ICONS[g.id] || g.icon, num: pad2(i + 1), tagline: TAGLINES[g.id] || g.desc, intensity: INTENSITY[g.id] || 2,
      tone: TONES[g.category] || 'violet', solo: (g.minPlayers || 2) <= 1,
    };
  }
  const episodes = games => (games || []).map(episode);
  const episodeOf = (games, id) => { const i = (games || []).findIndex(g => g.id === id); return i < 0 ? null : episode(games[i], i); };
  const intensityBars = n => `<span class="tv-intensity" title="Intensité ${n}/3">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  const INTENSITY_LABEL = ['', 'Détente', 'Corsé', 'Brutal'];

  // ---------- Confettis ----------
  let cv, cx, parts = [], loop = 0;
  function canvas() {
    if (cv) return;
    cv = document.createElement('canvas'); cv.className = 'fx-canvas'; document.body.appendChild(cv);
    cx = cv.getContext('2d');
    const size = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; };
    size(); addEventListener('resize', size);
  }
  function confetti(n = 160, o = {}) {
    canvas();
    if (reduce) n = Math.min(n, 30);
    const W = cv.width, H = cv.height, dpr = devicePixelRatio;
    for (let i = 0; i < n; i++) {
      const fromSides = o.cannons !== false && i % 2 === 0;
      const left = i % 4 === 0;
      parts.push({
        x: fromSides ? (left ? 0 : W) : Math.random() * W,
        y: fromSides ? H * .85 : -20 * dpr - Math.random() * H * .3,
        vx: fromSides ? (left ? 1 : -1) * (6 + Math.random() * 12) * dpr : (Math.random() - .5) * 3 * dpr,
        vy: fromSides ? -(14 + Math.random() * 14) * dpr : (2 + Math.random() * 3) * dpr,
        w: (6 + Math.random() * 8) * dpr, h: (8 + Math.random() * 12) * dpr, r: Math.random() * 6, vr: (Math.random() - .5) * .3,
        c: (o.colors || COLORS)[i % (o.colors || COLORS).length], life: 0, max: 220 + Math.random() * 120, shape: Math.random() < .25 ? 'star' : 'rect',
      });
    }
    if (!loop) loop = requestAnimationFrame(tick);
  }
  function star(c, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, rr = i % 2 ? r * .45 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); }
  function tick() {
    cx.clearRect(0, 0, cv.width, cv.height);
    const g = .35 * devicePixelRatio;
    parts = parts.filter(p => p.life < p.max && p.y < cv.height + 40);
    for (const p of parts) {
      p.life++; p.vy += g; p.vx *= .985; p.vy = Math.min(p.vy, 7 * devicePixelRatio); p.x += p.vx + Math.sin(p.life / 9) * .8; p.y += p.vy; p.r += p.vr;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.globalAlpha = Math.min(1, (p.max - p.life) / 40);
      if (p.shape === 'star') star(cx, p.w * .8); else { cx.scale(1, Math.cos(p.life / 6)); cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      cx.restore();
    }
    loop = parts.length ? requestAnimationFrame(tick) : 0;
    if (!loop) cx.clearRect(0, 0, cv.width, cv.height);
  }

  // ---------- Flash, secousse, bandeau ----------
  function flash(color = '#fff') {
    if (reduce) return;
    const f = document.createElement('div'); f.className = 'fx-flash'; f.style.background = color; document.body.appendChild(f);
    setTimeout(() => f.remove(), 700);
  }
  function shake(el = document.body) { el.classList.remove('fx-shake'); void el.offsetWidth; el.classList.add('fx-shake'); setTimeout(() => el.classList.remove('fx-shake'), 650); }
  const queue = []; let showing = false;
  function banner(title, sub = '', tone = 'gold', ms = 1900) {
    queue.push({ title, sub, tone, ms });
    if (!showing) nextBanner();
  }
  function nextBanner() {
    const b = queue.shift(); if (!b) { showing = false; return; }
    showing = true;
    const el = document.createElement('div');
    el.className = 'fx-banner tone-' + b.tone;
    el.innerHTML = `<div class="fx-banner-strip"><div class="fx-banner-sub">${esc(b.sub)}</div><div class="fx-banner-title">${esc(b.title)}</div></div>`;
    document.body.appendChild(el);
    setTimeout(() => { el.classList.add('out'); }, b.ms);
    setTimeout(() => { el.remove(); nextBanner(); }, b.ms + 380);
  }
  function pop(text, x, y, tone = 'gold') {
    const el = document.createElement('div'); el.className = 'fx-pop tone-' + tone; el.textContent = text;
    el.style.left = (x ?? innerWidth / 2) + 'px'; el.style.top = (y ?? innerHeight / 2) + 'px';
    document.body.appendChild(el); setTimeout(() => el.remove(), 1500);
  }
  function countUp(el, from, to, ms = 900, fmt = n => n.toLocaleString('fr-FR')) {
    if (reduce || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function sparks(x, y) {
    if (reduce) return;
    for (let i = 0; i < 9; i++) {
      const s = document.createElement('i'); s.className = 'fx-spark';
      const a = Math.random() * Math.PI * 2, d = 26 + Math.random() * 34;
      s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.background = pick(COLORS);
      s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      document.body.appendChild(s); setTimeout(() => s.remove(), 520);
    }
  }
  // Retour visuel sur chaque bouton
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('button, .tv-btn'); if (!b || b.disabled) return;
    sparks(e.clientX, e.clientY);
  }, true);

  // Chiffres qui s'animent après chaque rendu
  const shown = {};
  function decorate(root = document) {
    root.querySelectorAll('[data-score-for]').forEach(el => {
      const id = el.dataset.scoreFor, to = +el.dataset.score || 0, from = shown[id] ?? to;
      shown[id] = to;
      if (from !== to) { countUp(el, from, to); el.classList.add('fx-bump'); const row = el.closest('.live-score-row, .tv-contestant'); if (row) row.classList.add('fx-row-hot'); }
      else el.textContent = to.toLocaleString('fr-FR');
    });
    root.querySelectorAll('[data-count]:not([data-counted])').forEach((el, i) => {
      el.dataset.counted = 1; const to = +el.dataset.count || 0, pre = el.dataset.prefix || '';
      setTimeout(() => countUp(el, 0, to, 800, n => pre + n.toLocaleString('fr-FR')), i * 140);
    });
  }
  // Chrono : les dernières secondes s'emballent
  setInterval(() => {
    document.querySelectorAll('#t, .host-timer, .timer').forEach(t => { const n = parseInt(t.textContent, 10); t.classList.toggle('is-low', n >= 0 && n <= 5 && t.textContent.trim() !== ''); });
  }, 250);

  // ---------- Répliques du présentateur ----------
  const LINES = {
    intro: ['Mesdames et messieurs… c’est l’heure de vérité !', 'Caméras prêtes ? Égos fragiles ? C’EST PARTI !', 'Nouvelle épreuve. Mêmes perdants ?', 'On applaudit très fort… ceux qui vont perdre !', 'Silence sur le plateau. On tourne !'],
    round: ['ROUND {r} ! Personne ne quitte le plateau.', 'Manche {r}. Je sens de la tension. Et un déodorant qui lâche.', 'Manche {r} ! Les masques vont tomber.', 'Manche {r}. La régie a misé contre vous.'],
    leader: ['{name} prend la tête ! Le public est en délire. Enfin, moi.', '{name} en tête ! Quelqu’un peut l’arrêter ? Non ? OK.', 'Nouveau leader : {name}. Les autres, on fait quoi là ?'],
    gain: ['+{pts} pour {name} ! Ça, c’est de la télé.', '{name} encaisse {pts} points sans trembler.', 'Joli coup, {name}. Je fais semblant d’être impressionné.'],
    crush: ['{name} ne joue plus, {name} humilie.', 'ÉCRASEMENT TOTAL ! Appelez une ambulance pour les autres.', 'C’est plus une victoire, c’est un fait divers.'],
    lose: ['Caméra 2, s’il vous plaît. {name} a besoin d’un moment.', 'Dernier. Mais dernier avec style, {name}.', '{name}, regarde la caméra et souris. Voilà. Courage.'],
    tie: ['ÉGALITÉ ?! Personne ne bouge, je préviens la régie.', 'Égalité parfaite. Je n’avais pas prévu ce scénario.', 'Égalité ! Le suspense me donne des parasites à l’écran.'],
    encourage: ['Allez {name}, statistiquement ça ne peut que s’améliorer.', '{name}, j’ai parié sur toi. Un tout petit peu.', 'Le comeback de l’année commence maintenant, {name}. Peut-être.', 'Respire, {name}. Le ridicule ne tue pas. Pas tout de suite.'],
    comeback: ['QUEL COME-BACK ! {name} revient d’entre les morts !', '{name} remonte comme une fusée ! Personne n’est en sécurité.', 'Retournement de situation ! {name}, tu m’as fait renverser mon café.'],
    record: ['NOUVEAU RECORD pour {name} ! On grave ça dans le marbre.', '{name} bat son record ! Le salon entre dans l’histoire.'],
    elim: ['Hors jeu ! On coupe au montage.', 'Game over. Une minute de silence. Bon, trente secondes.', 'Éliminés ! Le public est sous le choc. Moi aussi.'],
    finale: ['Mesdames et messieurs… votre CHAMPION : {name} !', '{name} remporte tout ! Je retiens mes larmes. Et mon salaire.'],
    join: ['Nouveau candidat : {name} ! Applaudissez… ou pas.', '{name} entre sur le plateau. Ça sent la défaite.', 'Bienvenue {name} ! Les caméras t’adorent déjà. Presque.', '{name} est là ! La soirée vient de baisser d’un cran. Ou de monter.'],
    idle: ['Je vous vois hésiter. C’est mignon.', 'Prenez votre temps. Le public, lui, vieillit.', 'Qui sera la honte de la soirée ? Suspense…', 'Pendant ce temps, en régie, on parie sur vous.', 'On est en direct, je vous rappelle. Souriez.'],
    sent: ['Réponse verrouillée ! Trop tard pour les regrets.', 'C’est envoyé. Plus moyen de reculer.', 'Audacieux. Très audacieux.'],
    meWin: ['{name}, tu gagnes ! Garde un peu d’humilité. Ou pas.', 'VICTOIRE ! {name}, le plateau est à toi.'],
  };
  const line = (k, v = {}) => fill(pick(LINES[k] || ['']), v);

  // ---------- Statistiques de la soirée (pour les trophées) ----------
  const stats = {};
  let lastRank = {};
  function track(players) {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    sorted.forEach((p, i) => {
      const s = stats[p.id] ||= { id: p.id, name: p.name, last: p.score, best: 0, worstRank: i, swaps: 0, zeros: 0, rounds: 0, firstRank: i };
      s.name = p.name;
      const gain = p.score - s.last;
      if (gain > s.best) s.best = gain;
      if (lastRank[p.id] !== undefined && lastRank[p.id] !== i) s.swaps++;
      if (i > s.worstRank) s.worstRank = i;
      s.last = p.score; s.rank = i;
    });
    lastRank = Object.fromEntries(sorted.map((p, i) => [p.id, i]));
  }
  function awards(players) {
    const list = Object.values(stats).filter(s => players.some(p => p.id === s.id));
    if (players.length < 2 || !list.length) return [];
    const out = [];
    const by = (f) => [...list].sort((a, b) => f(b) - f(a))[0];
    const mp = by(s => s.best); if (mp && mp.best > 0) out.push({ icon: '⚙️', title: 'Machine à points', name: mp.name, detail: `+${mp.best.toLocaleString('fr-FR')} en une seule manche` });
    const cb = by(s => s.worstRank - s.rank); if (cb && cb.worstRank - cb.rank > 0) out.push({ icon: '🚀', title: 'Meilleur come-back', name: cb.name, detail: `+${cb.worstRank - cb.rank} place${cb.worstRank - cb.rank > 1 ? 's' : ''} depuis le fond` });
    const ch = by(s => s.swaps); if (ch && ch.swaps > 1) out.push({ icon: '🌪️', title: 'Roi du chaos', name: ch.name, detail: `${ch.swaps} changements de place` });
    const last = [...players].sort((a, b) => a.score - b.score)[0];
    if (last) out.push({ icon: '💥', title: 'Catastrophe de la soirée', name: last.name, detail: `${last.score.toLocaleString('fr-FR')} pts. On t’aime quand même.` });
    return out;
  }
  // Records personnels gardés sur cet appareil (écran de l'hôte)
  function records(players) {
    let rec = {}; try { rec = JSON.parse(localStorage.getItem('pg-records') || '{}'); } catch {}
    const broken = [];
    players.forEach(p => {
      const k = p.name.toLowerCase(), before = rec[k];
      if (before !== undefined && p.score > before) broken.push({ name: p.name, score: p.score, before });
      if (before === undefined || p.score > before) rec[k] = p.score;
    });
    try { localStorage.setItem('pg-records', JSON.stringify(rec)); } catch {}
    return broken;
  }

  // ---------- Régie : réactions automatiques ----------
  const ACTION_KINDS = ['brain', 'wario', 'academy', 'boss', 'bossPick', 'bossOver', 'bossEnding', 'draw'];
  const BOSS_KINDS = ['boss', 'bossPick', 'bossOver', 'bossEnding'];
  let prev = null, role = 'host', meFn = () => null, idleT = 0, lastTalk = Date.now();
  const say = (mood, text, ms) => { lastTalk = Date.now(); window.Mascot && window.Mascot.react(mood, text, ms); };
  function watch(opts) {
    role = opts.role || 'host'; meFn = opts.me || meFn;
    if (window.Mascot) window.Mascot.dock({ compact: role === 'player' });
    clearInterval(idleT);
    idleT = setInterval(() => {
      if (!prev || Date.now() - lastTalk < 22000 || role !== 'host') return;
      const k = prev.phase && prev.phase.kind;
      if (!k || k === 'lobby' || k === 'text' || k === 'vote' || k === 'number' || k === 'rank') say('idle', line('idle'), 4200);
    }, 5000);
  }
  function onState(x) {
    const p = x.phase || { kind: 'lobby' }, pp = prev && (prev.phase || { kind: 'lobby' });
    const players = x.players || [], me = meFn();
    const hide = role === 'host' ? BOSS_KINDS.includes(p.kind) : ACTION_KINDS.includes(p.kind);
    if (window.Mascot) window.Mascot.hideDock(hide);
    document.body.dataset.phase = p.kind;
    if (!prev) { prev = x; track(players); if (role === 'host') say('intro', 'Bienvenue sur le plateau ! Branchez vos téléphones, on est en direct.', 5200); return; }

    // Arrivée de candidats
    if (p.kind === 'lobby' && role === 'host') {
      const known = new Set((prev.players || []).map(q => q.id));
      const fresh = players.filter(q => !known.has(q.id));
      if (fresh.length) say('hype', line('join', { name: fresh[fresh.length - 1].name }), 4200);
    }
    // Lancement d'une épreuve
    if (x.game && x.game !== prev.game && !['scores', 'lobby'].includes(p.kind)) {
      const ep = episodeOf(x.games, x.game);
      if (ep && !x.board) banner(ep.name.toUpperCase(), `ÉPREUVE ${ep.num}`, 'gold', 2100);
      say('intro', line('intro'), 4200);
      if (window.partyAudio && window.partyAudio.go) window.partyAudio.go();
    }
    // Changement de phase
    if (!pp || pp.n !== p.n) {
      if (p.round && p.round !== pp.round && p.round > 1 && !/Results$|^reveal$|^scores$/.test(p.kind) && role === 'host') {
        banner(`ROUND ${pad2(p.round)}`, `sur ${p.rounds}`, 'cyan', 1300);
        say('hype', line('round', { r: pad2(p.round) }), 3600);
      }
      if (p.kind === 'bossOver') { say('elim', line('elim'), 5000); flash('#ff2f6d'); }
      if (p.kind === 'scores' && role === 'player' && me) finalForPlayer(players, me);
    }
    // Évolution des scores
    const before = Object.fromEntries((prev.players || []).map(q => [q.id, q.score]));
    const gains = players.map(q => ({ ...q, gain: q.score - (before[q.id] ?? q.score) })).filter(q => q.gain > 0).sort((a, b) => b.gain - a.gain);
    if (gains.length && p.kind !== 'scores') scoreEvents(prev.players || [], players, gains, me);
    track(players);
    prev = x;
  }
  const rankOf = list => Object.fromEntries([...list].sort((a, b) => b.score - a.score).map((q, i) => [q.id, i]));
  function scoreEvents(old, now, gains, me) {
    const r0 = rankOf(old), r1 = rankOf(now), sorted = [...now].sort((a, b) => b.score - a.score);
    const leader = sorted[0], oldLeader = [...old].sort((a, b) => b.score - a.score)[0];
    const tieTop = sorted.length > 1 && sorted[0].score === sorted[1].score && sorted[0].score > 0;
    const climb = gains.map(g => ({ ...g, up: (r0[g.id] ?? 0) - r1[g.id] })).sort((a, b) => b.up - a.up)[0];
    if (role === 'host') {
      if (climb && climb.up >= 2 && now.length >= 3) { banner('QUEL COME-BACK !', climb.name.toUpperCase(), 'orange'); say('comeback', line('comeback', { name: climb.name })); confetti(90); shake(); }
      else if (tieTop) { banner('ÉGALITÉ !', 'en tête du classement', 'violet'); say('tie', line('tie')); }
      else if (oldLeader && leader.id !== oldLeader.id) { banner('NOUVEAU LEADER !', leader.name.toUpperCase(), 'magenta'); say('win', line('leader', { name: leader.name })); confetti(70); }
      else if (sorted.length > 1 && leader.score >= sorted[1].score * 2 && sorted[1].score > 0 && gains[0].id === leader.id) { say('crush', line('crush', { name: leader.name })); }
      else say('hype', line('gain', { name: gains[0].name, pts: gains[0].gain.toLocaleString('fr-FR') }), 3600);
      if (gains[0].gain > 0) pop(`+${gains[0].gain.toLocaleString('fr-FR')} POINTS`, innerWidth / 2, innerHeight * .28);
      if (window.partyAudio && window.partyAudio.good) window.partyAudio.good(2);
    } else if (me) {
      const mine = gains.find(g => g.id === me);
      if (mine) {
        pop(`+${mine.gain.toLocaleString('fr-FR')}`, innerWidth / 2, innerHeight * .4);
        confetti(40, { cannons: false });
        if (r1[me] === 0 && (r0[me] ?? 1) !== 0) { banner('TU PRENDS LA TÊTE !', '', 'gold', 1500); say('win', line('meWin', { name: (now.find(q => q.id === me) || {}).name })); }
        else if ((r0[me] ?? 0) - r1[me] >= 2) say('comeback', line('comeback', { name: mine.name }));
        else say('hype', `+${mine.gain} pour toi. Ne t’emballe pas.`, 2800);
      } else if (r1[me] === now.length - 1 && now.length > 2) {
        say('encourage', line('encourage', { name: (now.find(q => q.id === me) || {}).name }), 4200);
      }
    }
  }
  function finalForPlayer(players, me) {
    const sorted = [...players].sort((a, b) => b.score - a.score), i = sorted.findIndex(q => q.id === me), mine = sorted[i];
    if (!mine) return;
    const tie = sorted.length > 1 && sorted[0].score === sorted[1].score;
    if (i === 0 && !tie) { banner('VICTOIRE !', 'Tu es le champion', 'gold', 2400); confetti(200); flash('#ffd60a'); say('win', line('meWin', { name: mine.name }), 6000); }
    else if (tie && mine.score === sorted[0].score) { banner('ÉGALITÉ !', 'Au sommet', 'violet'); say('tie', line('tie'), 5000); }
    else if (i === sorted.length - 1) { banner('DÉFAITE…', 'Mais avec panache', 'magenta'); say('lose', line('lose', { name: mine.name }), 6000); }
    else { banner(`${i + 1}e PLACE`, mine.name.toUpperCase(), 'cyan'); say('encourage', line('encourage', { name: mine.name }), 5000); }
  }
  function answered() { say('hype', line('sent'), 2400); }

  window.ShowTV = { confetti, flash, shake, banner, pop, countUp, sparks, decorate, watch, get quietFor() { return Date.now() - lastTalk; }, onState, answered, awards, records, stats, line, say, episodes, episodeOf, intensityBars, INTENSITY_LABEL, esc, pad2 };
})();
