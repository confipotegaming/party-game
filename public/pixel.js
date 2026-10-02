// Pixel Flou — vues hôte et joueur : image pixelisée qui devient plus nette toutes les 3 secondes.
// Le serveur (games/pixelflou) envoie seulement l'image (photo ou sprite) et l'heure de départ ; c'est lui qui juge les réponses.
(function () {
  'use strict';
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const play = (fn, ...a) => { try { const au = window.partyAudio; au && au[fn] && au[fn](...a); } catch (e) { /* son facultatif */ } };
  const BG = [184, 199, 217];
  const MIN_SIDE = 16;

  // Une « source » donne la couleur de chaque pixel d'un carré S×S : un sprite (pixel art) ou une photo.
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  function spriteSource(sprite) {
    const S = Math.max(MIN_SIDE, sprite.w, sprite.h), ox = (S - sprite.w) / 2, oy = (S - sprite.h) / 2;
    return { S, get(x, y) {
      const row = sprite.px[Math.floor(y - oy + 0.5)], ch = row && x + 0.5 >= ox && y + 0.5 >= oy ? row[Math.floor(x - ox + 0.5)] : undefined;
      return ch && ch !== '.' && sprite.pal[ch] ? hex(sprite.pal[ch]) : BG;
    } };
  }
  const PHOTO = 256;
  const photos = {};
  // Charge une photo (carrée) et garde ses pixels pour la pixeliser ; cb est appelé quand elle est prête.
  function photoSource(url, cb) {
    if (photos[url]) { if (photos[url].S) cb && cb(photos[url]); else if (cb) photos[url].wait.push(cb); return photos[url].S ? photos[url] : null; }
    const p = photos[url] = { wait: cb ? [cb] : [] };
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = PHOTO;
      const g = c.getContext('2d'), side = Math.min(img.width, img.height);
      g.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, PHOTO, PHOTO);
      const data = g.getImageData(0, 0, PHOTO, PHOTO).data;
      Object.assign(p, { S: PHOTO, img, get: (x, y) => { const o = (y * PHOTO + x) * 4; return [data[o], data[o + 1], data[o + 2]]; } });
      p.wait.splice(0).forEach(f => f(p));
    };
    img.src = url;
    return null;
  }

  // Taille (en blocs) de l'image à chaque étape : 8×8 au départ, puis de plus en plus fin jusqu'à l'image nette.
  function sizes(S, steps, photo) {
    if (photo) return [8, 12, 16, 22, 30, 42, 64, S].slice(-steps).map((n, i) => i === 0 ? 8 : n);
    const out = [];
    for (let i = 0; i < steps; i++) out.push(i === steps - 1 ? S : Math.max(8, Math.round(8 * Math.pow(S / 8, i / (steps - 1)))));
    return out;
  }

  // Moyenne des couleurs de la source sur une grille n×n.
  function pixelate(src, n) {
    const S = src.S, out = new Uint8ClampedArray(n * n * 4), k = S / n;
    for (let by = 0; by < n; by++) for (let bx = 0; bx < n; bx++) {
      const x0 = bx * k, x1 = x0 + k, y0 = by * k, y1 = y0 + k, acc = [0, 0, 0];
      let tot = 0;
      for (let y = Math.floor(y0); y < Math.ceil(y1); y++) for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
        const w = (Math.min(x + 1, x1) - Math.max(x, x0)) * (Math.min(y + 1, y1) - Math.max(y, y0));
        if (w <= 0) continue;
        const c = src.get(x, y);
        acc[0] += c[0] * w; acc[1] += c[1] * w; acc[2] += c[2] * w; tot += w;
      }
      const o = (by * n + bx) * 4;
      out[o] = acc[0] / tot; out[o + 1] = acc[1] / tot; out[o + 2] = acc[2] / tot; out[o + 3] = 255;
    }
    return out;
  }
  function draw(canvas, src, n) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (src.img && n >= src.S) { // photo nette : on l'affiche telle quelle
      const side = Math.min(src.img.width, src.img.height);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(src.img, (src.img.width - side) / 2, (src.img.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
      return;
    }
    const small = document.createElement('canvas');
    small.width = small.height = n;
    small.getContext('2d').putImageData(new ImageData(pixelate(src, n), n, n), 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
  }

  // ---------- Manche en cours : horloge commune ----------
  let live = null, off = 0;
  const stepNow = () => live ? Math.max(0, Math.min(live.steps - 1, Math.floor((Date.now() + off - live.startAt) / live.stepMs))) : 0;
  const ptsAt = (base, step) => Math.round(base * (live.steps - step) / live.steps * (live.bonus || 1) / 10) * 10;
  let lastStep = -1;
  function tick() {
    if (!live || !live.src) return;
    const step = stepNow(), n = live.sizes[step];
    document.querySelectorAll('canvas.px-live').forEach(cv => {
      if (cv.dataset.key === live.n + ':' + n) return;
      cv.dataset.key = live.n + ':' + n;
      draw(cv, live.src, n);
    });
    document.querySelectorAll('[data-px-res]').forEach(el => { el.textContent = step === live.steps - 1 ? 'Image nette' : `${n}×${n} pixels`; });
    document.querySelectorAll('[data-px-bar]').forEach(el => { el.style.width = `${Math.round((step + 1) / live.steps * 100)}%`; });
    document.querySelectorAll('[data-px-char]').forEach(el => { el.textContent = ptsAt(live.base.char, step); });
    document.querySelectorAll('[data-px-game]').forEach(el => { el.textContent = ptsAt(live.base.game, step); });
    if (step !== lastStep) { if (lastStep >= 0 && step > lastStep && live.isHost) play('tick'); lastStep = step; }
  }
  setInterval(tick, 150);

  function setLive(p, ctx, isHost) {
    const d = p.data;
    off = ctx.off || 0;
    if (!live || live.n !== p.n) {
      // Points de base sans bonus : le serveur envoie les points à l'étape 0 (bonus inclus).
      const bonus = (p.difficulty && p.difficulty.bonus) || 1;
      live = { n: p.n, startAt: d.startAt, stepMs: d.stepMs, steps: d.steps, bonus, isHost,
        base: { char: d.pts.char / bonus, game: d.pts.game / bonus } };
      const ready = src => { if (live && live.n === p.n) { live.src = src; live.sizes = sizes(src.S, d.steps, !!d.image); tick(); } };
      if (d.image) photoSource(d.image, ready); else ready(spriteSource(d.sprite));
      lastStep = -1;
    }
  }

  const potHtml = () => `<div class="px-pot"><span class="chip">🧑 Personnage : <b data-px-char></b> pts</span><span class="chip">🎮 Jeu : <b data-px-game></b> pts</span></div>`;
  const meterHtml = () => `<div class="px-meter"><span data-px-res></span><div class="progress-bar"><i data-px-bar></i></div></div>`;
  const mark = ok => ok ? '✅' : '⬜';

  // ---------- Hôte ----------
  function host(app, p, ctx) {
    setLive(p, ctx, true);
    const d = p.data;
    if (app.dataset.pxn != p.n) {
      app.dataset.pxn = p.n;
      app.innerHTML = `<div class="host-game-grid px-host"><div class="host-main"><div id="px-head"></div>
        <div class="px-stage card"><canvas class="px-live px-canvas" width="512" height="512"></canvas>${meterHtml()}${potHtml()}</div>
        <div id="px-side"></div>${ctx.stopGameButton()}</div><div id="px-scores"></div></div>`;
      ctx.bindStop();
    }
    document.getElementById('px-head').innerHTML = ctx.head({ ...p, expected: [] });
    document.getElementById('px-scores').innerHTML = ctx.scoreBoard();
    const found = d.found || {};
    document.getElementById('px-side').innerHTML = `<section class="card px-players"><div class="section-title px-dark"><span>Qui a trouvé ?</span><small>personnage · jeu</small></div>
      ${p.expected.map(id => { const f = found[id] || {}; return `<div class="px-player"><span class="live-score-avatar">${ctx.avatarMarkup(ctx.avatarOf(id), 34, f.char ? 'happy' : 'sleepy')}</span><b>${esc(ctx.nameOf(id))}</b><span>${mark(f.char)} 🧑</span><span>${mark(f.game)} 🎮</span></div>`; }).join('')}
      ${(d.events || []).length ? `<div class="px-feed">${d.events.slice().reverse().map(e => `<div>🎉 <b>${esc(e.name)}</b> a trouvé ${e.got.map(x => x === 'char' ? 'le personnage' : 'le jeu').join(' et ')} <span class="pts">+${e.pts}</span></div>`).join('')}</div>` : ''}</section>`;
    const seen = Number(app.dataset.pxev || 0), evs = (d.events || []).length;
    if (evs > seen) play('good', Math.min(4, evs - seen + 1));
    app.dataset.pxev = evs;
    tick();
  }

  // ---------- Joueur ----------
  let msg = { n: null, text: '', kind: '' };
  function player(app, p, ctx) {
    setLive(p, ctx, false);
    const f = (p.data.found || {})[ctx.me] || {}, done = !!(f.char && f.game);
    if (msg.n !== p.n) msg = { n: p.n, text: '', kind: '' };
    if (app.dataset.pxn != p.n || app.dataset.pxdone != String(done)) {
      app.dataset.pxn = p.n; app.dataset.pxdone = String(done);
      app.innerHTML = `<div id="px-top"></div><div class="card stack px-play">
        <canvas class="px-live px-canvas" width="256" height="256"></canvas>${meterHtml()}
        <div class="px-mine" id="px-mine"></div>
        ${done ? '<p class="prompt">Bravo, vous avez tout trouvé ! 🏆<br><small>Regardez l’écran.</small></p>'
        : `${potHtml()}<input id="px-in" maxlength="60" placeholder="Personnage ou jeu…" autocomplete="off" autocapitalize="off" enterkeyhint="send">
        <button id="px-ok">Proposer</button>`}
        <p class="msg px-msg" id="px-msg"></p></div>`;
      const input = document.getElementById('px-in');
      if (input) {
        const send = () => {
          const v = input.value.trim(); if (!v) return input.focus();
          ctx.send(v, r => feedback(r || {}));
          input.value = ''; input.focus();
        };
        document.getElementById('px-ok').onclick = send;
        input.onkeydown = e => { if (e.key === 'Enter') send(); };
        input.focus();
      }
    }
    document.getElementById('px-top').innerHTML = ctx.top;
    document.getElementById('px-mine').innerHTML = `<span class="chip ${f.char ? 'px-ok' : ''}">${mark(f.char)} Personnage</span><span class="chip ${f.game ? 'px-ok' : ''}">${mark(f.game)} Jeu</span>`;
    const m = document.getElementById('px-msg');
    m.innerHTML = msg.text; m.className = 'msg px-msg ' + msg.kind;
    tick();
  }
  function feedback(r) {
    const T = {
      found: () => [`✅ ${[r.char && `Personnage : <b>${esc(r.char)}</b>`, r.game && `Jeu : <b>${esc(r.game)}</b>`].filter(Boolean).join(' · ')} (+${r.pts})${r.done ? '' : r.char ? '<br>Et le jeu ?' : '<br>Et le personnage ?'}`, 'ok'],
      miss: () => ['❌ Ce n’est pas ça, réessayez !', 'ko'],
      already: () => [r.what === 'char' ? 'Personnage déjà trouvé : cherchez le jeu !' : 'Jeu déjà trouvé : cherchez le personnage !', 'info'],
      slow: () => ['Doucement… une réponse à la fois 😉', 'info'],
    }[r.status];
    if (!T) return;
    const [text, kind] = T();
    msg = { ...msg, text, kind };
    if (r.status === 'found') play('good', r.got && r.got.length > 1 ? 3 : 1); else if (r.status === 'miss') play('error');
    const m = document.getElementById('px-msg');
    if (m) { m.innerHTML = text; m.className = 'msg px-msg ' + kind; }
  }

  // ---------- Révélation (hôte et joueurs) ----------
  function reveal(d) {
    const id = 'px-r' + Math.random().toString(36).slice(2, 8);
    const show = src => { const cv = document.getElementById(id); if (cv) draw(cv, src, src.S); };
    setTimeout(() => { if (d.image) photoSource(d.image, show); else show(spriteSource(d.sprite)); });
    const c = d.credit;
    const credit = c ? `<div class="px-credit">📷 ${esc(c.author || 'Auteur inconnu')} · <a href="${esc(c.licenseUrl || c.source)}" target="_blank" rel="noopener">${esc(c.license)}</a> · <a href="${esc(c.source)}" target="_blank" rel="noopener">Wikimedia Commons</a></div>` : '';
    return `<div class="px-reveal"><canvas id="${id}" class="px-canvas" width="512" height="512"></canvas><div><div class="px-name">${esc(d.name)}</div><div class="px-game">🎮 ${esc(d.game)}</div>${credit}</div></div>`;
  }

  window.PixelGame = { host, player, reveal, sizes, pixelate };
})();
