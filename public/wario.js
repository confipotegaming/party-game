// Warioware — micro-jeux express côté joueur.
// Une consigne d'un mot (« ATTRAPE ! », « ÉVITE ! »…), quelques secondes pour agir, puis le suivant
// enchaîne aussitôt. Tous les 5 micro-jeux, tout accélère. 4 vies : à 0, c'est GAME OVER.
// Le barème des titres (rate) et les noms des micro-jeux (LABELS) sont partagés avec le serveur et l'hôte.
(function () {
  'use strict';

  // ---------- Partagé client + serveur ----------
  const LIVES = 4, LEVEL_EVERY = 5, SPEED_STEP = 0.2, SPEED_MAX = 2.8;
  const speedOf = lvl => Math.min(SPEED_MAX, 1 + SPEED_STEP * lvl);
  const TITLES = [
    { min: 40, icon: '👑', name: 'Roi·Reine du micro-jeu' },
    { min: 25, icon: '🔥', name: 'Survolté·e' },
    { min: 15, icon: '⚡', name: 'Réflexes d\'acier' },
    { min: 8, icon: '🕹️', name: 'Joueur·se' },
    { min: 0, icon: '🥚', name: 'Débutant·e' },
  ];
  const rate = r => TITLES.find(t => (r.cleared || 0) >= t.min) || TITLES[TITLES.length - 1];
  const LABELS = {
    catch: '🥚 Attrape !', dodge: '☄️ Évite !', mash: '🎈 Tape !', find: '🔍 Trouve !', memo: '🧠 Mémorise !',
    react: '🤠 Réagis !', aim: '🎯 Vise !', swat: '🦟 Écrase !', jump: '🌵 Saute !', stop: '⏸️ Stop !',
    nose: '👃 Dans le nez !', count: '🐑 Compte !', bigger: '🔢 Le plus grand !', dont: '🚫 Ne touche pas !',
    color: '🎨 La couleur !', arrows: '⬆️ Recopie !', fill: '🥛 Remplis !',
  };
  const shared = { LIVES, LEVEL_EVERY, speedOf, TITLES, rate, LABELS };
  if (typeof module === 'object' && module.exports) { module.exports = shared; return; }

  // ---------- Outils ----------
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b, x, y) => Math.hypot(a - x, b - y);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const sfx = (name, ...a) => { try { window.partyAudio && window.partyAudio[name] && window.partyAudio[name](...a); } catch (e) { /* son facultatif */ } };
  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* facultatif */ } };
  const fmtN = n => Math.round(n).toLocaleString('fr-FR');
  const fmtX = s => '×' + s.toFixed(1).replace('.', ',');
  const store = (kind, key, val) => { try { const s = window[kind]; if (val === undefined) return JSON.parse(s.getItem(key) || 'null'); s.setItem(key, JSON.stringify(val)); } catch (e) { return null; } };
  const RECORDS_KEY = 'pg-wario-records';

  const EMOJIS = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🥝', '🍋', '🍉', '🥕', '🍄', '🐱', '🐶', '🐰', '🦊', '🐼', '🐸', '🐵', '🐨', '🐷', '🐙', '🐧', '⭐', '🌙', '❤️', '⚡', '🎈', '🎁', '🔔', '🍀', '💎', '🚀', '🍩', '🎸'];
  const LOOKALIKE = [['😀', '😃'], ['🐱', '😺'], ['⭐', '🌟'], ['💙', '💜'], ['🌕', '🌝'], ['🍏', '🍎'], ['🐶', '🐕'], ['❤️', '🧡'], ['🌲', '🌳'], ['🙂', '😊'], ['🐭', '🐹'], ['🐻', '🐨']];
  const COLORS = [
    { n: 'ROUGE', c: '#ff4d6d' }, { n: 'BLEU', c: '#3b8cff' }, { n: 'VERT', c: '#2fbf5b' },
    { n: 'JAUNE', c: '#ffd23f' }, { n: 'VIOLET', c: '#9b6bff' },
  ];
  const BGS = ['#ffd23f', '#35d0ba', '#ff8fb1', '#8fd3ff', '#b9a4ff', '#ffb36b', '#9df0a8'];

  // ================================================================
  //  MICRO-JEUX
  //  mount(g) reçoit la scène. Le temps du jeu (dt, en secondes) est déjà
  //  multiplié par la vitesse : tout accélère sans toucher aux règles.
  //  beats : durée en secondes « de jeu ». survive : gagné si le temps s'écoule.
  // ================================================================
  const GAMES = [
    { id: 'catch', verb: 'ATTRAPE !', hint: '👆 Glisse le doigt', beats: 4.4, mount(g) {
      const size = g.S * 0.15, basket = g.sprite('🧺', size * 1.3).set(g.W / 2, g.H - size * 0.9);
      const n = g.lv >= 3 ? 2 : 1, items = [];
      for (let i = 0; i < n; i++) items.push({ at: 0.25 + i * 0.95, sp: null, x: rnd(size, g.W - size), y: -size, vx: g.lv >= 2 ? rnd(-1, 1) * g.W * 0.18 : 0 });
      let caught = 0;
      g.frame(dt => {
        basket.set(basket.x + (g.ptr.x - basket.x) * Math.min(1, dt * 16), basket.y);
        for (const it of items) {
          if (it.done || g.t() < it.at * 1000) continue;
          if (!it.sp) it.sp = g.sprite(pick(['🥚', '🥚', '🍎', '🍩', '🧁']), size);
          it.y += g.H / 2.1 * dt; it.x += it.vx * dt;
          if (it.x < size / 2 || it.x > g.W - size / 2) it.vx *= -1;
          it.sp.set(it.x, it.y, `rotate(${it.y}deg)`);
          if (it.y > basket.y - size * 0.55 && it.y < basket.y && Math.abs(it.x - basket.x) < size * 0.85) {
            it.done = true; it.sp.el.remove(); g.burst(basket.x, basket.y - size / 2); sfx('note', ++caught);
            if (caught === n) g.win();
          } else if (it.y > g.H + size) { it.done = true; g.lose(); }
        }
      });
    } },

    { id: 'dodge', verb: 'ÉVITE !', hint: '👆 Glisse le doigt', beats: 4.2, survive: true, mount(g) {
      const size = g.S * 0.13, me = g.sprite('🐥', size * 1.2).set(g.W / 2, g.H - size * 0.9);
      const n = Math.min(9, 3 + g.lv), rocks = [];
      for (let i = 0; i < n; i++) rocks.push({ at: 0.2 + i * (3.1 / n), sp: null, x: 0, y: -size });
      g.frame(dt => {
        me.set(clamp(me.x + (g.ptr.x - me.x) * Math.min(1, dt * 16), size / 2, g.W - size / 2), me.y);
        for (const r of rocks) {
          if (g.t() < r.at * 1000 || r.y > g.H + size) continue;
          if (!r.sp) { r.x = Math.random() < 0.5 ? clamp(me.x + rnd(-size, size), size, g.W - size) : rnd(size, g.W - size); r.sp = g.sprite(pick(['☄️', '🪨', '💣']), size); }
          r.y += g.H / 1.35 * dt; r.sp.set(r.x, r.y);
          if (dist(r.x, r.y, me.x, me.y) < size * 0.8) { me.el.textContent = '😵'; return g.lose(); }
        }
      });
    } },

    { id: 'mash', verb: 'TAPE !', hint: '👆 Vite, vite, vite !', beats: 4, mount(g) {
      const need = clamp(Math.round(g.realS * 3.1), 5, 13);
      const b = g.sprite('🎈', g.S * 0.2).set(g.W / 2, g.H * 0.5), pump = g.sprite('🫸', g.S * 0.14).set(g.W * 0.18, g.H * 0.55);
      const left = g.label('', 'wa-big').set(g.W / 2, g.H * 0.86);
      let n = 0;
      const draw = () => { left.el.textContent = need - n; b.set(b.x, b.y, `scale(${1 + 1.6 * n / need})`); };
      draw();
      g.tap(() => {
        n++; sfx('note', n); pump.set(pump.x, pump.y, 'translateX(12px)'); setTimeout(() => pump.set(pump.x, pump.y), 70);
        if (n >= need) { b.el.textContent = '💥'; left.el.textContent = '🎉'; return g.win(); }
        draw();
      });
    } },

    { id: 'find', verb: 'TROUVE !', beats: 4, mount(g) {
      const n = clamp(5 + g.lv * 2, 5, 16), pair = g.lv >= 3 && Math.random() < 0.6 ? pick(LOOKALIKE) : null;
      const target = pair ? pair[0] : pick(EMOJIS);
      const pool = pair ? [pair[1]] : EMOJIS.filter(e => e !== target);
      const items = shuffle([target, ...Array.from({ length: n - 1 }, (_, i) => pair && i % 2 ? pick(EMOJIS.filter(e => e !== target)) : pick(pool))]);
      g.label(`Trouve : <span class="wa-target">${target}</span>`, 'wa-ask').set(g.W / 2, g.H * 0.09);
      const cells = g.grid(n, 0.2), size = Math.min(g.S * 0.15, cells.cell * 0.8);
      items.forEach((e, i) => g.sprite(e, size, true).set(cells.at[i].x, cells.at[i].y, `rotate(${R(-20, 20)}deg)`).hit(sp => {
        if (e === target) { g.burst(sp.x, sp.y); g.win(); } else { sp.el.classList.add('wa-wrong'); g.lose(); }
      }));
    } },

    { id: 'memo', verb: 'MÉMORISE !', beats: 5.6, mount(g) {
      const k = clamp(2 + Math.floor(g.lv / 2), 2, 5), shown = shuffle(EMOJIS).slice(0, k), size = g.S * 0.16;
      const cells = g.grid(k, 0.15), sps = shown.map((e, i) => g.sprite(e, size).set(cells.at[i].x, cells.at[i].y));
      const ask = g.label('Regarde bien… 👀', 'wa-ask').set(g.W / 2, g.H * 0.08);
      g.after(1700, () => {
        if (Math.random() < 0.5) { // « Où était … ? »
          const t = R(0, k - 1);
          ask.el.innerHTML = `Où était <span class="wa-target">${shown[t]}</span> ?`;
          sps.forEach((sp, i) => { sp.el.textContent = '❓'; sp.hit(() => { sp.el.textContent = shown[i]; i === t ? g.win() : (sp.el.classList.add('wa-wrong'), g.lose()); }); });
        } else { // « Lequel était là ? »
          sps.forEach(sp => sp.el.remove());
          ask.el.textContent = 'Lequel était là ?';
          const good = pick(shown), others = shuffle(EMOJIS.filter(e => !shown.includes(e))).slice(0, 2);
          g.choices(shuffle([good, ...others]), good);
        }
      });
    } },

    { id: 'react', verb: 'RÉAGIS !', hint: 'Tape au signal… pas avant !', beats: 4.8, mount(g) {
      const size = g.S * 0.22;
      g.sprite('🤠', size).set(g.W * 0.2, g.H * 0.6, 'scaleX(-1)');
      const bad = g.sprite('🦹', size).set(g.W * 0.8, g.H * 0.6);
      const sig = g.label('…', 'wa-signal').set(g.W / 2, g.H * 0.28);
      const fireAt = rnd(1.1, 3.0) * 1000;
      let fired = false;
      if (g.lv >= 2 && fireAt > 1800) g.after(fireAt - R(600, 900), () => { const bird = g.sprite('🐦', g.S * 0.12); let x = -40; g.frame(dt => { x += g.W * 1.6 * dt; bird.set(x, g.H * 0.25); }); });
      g.after(fireAt, () => { fired = true; sig.el.textContent = '💥 TIRE !'; sig.el.classList.add('on'); g.stage.classList.add('wa-flash'); sfx('tick'); });
      g.tap(() => {
        if (!fired) { sig.el.textContent = 'Trop tôt !'; return g.lose(); }
        bad.el.textContent = '😵'; bad.set(bad.x, bad.y, 'rotate(80deg)'); g.win();
      });
    } },

    { id: 'aim', verb: 'VISE !', hint: '👆 Touche la cible', beats: 4, mount(g) {
      const size = g.S * clamp(0.2 - g.lv * 0.012, 0.12, 0.2), sp = g.sprite('🎯', size);
      let need = g.lv >= 4 ? 2 : 1, a = rnd(0, Math.PI * 2), v = g.S * (0.7 + 0.22 * g.lv);
      let x = rnd(size, g.W - size), y = rnd(size, g.H - size);
      g.frame(dt => {
        x += Math.cos(a) * v * dt; y += Math.sin(a) * v * dt;
        if (x < size / 2 || x > g.W - size / 2) { a = Math.PI - a; x = clamp(x, size / 2, g.W - size / 2); }
        if (y < size / 2 || y > g.H - size / 2) { a = -a; y = clamp(y, size / 2, g.H - size / 2); }
        sp.set(x, y);
      });
      g.tap((px, py) => {
        if (dist(px, py, x, y) < size * 0.75) {
          g.burst(x, y); sfx('note', 3);
          if (--need <= 0) { sp.el.textContent = '💥'; return g.win(); }
          x = rnd(size, g.W - size); y = rnd(size, g.H - size); a = rnd(0, Math.PI * 2);
        } else g.miss(px, py);
      });
    } },

    { id: 'swat', verb: 'ÉCRASE !', hint: '👆 Tous les moustiques', beats: 4.6, mount(g) {
      const size = g.S * 0.12, n = clamp(2 + Math.floor(g.lv / 2), 2, 6), v = g.S * (0.45 + 0.1 * g.lv);
      const bugs = Array.from({ length: n }, () => ({ x: rnd(size, g.W - size), y: rnd(size, g.H - size), a: rnd(0, 7), sp: g.sprite('🦟', size), dead: false }));
      let left = n;
      g.frame(dt => bugs.forEach(b => {
        if (b.dead) return;
        b.a += rnd(-5, 5) * dt;
        b.x += Math.cos(b.a) * v * dt; b.y += Math.sin(b.a) * v * dt;
        if (b.x < size / 2 || b.x > g.W - size / 2) b.a = Math.PI - b.a;
        if (b.y < size / 2 || b.y > g.H - size / 2) b.a = -b.a;
        b.x = clamp(b.x, size / 2, g.W - size / 2); b.y = clamp(b.y, size / 2, g.H - size / 2);
        b.sp.set(b.x, b.y, `rotate(${Math.sin(g.t() / 40) * 15}deg)`);
      }));
      g.tap((px, py) => {
        const b = bugs.filter(b => !b.dead).sort((p, q) => dist(px, py, p.x, p.y) - dist(px, py, q.x, q.y))[0];
        if (!b || dist(px, py, b.x, b.y) > size * 0.9) return g.miss(px, py);
        b.dead = true; b.sp.el.textContent = '💥'; sfx('note', n - left); setTimeout(() => b.sp.el.remove(), 250);
        if (--left === 0) g.win();
      });
    } },

    { id: 'jump', verb: 'SAUTE !', hint: '👆 Tape pour sauter', beats: 5, survive: true, mount(g) {
      const size = g.S * 0.14, ground = g.H * 0.8, rx = g.W * 0.22;
      g.box('wa-ground').style.top = ground + 'px';
      const me = g.sprite('🏃', size * 1.1);
      const n = 1 + (g.lv >= 2) + (g.lv >= 5), obs = [];
      let t0 = 0.9;
      for (let i = 0; i < n; i++) { obs.push({ at: t0, x: g.W + size, sp: null }); t0 += rnd(1.0, 1.3); }
      let y = 0, vy = 0;
      g.tap(() => { if (y === 0) { vy = size * 9.5; sfx('note', 2); } });
      g.frame(dt => {
        if (y > 0 || vy > 0) { y += vy * dt; vy -= size * 28 * dt; if (y <= 0) { y = 0; vy = 0; } }
        me.set(rx, ground - size * 0.5 - y, `scaleX(-1)${y ? ' rotate(-20deg)' : ''}`);
        for (const o of obs) {
          if (g.t() < o.at * 1000) continue;
          if (!o.sp) o.sp = g.sprite(pick(['🌵', '🪨', '🔥']), size);
          o.x -= g.W / 1.35 * dt; o.sp.set(o.x, ground - size * 0.45);
          if (Math.abs(o.x - rx) < size * 0.6 && y < size * 0.7) { me.el.textContent = '😵'; return g.lose(); }
        }
      });
    } },

    { id: 'stop', verb: 'STOP !', hint: '👆 Dans la zone verte', beats: 4, mount(g) {
      const bar = g.box('wa-bar'), zw = clamp(0.28 - g.lv * 0.025, 0.1, 0.28), z0 = rnd(0.08, 0.92 - zw);
      bar.innerHTML = `<i class="wa-zone" style="left:${z0 * 100}%;width:${zw * 100}%"></i><b class="wa-needle"></b>`;
      const needle = bar.querySelector('b');
      let p = 0, dir = 1;
      g.frame(dt => { p += dir * dt / 0.85; if (p > 1) { p = 1; dir = -1; } if (p < 0) { p = 0; dir = 1; } needle.style.left = p * 100 + '%'; });
      g.tap(() => {
        if (p >= z0 && p <= z0 + zw) { bar.classList.add('ok'); g.win(); } else { bar.classList.add('ko'); g.lose(); }
      });
    } },

    { id: 'nose', verb: 'DANS LE NEZ !', hint: '👆 Tape au bon moment', beats: 4.2, mount(g) {
      const ns = g.S * 0.32, fs = g.S * 0.16, nose = g.sprite('👃', ns).set(g.W / 2, g.H * 0.26);
      const finger = g.sprite('👆', fs);
      let fx = g.W * 0.2, dir = 1, fy = g.H * 0.85, shot = false, nx = g.W / 2, ndir = 1;
      const v = g.W * (0.7 + 0.08 * g.lv);
      g.tap(() => { if (!shot) { shot = true; sfx('note', 1); } });
      g.frame(dt => {
        if (g.lv >= 3) { nx += ndir * g.W * 0.25 * dt; if (nx < ns / 2 || nx > g.W - ns / 2) ndir *= -1; nose.set(nx, nose.y); }
        if (!shot) { fx += dir * v * dt; if (fx < fs / 2 || fx > g.W - fs / 2) { dir *= -1; fx = clamp(fx, fs / 2, g.W - fs / 2); } }
        else fy -= g.H * 2.4 * dt;
        finger.set(fx, fy);
        if (shot && fy <= nose.y + ns * 0.3) {
          if (Math.abs(fx - nose.x) < ns * 0.22) { fy = nose.y + ns * 0.3; finger.set(fx, fy); nose.el.textContent = '🤧'; g.win(); }
          else { finger.set(fx, fy); g.lose(); }
          shot = false;
        }
      });
    } },

    { id: 'count', verb: 'COMPTE LES 🐑 !', beats: 6.6, mount(g) {
      const k = clamp(3 + Math.floor(g.lv / 1.5), 3, 9), size = g.S * 0.14, decoys = g.lv >= 3 ? R(1, 2) : 0;
      const list = shuffle([...Array(k).fill('🐑'), ...Array(decoys).fill('🐐')]);
      g.box('wa-ground').style.top = g.H * 0.7 + 'px';
      const flock = list.map((e, i) => ({ e, at: 0.3 + i * rnd(0.3, 0.38), x: -size, sp: null }));
      let asked = false;
      g.frame(dt => {
        let gone = 0;
        for (const s of flock) {
          if (g.t() < s.at * 1000) continue;
          if (!s.sp) s.sp = g.sprite(s.e, size);
          s.x += g.W / 1.0 * dt;
          s.sp.set(s.x, g.H * 0.7 - size * 0.5 - Math.abs(Math.sin(s.x / 40)) * size * 0.7, 'scaleX(-1)');
          if (s.x > g.W + size) gone++;
        }
        if (!asked && gone === flock.length) {
          asked = true;
          g.label('Combien de 🐑 ?', 'wa-ask').set(g.W / 2, g.H * 0.15);
          g.choices(shuffle([k, k + pick([-1, 1]), k + pick([2, -2])].filter((v, i, a) => v > 0 && a.indexOf(v) === i)).map(String), String(k));
        }
      });
    } },

    { id: 'bigger', verb: 'LE PLUS GRAND !', hint: 'Le plus grand nombre', beats: 3.6, mount(g) {
      const n = g.lv < 2 ? 2 : g.lv < 5 ? 3 : 4, span = g.lv < 3 ? 60 : g.lv < 6 ? 20 : 9;
      const base = R(5, 90), nums = new Set();
      while (nums.size < n) nums.add(base + R(0, span));
      const arr = shuffle([...nums]), max = Math.max(...arr);
      const wrap = g.box('wa-nums');
      arr.forEach(v => {
        const b = h('button', 'wa-num', String(v));
        b.style.fontSize = (v === max && g.lv >= 2 ? rnd(1.6, 2.2) : rnd(2.2, 3.6)) + 'rem'; // piège : le plus grand écrit en petit
        b.onpointerdown = e => { e.stopPropagation(); if (!g.alive()) return; if (v === max) { b.classList.add('ok'); g.win(); } else { b.classList.add('ko'); g.lose(); } };
        wrap.appendChild(b);
      });
    } },

    { id: 'dont', verb: 'NE TOUCHE PAS !', beats: 3.6, survive: true, mount(g) {
      const b = h('button', 'wa-tempt', 'APPUIE !');
      g.stage.appendChild(b);
      const lines = ['Allez…', 'Juste une fois…', 'Personne ne verra 🤫', 'Tu en as envie 😏', 'Il est tout doux…'];
      const say = g.label(pick(lines), 'wa-ask').set(g.W / 2, g.H * 0.12);
      let x = g.W / 2, y = g.H * 0.55;
      const place = () => { b.style.left = x + 'px'; b.style.top = y + 'px'; };
      place();
      g.after(1300, () => { say.el.textContent = pick(lines); });
      if (g.lv >= 2) g.frame(dt => { x += (g.ptr.x - x) * Math.min(1, dt * 1.5); y += (g.ptr.y - y) * Math.min(1, dt * 1.5); place(); }); // il te suit…
      g.tap(() => { b.textContent = 'PERDU 😈'; b.classList.add('pressed'); g.lose(); });
    } },

    { id: 'color', verb: 'LA COULEUR !', hint: 'La couleur de l\'encre', beats: 3.8, mount(g) {
      const n = g.lv < 3 ? 3 : 4, cols = shuffle(COLORS).slice(0, n), ink = cols[0], word = pick(COLORS.filter(c => c !== ink));
      const w = g.label(word.n, 'wa-word').set(g.W / 2, g.H * 0.3);
      w.el.style.color = ink.c;
      const wrap = g.box('wa-dots');
      shuffle(cols).forEach(c => {
        const b = h('button', 'wa-dot'); b.style.background = c.c; b.setAttribute('aria-label', c.n);
        b.onpointerdown = e => { e.stopPropagation(); if (!g.alive()) return; if (c === ink) { b.classList.add('ok'); g.win(); } else { b.classList.add('ko'); g.lose(); } };
        wrap.appendChild(b);
      });
    } },

    { id: 'arrows', verb: 'RECOPIE !', beats: 5, mount(g) {
      const k = clamp(2 + Math.floor(g.lv / 2), 2, 6), dirs = ['⬅️', '⬆️', '⬇️', '➡️'], seq = Array.from({ length: k }, () => pick(dirs));
      const line = g.box('wa-seq');
      line.innerHTML = seq.map(d => `<span>${d}</span>`).join('');
      const pad = g.box('wa-pad');
      let i = 0;
      ['', '⬆️', '', '⬅️', '⬇️', '➡️'].forEach(d => {
        const b = h('button', d ? 'wa-arrow' : 'wa-arrow empty', d);
        if (d) b.onpointerdown = e => {
          e.stopPropagation(); if (!g.alive()) return;
          if (d !== seq[i]) { line.children[i].classList.add('ko'); return g.lose(); }
          line.children[i++].classList.add('ok'); sfx('note', i);
          if (i === k) g.win();
        };
        pad.appendChild(b);
      });
    } },

    { id: 'fill', verb: 'REMPLIS !', hint: 'Maintiens… puis lâche !', beats: 4.6, mount(g) {
      const glass = g.box('wa-glass'), bw = clamp(0.2 - g.lv * 0.015, 0.09, 0.2), b0 = rnd(0.55, 0.88 - bw);
      glass.innerHTML = `<i class="wa-band" style="bottom:${b0 * 100}%;height:${bw * 100}%"></i><b class="wa-milk"></b>`;
      const milk = glass.querySelector('b');
      let lvl = 0, holding = false;
      const judge = () => { if (lvl >= b0 && lvl <= b0 + bw) { glass.classList.add('ok'); g.win(); } else { glass.classList.add('ko'); g.lose(); } };
      g.tap(() => { holding = true; });
      g.release(() => { if (holding && lvl > 0.04) judge(); holding = false; });
      g.frame(dt => {
        if (holding) lvl += dt / 1.7;
        if (lvl >= 1) { lvl = 1; holding = false; milk.style.height = '100%'; glass.classList.add('ko', 'over'); return g.lose(); }
        milk.style.height = lvl * 100 + '%';
      });
    } },
  ];

  // ---------- Records personnels ----------
  function updateRecords(res) {
    const old = store('localStorage', RECORDS_KEY) || { score: 0, cleared: 0, speed: 0, streak: 0, games: 0 };
    const isNew = { score: res.score > old.score, cleared: res.cleared > old.cleared, speed: res.speed > old.speed, streak: res.maxStreak > old.streak };
    const best = {
      score: Math.max(old.score, res.score), cleared: Math.max(old.cleared, res.cleared),
      speed: Math.max(old.speed, res.speed), streak: Math.max(old.streak, res.maxStreak), games: old.games + 1,
    };
    store('localStorage', RECORDS_KEY, best);
    return { best, isNew, first: old.games === 0 };
  }

  // ================================================================
  //  BOUCLE DE PARTIE
  // ================================================================
  function run(el, o) {
    const saved = store('sessionStorage', o.key);
    const st = saved && !saved.finished ? saved : { score: 0, cleared: 0, failed: 0, lives: LIVES, played: 0, streak: 0, maxStreak: 0, speed: 10, recent: [] };
    let dead = false, raf = 0, cur = '';

    el.innerHTML = `<div class="wa">
      <div class="wa-hud">
        <div class="wa-lives" data-lives></div>
        <div class="bt-stat"><small>SCORE</small><b data-score>0</b></div>
        <div class="bt-stat"><small>VITESSE</small><b data-speed>×1</b></div>
      </div>
      <div class="wa-stage" data-stage></div>
      <div class="wa-fuse"><i data-fuse></i><span>💣</span></div>
      <div class="wa-inter" data-inter></div>
    </div>`;
    const $ = k => el.querySelector(`[data-${k}]`);
    const stage = $('stage'), inter = $('inter'), fuse = $('fuse');
    const hearts = (lost) => Array.from({ length: LIVES }, (_, i) => `<span class="${i < st.lives ? '' : 'off'}${i === lost ? ' lost' : ''}">${i < st.lives ? '❤️' : '🖤'}</span>`).join('');
    const hud = () => { $('lives').innerHTML = hearts(-1); $('score').textContent = fmtN(st.score); $('speed').textContent = fmtX(st.speed / 10); };
    const save = () => store('sessionStorage', o.key, st);
    const stats = () => ({ score: st.score, cleared: st.cleared, failed: st.failed, lives: st.lives, played: st.played, streak: st.streak, maxStreak: st.maxStreak, speed: st.speed, type: cur });
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const screen = (html, cls) => { inter.className = 'wa-inter on ' + (cls || ''); inter.style.setProperty('--bg', pick(BGS)); inter.innerHTML = html; };
    const hide = () => { inter.className = 'wa-inter'; };
    hud();

    // Lance un micro-jeu, renvoie une promesse : true (réussi) / false (raté).
    function playOne(def, speed, lv) {
      return new Promise(resolve => {
        stage.innerHTML = ''; stage.className = 'wa-stage wa-' + def.id;
        stage.style.setProperty('--bg', pick(BGS));
        const rect = stage.getBoundingClientRect(), W = rect.width, H = rect.height;
        const dur = def.beats * 1000;
        let t = 0, last = performance.now(), over = false, result = false;
        const frames = [], timers = [], taps = [], releases = [];
        const ptr = { x: W / 2, y: H * 0.8 };
        const pos = e => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
        const onDown = e => { e.preventDefault(); const [x, y] = pos(e); ptr.x = x; ptr.y = y; if (!over) taps.slice().forEach(f => f(x, y, e)); };
        const onMove = e => { const [x, y] = pos(e); ptr.x = x; ptr.y = y; };
        const onUp = () => { if (!over) releases.slice().forEach(f => f()); };
        stage.addEventListener('pointerdown', onDown);
        stage.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);

        const sprite = (txt, size, hittable) => {
          const e = h('div', 'wa-sp' + (hittable ? ' hit' : ''), txt);
          e.style.fontSize = size + 'px';
          stage.appendChild(e);
          const s = { el: e, x: 0, y: 0,
            set(x, y, extra = '') { s.x = x; s.y = y; e.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) ${extra}`; return s; },
            hit(fn) { e.classList.add('hit'); e.onpointerdown = ev => { ev.stopPropagation(); ev.preventDefault(); if (!over) fn(s); }; return s; } };
          return s;
        };
        const g = {
          W, H, S: Math.min(W, H * 0.9), lv, speed, stage, ptr, realS: dur / 1000 / speed,
          t: () => t, alive: () => !over && !dead,
          win: () => end(true), lose: () => end(false),
          frame: fn => frames.push(fn),
          after: (ms, fn) => timers.push({ at: ms, fn }),
          tap: fn => taps.push(fn), release: fn => releases.push(fn),
          sprite,
          label: (html, cls) => { const s = sprite(html, 16); s.el.className = 'wa-label ' + (cls || ''); s.el.style.fontSize = ''; return s; },
          box: cls => { const b = h('div', cls); stage.appendChild(b); return b; },
          grid(n, top) { // emplacements répartis sous la consigne
            const cols = Math.ceil(Math.sqrt(n * W / (H * (1 - top)))), rows = Math.ceil(n / cols);
            const cw = W / cols, ch = H * (1 - top) / rows;
            const at = shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, n).map(i => ({
              x: cw * (i % cols + 0.5) + rnd(-0.12, 0.12) * cw, y: H * top + ch * (Math.floor(i / cols) + 0.5) + rnd(-0.1, 0.1) * ch }));
            return { at, cell: Math.min(cw, ch) };
          },
          choices(opts, good) {
            const wrap = g.box('wa-choices');
            opts.forEach(v => {
              const b = h('button', 'wa-choice', v);
              b.onpointerdown = e => { e.stopPropagation(); e.preventDefault(); if (!g.alive()) return; if (v === good) { b.classList.add('ok'); g.win(); } else { b.classList.add('ko'); g.lose(); } };
              wrap.appendChild(b);
            });
          },
          burst(x, y) {
            for (let i = 0; i < 10; i++) {
              const p = h('i', 'bt-particle'), a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 50;
              p.style.left = x + 'px'; p.style.top = y + 'px';
              p.style.setProperty('--dx', Math.cos(a) * d + 'px'); p.style.setProperty('--dy', Math.sin(a) * d + 'px');
              p.style.setProperty('--c', pick(['#ffd23f', '#ff5d8f', '#35d0ba', '#fff'])); p.style.setProperty('--s', 6 + Math.random() * 7 + 'px');
              stage.appendChild(p); setTimeout(() => p.remove(), 750);
            }
          },
          miss(x, y) { const m = sprite('✖️', 22).set(x, y); m.el.classList.add('wa-miss'); setTimeout(() => m.el.remove(), 400); },
        };

        function end(ok) {
          if (over) return;
          over = true; result = ok;
          stage.classList.add(ok ? 'wa-win' : 'wa-lose');
          if (ok) sfx('good', 1); else { sfx('bad'); buzz(60); }
          setTimeout(finish, ok ? 420 : 560);
        }
        function finish() {
          cancelAnimationFrame(raf);
          stage.removeEventListener('pointerdown', onDown); stage.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
          resolve(result);
        }
        function step(now) {
          if (dead) return finish();
          const dt = Math.min(50, now - last) * speed; last = now;
          if (!over) {
            t += dt;
            for (const tm of timers) if (!tm.done && t >= tm.at) { tm.done = true; tm.fn(); }
            for (const f of frames) { if (over) break; f(dt / 1000); }
            const left = Math.max(0, 1 - t / dur);
            fuse.style.width = left * 100 + '%';
            fuse.parentElement.classList.toggle('hurry', left < 0.3);
            if (!over && t >= dur) end(!!def.survive);
          }
          raf = requestAnimationFrame(step);
        }

        // Consigne en gros, par-dessus le jeu qui démarre déjà
        const banner = h('div', 'wa-verb', `${def.verb}${def.hint ? `<small>${def.hint}</small>` : ''}`);
        stage.appendChild(banner);
        setTimeout(() => banner.classList.add('out'), Math.max(550, 1000 / speed));
        try { def.mount(g); } catch (e) { console.error('[wario]', def.id, e); result = true; return finish(); }
        raf = requestAnimationFrame(step);
      });
    }

    function nextGame() {
      const pool = GAMES.filter(d => !st.recent.includes(d.id));
      const def = pick(pool.length ? pool : GAMES);
      st.recent = [...st.recent, def.id].slice(-6);
      return def;
    }

    async function loop() {
      // « PRÊT ? » puis 3, 2, 1, GO (synchronisé avec l'hôte)
      let lastShown = '';
      while (!dead && Date.now() < o.startAt) {
        const s = o.startAt - Date.now(), txt = s > 3000 ? 'PRÊT ?' : String(Math.ceil(s / 1000));
        if (txt !== lastShown) { lastShown = txt; screen(`<div class="wa-count">${txt}</div><p>${txt === 'PRÊT ?' ? 'Une consigne, quelques secondes : agis !' : '&nbsp;'}</p>`, 'count'); if (txt !== 'PRÊT ?') sfx('tick'); }
        await wait(80);
      }
      if (dead) return;
      if (st.played === 0) { sfx('go'); screen('<div class="wa-count">GO !</div>', 'count go'); await wait(550); }
      let lastResult = null;
      while (!dead && st.lives > 0 && Date.now() < o.startAt + o.playMs) {
        const lvl = Math.floor(st.played / LEVEL_EVERY), speed = speedOf(lvl);
        st.speed = Math.round(speed * 10); hud();
        // Écran de transition : résultat, vies, numéro du prochain micro-jeu
        const lost = lastResult === false ? st.lives : -1;
        screen(`${lastResult === null ? '' : `<div class="wa-res ${lastResult ? 'ok' : 'ko'}">${lastResult ? pick(['BRAVO !', 'BIEN JOUÉ !', 'OUI !', 'TROP FORT !']) + ' 😎' : pick(['RATÉ !', 'OUPS !', 'AÏE !']) + ' 😵'}</div>`}
          <div class="wa-lives big">${hearts(lost)}</div>
          <div class="wa-count">${st.played + 1}</div>`, 'between');
        await wait(Math.max(600, 1250 / speed));
        if (dead) return;
        if (st.played > 0 && st.played % LEVEL_EVERY === 0 && speed > speedOf(lvl - 1)) {
          sfx('combo', 3);
          screen(`<div class="wa-count speed">⚡ ACCÉLÉRATION !</div><p>Vitesse ${fmtX(speed)}</p>`, 'speedup');
          await wait(1100);
          if (dead) return;
        }
        hide();
        const def = nextGame();
        cur = def.id;
        o.onProgress(stats());
        const ok = await playOne(def, speed, lvl);
        if (dead) return;
        st.played++;
        if (ok) { st.cleared++; st.streak++; st.maxStreak = Math.max(st.maxStreak, st.streak); st.score += Math.round(100 * speed) + Math.min(50, (st.streak - 1) * 10); }
        else { st.failed++; st.lives--; st.streak = 0; }
        lastResult = ok;
        hud(); save(); o.onProgress(stats());
      }
      finish();
    }

    async function finish() {
      if (dead) return;
      const over = st.lives <= 0;
      if (over) { st.lives = 0; hud(); }
      screen(`<div class="wa-count end">${over ? 'GAME OVER' : 'TEMPS ÉCOULÉ !'}</div><div class="wa-lives big">${hearts(-1)}</div>`, 'end');
      sfx('timeUp');
      const res = { ...stats(), type: '', over };
      const rec = updateRecords(res);
      store('sessionStorage', o.key, { finished: true, res, rec });
      o.onEnding(Date.now() + 1500); // laisse le temps d'afficher « GAME OVER » avant les résultats
      o.onFinish(res);
      await wait(1500);
      if (dead) return;
      dead = true;
      results(el, res, rec);
    }

    loop();
    return () => { dead = true; cancelAnimationFrame(raf); };
  }

  // ---------- Écran de fin ----------
  function results(el, res, rec, extra) {
    const t = rate(res), nw = rec ? rec.isNew : {}, best = rec ? rec.best : null;
    const badge = k => (nw[k] && rec && !rec.first ? '<em class="bt-new">NOUVEAU RECORD ! 🏆</em>' : '');
    const anyNew = rec && !rec.first && Object.values(nw).some(Boolean);
    const rank = extra && extra.rank ? `<div class="bt-rank">Tu termines <b>${extra.rank === 1 ? '1er·e' : extra.rank + 'ᵉ'}</b> sur ${extra.total} ${extra.rank === 1 ? '👑' : ''}</div>` : '';
    el.innerHTML = `<div class="bt bt-results wa-results">
      <h1 class="bt-end-title">${res.over === false ? 'TEMPS ÉCOULÉ !' : 'GAME OVER'}</h1>
      <div class="bt-title-badge"><span>${t.icon}</span><b>${t.name}</b></div>
      ${rank}
      <div class="bt-final-score"><small>SCORE</small><b data-countup="${res.score}">0</b>${badge('score')}</div>
      <div class="bt-statgrid">
        <div><span>✅</span><b>${res.cleared}</b><small>micro-jeux réussis</small>${badge('cleared')}</div>
        <div><span>💔</span><b>${res.failed}</b><small>raté${res.failed > 1 ? 's' : ''}</small></div>
        <div><span>⚡</span><b>${fmtX((res.speed || 10) / 10)}</b><small>vitesse max</small>${badge('speed')}</div>
        <div><span>🔥</span><b>${res.maxStreak}</b><small>meilleure série</small>${badge('streak')}</div>
      </div>
      ${best ? `<section class="bt-records">
        <h2>🏅 Mes records${anyNew ? ' <em class="bt-new">NOUVEAU RECORD ! 🏆</em>' : ''}</h2>
        <div><span>Meilleur score</span><b>${fmtN(best.score)}</b></div>
        <div><span>Plus de micro-jeux réussis</span><b>${best.cleared}</b></div>
        <div><span>Vitesse la plus folle</span><b>${fmtX((best.speed || 10) / 10)}</b></div>
        <div><span>Plus longue série</span><b>${best.streak}</b></div>
        <p>${rec.first ? 'Première partie : tes records sont lancés ! 🚀' : `${best.games} parties jouées · Encore une ? 😉`}</p>
      </section>` : ''}
      <div class="bt-wait">${extra && extra.rank ? '' : '⏳ En attente des autres joueurs…<br>'}L'hôte choisit : <b>🔁 Rejouer</b> ou <b>🏠 retour aux mini-jeux</b></div>
    </div>`;
    const out = el.querySelector('[data-countup]'), goal = res.score, t0 = performance.now();
    const step = tt => { const p = Math.min(1, (tt - t0) / 900); out.textContent = fmtN(goal * (1 - (1 - p) ** 3)); if (p < 1 && out.isConnected) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    if (anyNew && !(extra && extra.quiet)) sfx('record');
  }

  // ---------- Point d'entrée appelé par play.html ----------
  // ctx : { me, code, off, done, send(stats), progress(stats) }
  let session = null, seq = 0;
  function render(el, p, ctx) {
    const mine = ++seq;
    if (p.kind === 'wario') {
      const key = `pg-wario:${ctx.code}:${p.n}`;
      if (session && session.key === key && el.querySelector('.wa, .bt')) return; // déjà en cours (ou terminé)
      if (session) session.destroy();
      if (!p.expected.includes(ctx.me)) {
        session = null;
        el.innerHTML = '<div class="bt bt-results"><h1 class="bt-end-title">Warioware</h1><p class="bt-wait">Une partie est en cours… tu joueras à la prochaine ! 🕹️</p></div>';
        return;
      }
      const saved = store('sessionStorage', key);
      const sess = session = { key, destroy: () => {}, endsAt: 0 };
      if (saved && saved.finished) return results(el, saved.res, saved.rec);
      session.destroy = run(el, { key, startAt: p.data.startAt - ctx.off, playMs: p.data.playMs, onProgress: ctx.progress, onFinish: ctx.send, onEnding: t => { sess.endsAt = t; } });
      return;
    }
    if (p.kind === 'warioResults') {
      const later = session ? session.endsAt - Date.now() : 0;
      if (later > 0) return setTimeout(() => { if (mine === seq) render(el, p, ctx); }, later + 30);
      if (session) session.destroy();
      session = null;
      const rows = (p.data && p.data.rows) || [];
      const i = rows.findIndex(r => r.id === ctx.me), row = rows[i];
      const saved = store('sessionStorage', `pg-wario:${ctx.code}:${p.data && p.data.playN}`);
      const res = saved && saved.res ? saved.res : row, rec = saved && saved.rec;
      if (!res) { el.innerHTML = '<div class="bt bt-results"><h1 class="bt-end-title">Terminé !</h1><p class="bt-wait">Regardez l\'écran 👀</p></div>'; return; }
      results(el, res, rec, { rank: i >= 0 ? i + 1 : 0, total: rows.length, quiet: true });
    }
  }

  window.WarioGame = { ...shared, GAMES, render };
})();
