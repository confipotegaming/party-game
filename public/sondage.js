// Le Grand Sondage — vues hôte et joueur (tableau des réponses, fautes, saisie, révélations).
// Le serveur (games/sondage) est seul juge : ce fichier ne fait qu'afficher l'état reçu et envoyer les propositions.
(function () {
  'use strict';
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const audio = () => window.partyAudio || {};
  const play = (fn, ...a) => { try { audio()[fn] && audio()[fn](...a); } catch (e) { /* son facultatif */ } };

  // ---------- Tableau des réponses (partagé hôte / joueur / écran de fin de manche) ----------
  function slotHtml(s) {
    const open = s.answer && !s.missed;
    const cls = open ? 'open' : s.missed ? 'missed' : '';
    const ans = s.answer ? esc(s.answer) : '? ? ?';
    const votes = s.answer ? s.votes : s.votes == null ? '??' : s.votes;
    const by = open && s.byName ? `<span class="sv-by">${esc(s.byName)}</span>` : '';
    return `<div class="sv-slot ${cls}" data-pos="${s.position}"><span class="sv-num">${s.position}</span><span class="sv-ans">${ans}${by}</span><span class="sv-votes">${votes}</span></div>`;
  }
  function board(d, cls = '') {
    const two = d.slots.length > 5 ? ' two' : '';
    return `<div class="sv-board${two} ${cls}" style="--rows:${Math.ceil(d.slots.length / (two ? 2 : 1))}">${d.slots.map(slotHtml).join('')}</div>`;
  }
  // Met à jour les cases d'un tableau existant ; renvoie les positions nouvellement révélées.
  function updateBoard(root, d) {
    const fresh = [];
    d.slots.forEach(s => {
      const el = root.querySelector(`.sv-slot[data-pos="${s.position}"]`);
      if (!el || !s.answer || el.classList.contains('open')) return;
      el.outerHTML = slotHtml(s);
      root.querySelector(`.sv-slot[data-pos="${s.position}"]`).classList.add('flip');
      fresh.push(s.position);
    });
    return fresh;
  }
  const strikesHtml = (n, max) => Array.from({ length: max }, (_, i) => `<span class="sv-x ${i < n ? 'on' : ''}">✖</span>`).join('');
  const multChip = d => (d.multiplier > 1 ? `<span class="chip sv-mult">Points ×${d.multiplier}</span>` : '');
  const eventText = e => ({
    found: `✅ <b>${esc(e.name)}</b> trouve <b>${esc(e.answer)}</b> <span class="pts">+${e.pts}</span>`,
    miss: `❌ <b>${esc(e.name)}</b> : « ${esc(e.guess)} »`,
    out: `🚫 <b>${esc(e.name)}</b> est éliminé·e de la manche`,
  }[e.type] || '');

  // Petit « +38 » qui s'envole (réutilise l'animation btFloat de Cerveau Turbo).
  function floatPts(el, text) {
    if (!el) return;
    const f = document.createElement('span');
    f.className = 'sv-float'; f.textContent = text;
    el.appendChild(f); setTimeout(() => f.remove(), 1100);
  }
  function bigX(container) {
    const x = document.createElement('div');
    x.className = 'sv-bigx'; x.textContent = '✖';
    container.appendChild(x); setTimeout(() => x.remove(), 900);
  }

  // ---------- Hôte : choix du thème ----------
  function hostSetup(app, p, ctx) {
    delete app.dataset.svn;
    const d = p.data || {};
    app.innerHTML = `<header class="game-head"><div><div class="eyebrow">Nouveau mode</div><h1>📊 Le Grand Sondage</h1>
      <p class="muted">${d.rounds} manches · ${d.total} questions disponibles · 3 fautes et on est éliminé·e de la manche</p></div></header>
      <div class="prompt">${esc(p.prompt)}</div>
      <div class="games sv-themes"><button class="card sel" data-cat=""><span class="game-cat chip">Surprise</span><span class="game-title">🎲 Tous les thèmes</span><span class="game-desc">Un peu de tout, de plus en plus dur.</span></button>
      ${(d.categories || []).map(c => `<button class="card" data-cat="${esc(c.name)}"><span class="game-cat chip">${c.count} question${c.count > 1 ? 's' : ''}</span><span class="game-title">${esc(c.name)}</span></button>`).join('')}</div>
      ${ctx.stopGameButton()}`;
    app.querySelectorAll('[data-cat]').forEach(b => (b.onclick = () => ctx.emit('host:action', 'start:' + b.dataset.cat)));
    ctx.bindStop();
  }

  // ---------- Hôte : manche en cours ----------
  let hostSeen = 0;
  function host(app, p, ctx) {
    const d = p.data;
    const sideOf = () => `<section class="card sv-players"><div class="section-title sv-dark"><span>Fautes</span><small>${d.maxStrikes} max par joueur</small></div>
      ${p.expected.map(id => { const n = d.strikes[id] || 0; return `<div class="sv-player ${n >= d.maxStrikes ? 'out' : ''}"><span class="live-score-avatar">${ctx.avatarMarkup(ctx.avatarOf(id), 34, n >= d.maxStrikes ? 'grimace' : 'happy')}</span><b>${esc(ctx.nameOf(id))}</b><span class="sv-strikes">${strikesHtml(n, d.maxStrikes)}</span><strong>${d.roundPts[id] ? '+' + d.roundPts[id] : ''}</strong></div>`; }).join('')}</section>`;
    if (app.dataset.svn != p.n) {
      app.dataset.svn = p.n;
      hostSeen = Math.max(0, ...d.events.map(e => e.id));
      app.innerHTML = `<div class="host-game-grid sv-host"><div class="host-main"><div id="sv-head"></div>
        <div class="sv-question card"><div class="chips sv-tags"><span class="chip">${esc(d.difficulty)}</span>${multChip(d)}</div><p>${esc(d.question)}</p></div>
        <div id="sv-board">${board(d, 'big')}</div>
        <div class="sv-feed" id="sv-feed"></div>
        <div id="sv-side"></div>${ctx.stopGameButton()}</div><div id="sv-scores"></div></div>`;
      ctx.bindStop();
    }
    document.getElementById('sv-head').innerHTML = ctx.head({ ...p, expected: [] }); // pas de compteur « x/y réponses » ici
    document.getElementById('sv-scores').innerHTML = ctx.scoreBoard();
    document.getElementById('sv-side').innerHTML = sideOf();
    const fresh = updateBoard(document.getElementById('sv-board'), d);
    const feed = document.getElementById('sv-feed');
    const news = d.events.filter(e => e.id > hostSeen);
    feed.innerHTML = d.events.slice().reverse().map(e => `<div class="sv-event ${e.type} ${e.id > hostSeen ? 'new' : ''}">${eventText(e)}</div>`).join('');
    news.forEach(e => { if (e.type === 'found') floatPts(app.querySelector(`#sv-board .sv-slot[data-pos="${e.position}"]`), '+' + e.pts); });
    if (news.some(e => e.type === 'miss')) { bigX(app); play('bad'); }
    if (fresh.length) play('good', Math.min(4, fresh.length + 1));
    if (news.length) hostSeen = Math.max(...news.map(e => e.id));
  }

  // ---------- Joueur ----------
  let mine = { n: null, msg: '', kind: '' };
  function player(app, p, ctx) {
    const d = p.data, me = ctx.me, strikes = d.strikes[me] || 0, out = strikes >= d.maxStrikes;
    if (app.dataset.svn != p.n || app.dataset.svout != String(out)) {
      app.dataset.svn = p.n; app.dataset.svout = String(out);
      if (mine.n !== p.n) mine = { n: p.n, msg: '', kind: '' };
      app.innerHTML = `<div id="sv-top"></div><div class="card stack sv-play">
        <div class="row"><span class="chip">${esc(d.difficulty)}</span>${multChip(d)}<span class="sv-strikes" id="sv-strikes"></span></div>
        <p class="prompt">${esc(d.question)}</p>
        <div id="sv-board">${board(d, 'mini')}</div>
        ${out ? '<p class="prompt sv-out">🚫 3 fautes : vous êtes éliminé·e pour cette manche.<br><small class="muted-dark">Regardez l’écran !</small></p>'
        : `<input id="sv-in" maxlength="60" placeholder="Votre réponse" autocomplete="off" autocapitalize="off" enterkeyhint="send">
        <button id="sv-ok">Proposer</button>`}
        <p class="msg sv-msg" id="sv-msg"></p></div>`;
      const input = document.getElementById('sv-in');
      if (input) {
        const send = () => {
          const v = input.value.trim(); if (!v) return input.focus();
          ctx.send(v, r => feedback(app, r || {}));
          input.value = ''; input.focus();
        };
        document.getElementById('sv-ok').onclick = send;
        input.onkeydown = e => { if (e.key === 'Enter') send(); };
        input.focus();
      }
    }
    document.getElementById('sv-top').innerHTML = ctx.top;
    document.getElementById('sv-strikes').innerHTML = strikesHtml(strikes, d.maxStrikes);
    updateBoard(document.getElementById('sv-board'), d);
    const msg = document.getElementById('sv-msg');
    msg.innerHTML = mine.msg; msg.className = 'msg sv-msg ' + mine.kind;
  }

  function feedback(app, r) {
    const T = {
      found: [`✅ ${esc(r.answer)} : +${r.pts} points !`, 'ok'],
      miss: [`❌ Mauvaise réponse ! (${r.strikes}/${r.max} fautes)`, 'ko'],
      already: [`Déjà trouvée${r.byName ? ' par ' + esc(r.byName) : ''} : ${esc(r.answer)}`, 'info'],
      ambiguous: ['Soyez plus précis·e !', 'info'],
      slow: ['Doucement… une réponse à la fois 😉', 'info'],
      out: ['Vous êtes éliminé·e pour cette manche.', 'ko'],
    }[r.status];
    if (!T) return;
    mine.msg = T[0]; mine.kind = T[1];
    const msg = document.getElementById('sv-msg');
    if (msg) { msg.innerHTML = T[0]; msg.className = 'msg sv-msg ' + T[1]; }
    const card = app.querySelector('.sv-play');
    if (card) { card.classList.remove('ok', 'ko'); void card.offsetWidth; if (T[1] !== 'info') card.classList.add(T[1]); }
    if (r.status === 'found') { play('good', 2); floatPts(app.querySelector(`.sv-slot[data-pos="${r.position}"]`), '+' + r.pts); if (navigator.vibrate) navigator.vibrate(40); }
    else if (r.status === 'miss') { play('bad'); if (navigator.vibrate) navigator.vibrate([60, 40, 60]); }
    else play('error');
  }

  // Écran de fin de manche (phase « reveal » commune à tous les jeux) : tableau complet.
  function reveal(d) {
    const sum = `${d.found}/${d.total} réponses trouvées${d.multiplier > 1 ? ` · points ×${d.multiplier}` : ''}`;
    return `<div class="sv-reveal"><p class="muted">${esc(sum)}</p>${board(d, 'big')}</div>`;
  }

  window.SurveyGame = { board, reveal, host, hostSetup, player };
})();
