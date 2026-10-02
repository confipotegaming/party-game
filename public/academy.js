// Cérébrale Académie — examen en 5 épreuves chronométrées (une par matière), côté joueur.
// Les métadonnées (épreuves, matières, calendrier, titres, notes) sont partagées avec le serveur (games/academie.js).
(function () {
  'use strict';

  // ---------- Partagé client + serveur ----------
  const CATS = {
    perception: { icon: '👁️', name: 'Perception' },
    analyse: { icon: '🧩', name: 'Analyse' },
    maths: { icon: '🔢', name: 'Maths' },
    memoire: { icon: '🧠', name: 'Mémoire' },
    ident: { icon: '🔎', name: 'Identification' },
  };
  const ORDER = ['perception', 'analyse', 'maths', 'memoire', 'ident'];
  // w : pondération des points (les épreuves lentes rapportent plus par bonne réponse)
  const GAMES = {
    ballons: { cat: 'perception', icon: '🎈', name: 'Ballons', w: 1.5, rule: 'Repère les ballons de la bonne couleur : éclate-les ou compte-les malgré les intrus.' },
    taupes: { cat: 'perception', icon: '🐹', name: 'Taupes', w: 1.2, rule: 'Tape seulement les taupes qui portent l\'accessoire demandé, avant qu\'elles ne se cachent !' },
    pieces: { cat: 'perception', icon: '🪙', name: 'Pièces', w: 1.1, rule: 'Les pièces tournent dans tous les sens : attention à celles qui sont vues dans un miroir !' },
    rails: { cat: 'analyse', icon: '🚂', name: 'Rails', w: 1.4, rule: 'Suis les rails : à chaque traverse, le train change de voie. Où va-t-il arriver ?' },
    bouchetrou: { cat: 'analyse', icon: '🧱', name: 'Bouche-trou', w: 1.2, rule: 'Choisis la pièce qui comble exactement le trou du mur, sans la tourner.' },
    cubes: { cat: 'analyse', icon: '🧊', name: 'Cubes', w: 1.3, rule: 'Compte tous les cubes, même ceux qui sont cachés en dessous !' },
    calcul: { cat: 'maths', icon: '➕', name: 'Calcul', w: 1, rule: 'Trouve vite le résultat des petits calculs.' },
    balance: { cat: 'maths', icon: '⚖️', name: 'Balance', w: 1.5, rule: 'Utilise les indices pour trouver ce qui donne le poids demandé.' },
    compte: { cat: 'maths', icon: '🔢', name: 'Compte', w: 1.1, rule: 'Compte les objets demandés, même quand ils se chevauchent.' },
    allo: { cat: 'memoire', icon: '☎️', name: 'Allô, oui ?', w: 2.2, rule: 'Le téléphone sonne ! Retiens qui appelle, dans quel ordre, et ce que chacun commande.' },
    memo: { cat: 'memoire', icon: '🃏', name: 'Mémo', w: 1.6, rule: 'Mémorise les cartes : retrouve où était un objet, ou celui qui a disparu.' },
    ordre: { cat: 'memoire', icon: '🔢', name: 'Ordre', w: 1.8, rule: 'Retiens l\'ordre d\'apparition des objets puis reproduis-le.' },
    objets: { cat: 'ident', icon: '🧸', name: 'Objets', w: 1, rule: 'Retrouve l\'objet exactement identique au modèle, parmi des sosies.' },
    silhouettes: { cat: 'ident', icon: '👤', name: 'Silhouettes', w: 0.9, rule: 'Qui se cache derrière cette ombre ?' },
    differences: { cat: 'ident', icon: '🔍', name: 'Différences', w: 1.1, rule: 'Les deux tableaux sont presque pareils : touche la case qui change.' },
  };
  const T = { LEAD_MS: 1500, INTRO_MS: 5000, PLAY_MS: 22000 };
  const SLOT_MS = T.INTRO_MS + T.PLAY_MS;
  const EPISODES = ORDER.length;
  const TOTAL_MS = T.LEAD_MS + EPISODES * SLOT_MS;

  // Une épreuve par matière, dans l'ordre de l'examen ; on évite de reprendre celles de la partie précédente.
  function schedule(prev, rnd = Math.random) {
    return ORDER.map(cat => {
      const all = Object.keys(GAMES).filter(id => GAMES[id].cat === cat);
      const fresh = all.filter(id => !(prev || []).includes(id));
      const pool = fresh.length ? fresh : all;
      return pool[Math.floor(rnd() * pool.length)];
    });
  }
  // Où en est l'examen à l'instant t (startAt = début de la 1re présentation d'épreuve)
  function timeline(startAt, t) {
    if (t < startAt) return { stage: 'wait', i: -1, left: startAt - t };
    const k = t - startAt, i = Math.floor(k / SLOT_MS);
    if (i >= EPISODES) return { stage: 'end', i: EPISODES };
    const w = k - i * SLOT_MS;
    return w < T.INTRO_MS ? { stage: 'intro', i, left: T.INTRO_MS - w } : { stage: 'play', i, left: SLOT_MS - w };
  }
  const grams = score => Math.round((score || 0) / 4);
  const TITLES = [
    { min: 2000, icon: '🏛️', name: 'Génie de l\'Académie' },
    { min: 1600, icon: '🦉', name: 'Professeur·e' },
    { min: 1200, icon: '🎓', name: 'Docteur·e' },
    { min: 800, icon: '📜', name: 'Diplômé·e' },
    { min: 400, icon: '📘', name: 'Étudiant·e' },
    { min: 0, icon: '🎒', name: 'Nouvel·le élève' },
  ];
  const rate = r => TITLES.find(t => grams(r.score) >= t.min) || TITLES[TITLES.length - 1];
  const GRADES = [[1900, 'S'], [1450, 'A'], [1000, 'B'], [600, 'C'], [250, 'D'], [0, 'E']];
  const grade = score => GRADES.find(g => (score || 0) >= g[0])[1];
  const accuracy = r => (r.solved + r.errors ? Math.round(100 * r.solved / (r.solved + r.errors)) : 0);
  const shared = { CATS, ORDER, GAMES, T, SLOT_MS, EPISODES, TOTAL_MS, TITLES, schedule, timeline, grams, rate, grade, accuracy };
  if (typeof module === 'object' && module.exports) { module.exports = shared; return; }

  // ---------- Réglages ----------
  const BASE = 100, SPEED_MAX = 50, FEEDBACK_MS = 500, RECORDS_KEY = 'pg-academy-records';

  // ---------- Outils ----------
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (a, n) => shuffle(a).slice(0, n);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (lv, a, b) => a + (b - a) * clamp((lv - 1) / 9, 0, 1); // niveau 1 → a, niveau 10 → b
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const btn = (cls, html) => { const b = h('button', cls, html); b.type = 'button'; return b; };
  const sfx = (name, ...a) => { try { window.partyAudio && window.partyAudio[name] && window.partyAudio[name](...a); } catch (e) { /* son facultatif */ } };
  const ord = k => (k === 1 ? '1er' : k + 'ᵉ');
  const fmtS = ms => (ms / 1000).toFixed(1).replace('.', ',') + ' s';
  const fmtN = n => Math.round(n).toLocaleString('fr-FR');
  const fmtQ = q => `<span>${String(q).replace(/ ([?!:])/g, '&nbsp;$1')}</span>`; // consigne sur un seul bloc, ponctuation insécable
  const store = (kind, key, val) => { try { const s = window[kind]; if (val === undefined) return JSON.parse(s.getItem(key) || 'null'); s.setItem(key, JSON.stringify(val)); } catch (e) { return null; } };

  const ANIMALS = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐸', '🐵', '🐨', '🐯', '🐷', '🐮', '🐻', '🦁', '🐔'];
  const FOOD = ['🍕', '🍔', '🍦', '🥐', '🍣', '🌮', '🍩', '🥗', '🍝', '🧁', '🌭', '🥞'];
  const THINGS = ['⭐', '🌙', '☀️', '❤️', '⚡', '🎈', '🎁', '🔔', '🍀', '💎', '🎵', '🚀', '🌈', '🍩', '🍎', '🍌', '🍇', '🍓', '🍒', '🥕', '🍄', '⚽', '🎲', '🧦'];
  const LOOKALIKE = [['😀', '😃'], ['🐱', '😺'], ['⭐', '🌟'], ['💙', '💜'], ['🌕', '🌝'], ['🍏', '🍎'], ['🐶', '🐕'], ['❤️', '🧡'], ['🌲', '🌳'], ['🙂', '😊'], ['🔷', '🔹'], ['🐟', '🐠'], ['🚗', '🚙'], ['🐭', '🐹'], ['🍊', '🍑']];
  const COLORS = [
    { n: 'ROUGES', c: '#ff4d6d' }, { n: 'BLEUS', c: '#3b8cff' }, { n: 'VERTS', c: '#2fbf5b' },
    { n: 'JAUNES', c: '#ffd23f' }, { n: 'VIOLETS', c: '#9b6bff' }, { n: 'ORANGE', c: '#ff8c2b' },
  ];

  // Emplacements répartis dans une zone (en %)
  function spots(n, jitter = 0.45) {
    const cols = Math.ceil(Math.sqrt(n * 1.6)), rows = Math.ceil(n / cols) + 1;
    return sample(Array.from({ length: cols * rows }, (_, i) => i), n).map(i => ({
      x: 10 + 80 * ((i % cols) + 0.5 + (Math.random() - 0.5) * jitter) / cols,
      y: 12 + 76 * (Math.floor(i / cols) + 0.5 + (Math.random() - 0.5) * jitter) / rows,
    }));
  }
  // Réponses numériques plausibles autour de la bonne
  function near(ans, n, extra = []) {
    const out = new Set([ans]);
    const cands = shuffle([...extra, ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, ans + 3, ans - 3]);
    for (const c of cands) { if (out.size >= n) break; if (c > 0 && Number.isInteger(c)) out.add(c); }
    while (out.size < n) out.add(ans + out.size * 4);
    return shuffle([...out]);
  }
  // Boutons de réponse (la bonne est montrée en cas d'erreur)
  function options(el, list, good, ctx, cls = '', render = esc) {
    const box = h('div', 'bt-choices ' + cls);
    box.style.setProperty('--cols', list.length <= 3 ? list.length : list.length === 4 ? 2 : 3);
    list.forEach((o, i) => {
      const b = btn('bt-choice', render(o));
      b.onclick = () => {
        if (!ctx.alive()) return;
        b.classList.add(i === good ? 'good' : 'bad');
        if (i !== good) box.children[good].classList.add('good');
        ctx.done(i === good, b);
      };
      box.appendChild(b);
    });
    el.appendChild(box);
    return box;
  }
  const numOptions = (el, ans, n, ctx, extra) => { const l = near(ans, n, extra); return options(el, l, l.indexOf(ans), ctx, 'num'); };
  const big = (el, html, cls = '') => el.appendChild(h('div', 'bt-big ' + cls, html));

  // ---------- Pièces de Bouche-trou (polyominos) ----------
  const keyOf = cells => cells.map(c => c.join(',')).join(';');
  function norm(cells) {
    const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
    return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  }
  const has = (cells, x, y) => cells.some(c => c[0] === x && c[1] === y);
  const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function grow(size, maxW) {
    for (;;) {
      const cells = [[0, 0]];
      while (cells.length < size) { const [x, y] = pick(cells), [dx, dy] = pick(NB); if (!has(cells, x + dx, y + dy)) cells.push([x + dx, y + dy]); }
      const n = norm(cells);
      if (Math.max(...n.map(c => c[0])) < maxW && Math.max(...n.map(c => c[1])) < maxW) return n;
    }
  }
  function connected(cells) {
    const seen = [cells[0]], todo = [cells[0]];
    while (todo.length) { const [x, y] = todo.pop(); NB.forEach(([dx, dy]) => { if (has(cells, x + dx, y + dy) && !has(seen, x + dx, y + dy)) { seen.push([x + dx, y + dy]); todo.push([x + dx, y + dy]); } }); }
    return seen.length === cells.length;
  }
  const rot = cells => norm(cells.map(([x, y]) => [y, -x]));
  const mirror = cells => norm(cells.map(([x, y]) => [-x, y]));
  function mutate(cells) {
    for (let k = 0; k < 30; k++) {
      const i = R(0, cells.length - 1), base = cells.filter((_, j) => j !== i);
      if (!connected(base)) continue;
      const [x, y] = pick(base), [dx, dy] = pick(NB);
      if (has(base, x + dx, y + dy) || (x + dx === cells[i][0] && y + dy === cells[i][1])) continue;
      return norm([...base, [x + dx, y + dy]]);
    }
    return null;
  }

  // ---------- Les épreuves ----------
  // make(lv) renvoie { q (consigne), answerMs, manualReady, mount(el, ctx) }
  // ctx.done(ok, élément, message) · ctx.ready() démarre le chrono de réponse · ctx.later(fn, ms) · ctx.setQ(html)
  const GEN = {
    // 👁️ Perception
    ballons: { make(lv) {
      const cols = sample(COLORS, lv < 4 ? 3 : lv < 7 ? 4 : 5), target = cols[0];
      if (Math.random() < 0.5) { // éclater tous les ballons d'une couleur
        const n = Math.round(lerp(lv, 6, 13)), k = R(2, lv < 5 ? 3 : 4);
        const items = shuffle([...Array(k).fill(target), ...Array.from({ length: n - k }, () => pick(cols.slice(1)))]);
        return { q: `Éclate tous les ballons <b style="color:${target.c}">${target.n}</b> !`, answerMs: Math.round(lerp(lv, 7000, 4500)),
          mount(el, ctx) {
            const field = h('div', 'bt-field ca-sky'); let left = k;
            spots(n).forEach((p, i) => {
              const b = btn('ca-balloon'); b.style.left = p.x + '%'; b.style.top = p.y + '%'; b.style.setProperty('--c', items[i].c);
              b.style.animationDelay = (-Math.random() * 2) + 's'; if (lv >= 6) b.style.setProperty('--drift', R(-14, 14) + 'px');
              b.onclick = () => {
                if (!ctx.alive() || b.classList.contains('popped')) return;
                if (items[i] !== target) { b.classList.add('bad'); return ctx.done(false, b, 'Mauvaise couleur !'); }
                b.classList.add('popped'); sfx('note', k - left); left--;
                if (!left) ctx.done(true, b);
              };
              field.appendChild(b);
            });
            el.appendChild(field);
          } };
      }
      const n = Math.round(lerp(lv, 6, 14)), k = R(2, Math.min(n - 2, 3 + Math.floor(lv / 2)));
      const items = shuffle([...Array(k).fill(target), ...Array.from({ length: n - k }, () => pick(cols.slice(1)))]);
      const flight = Math.round(lerp(lv, 3600, 2200)), spread = Math.round(lerp(lv, 2600, 1800));
      return { q: `Combien de ballons <b style="color:${target.c}">${target.n}</b> vont s'envoler ?`, manualReady: true, answerMs: 5500,
        mount(el, ctx) {
          const field = h('div', 'bt-field ca-sky rise');
          items.forEach((c, i) => {
            const b = h('span', 'ca-balloon flying'); b.style.setProperty('--c', c.c);
            b.style.left = R(8, 88) + '%'; b.style.animationDuration = flight + 'ms'; b.style.animationDelay = Math.round(i * spread / n) + 'ms';
            field.appendChild(b);
          });
          el.appendChild(field);
          ctx.later(() => { field.classList.add('gone'); ctx.ready(); ctx.setQ(`Combien de ballons <b style="color:${target.c}">${target.n}</b> ?`); numOptions(el, k, lv < 5 ? 3 : 4, ctx); }, spread + flight - 200);
        } };
    } },
    taupes: { make(lv) {
      const holes = lv < 4 ? 9 : 12, hats = ['🎩', '👑', '🎀', '🧢', '🌸', '⭐', '🕶️'], target = pick(hats);
      const shown = Math.min(holes - 2, Math.round(lerp(lv, 3, 7))), k = clamp(R(1, 1 + Math.floor(lv / 3)), 1, shown - 1);
      const others = sample(hats.filter(x => x !== target), lv < 4 ? 2 : 4);
      const wear = shuffle([...Array(k).fill(target), ...Array.from({ length: shown - k }, () => pick([...others, ''])) ]);
      const at = sample(Array.from({ length: holes }, (_, i) => i), shown), stay = Math.round(lerp(lv, 3200, 1500));
      return { q: `Tape les taupes avec ${target} !`, answerMs: stay,
        mount(el, ctx) {
          const grid = h('div', 'ca-holes'); grid.style.setProperty('--cols', holes === 9 ? 3 : 4); let left = k;
          for (let i = 0; i < holes; i++) {
            const j = at.indexOf(i), b = btn('ca-hole', j < 0 ? '' : `<span class="ca-mole"><i>${wear[j]}</i>🐹</span>`);
            if (j >= 0) {
              ctx.later(() => b.classList.add('up'), 60 + R(0, 160));
              b.onclick = () => {
                if (!ctx.alive() || b.classList.contains('bonk')) return;
                if (wear[j] !== target) { b.classList.add('bad'); return ctx.done(false, b, 'Pas celle-là !'); }
                b.classList.add('bonk', 'good'); sfx('note', k - left); left--;
                if (!left) ctx.done(true, b);
              };
            }
            grid.appendChild(b);
          }
          el.appendChild(grid);
        } };
    } },
    pieces: { make(lv) {
      const glyph = pick(['F', 'G', 'J', 'L', 'P', 'R', 'Q', '4', '7', '2', '?']), n = lv < 4 ? 4 : 6;
      const findMirror = lv >= 3 && Math.random() < 0.5, good = R(0, n - 1);
      const step = lv < 3 ? 90 : lv < 6 ? 45 : 15;
      const turn = () => R(0, Math.floor(359 / step)) * step;
      const coins = Array.from({ length: n }, (_, i) => ({ r: turn(), m: findMirror ? i === good : i !== good }));
      const coin = c => `<span class="ca-coin"><b style="transform:rotate(${c.r}deg) scaleX(${c.m ? -1 : 1})">${glyph}</b></span>`;
      return { q: findMirror ? 'Quelle pièce est vue <b>dans un miroir</b> ?' : 'Quelle pièce est <b>identique</b> au modèle (juste tournée) ?', answerMs: Math.round(lerp(lv, 9000, 6000)),
        mount(el, ctx) {
          el.appendChild(h('div', 'ca-model', `<small>Modèle</small>${coin({ r: 0, m: false })}`));
          options(el, coins, good, ctx, 'ca-coins', coin);
        } };
    } },

    // 🧩 Analyse
    rails: { make(lv) {
      const k = lv < 3 ? 3 : lv < 6 ? 4 : 5, rows = Math.round(lerp(lv, 3, 10));
      const rungs = []; for (let r = 0; r < rows; r++) { let c; do { c = R(0, k - 2); } while (rungs.length && c === rungs[r - 1] && k > 2 && Math.random() < 0.7); rungs.push(c); }
      const trace = s => { let c = s; const pts = [[c, 0]]; rungs.forEach((g, r) => { if (g === c || g === c - 1) { pts.push([c, r + 1]); c = g === c ? c + 1 : c - 1; pts.push([c, r + 1]); } }); pts.push([c, rows + 1]); return { end: c, pts }; };
      const stations = sample(['🏠', '🏰', '⛪', '🏭', '🏡', '🏟️', '🗼'], k), trains = sample(['🚂', '🚌', '🚒', '🚜', '🚕', '🚑'], k);
      const reverse = lv >= 4 && Math.random() < 0.45, start = R(0, k - 1), res = trace(start);
      const dest = res.end, wanted = reverse ? trains.findIndex((_, s) => trace(s).end === dest) : dest;
      return { q: reverse ? `Quel véhicule arrive à ${stations[dest]} ?` : `Où va arriver ${trains[start]} ?`, answerMs: Math.round(lerp(lv, 9000, 8000)),
        mount(el, ctx) {
          const W = k * 20, H = (rows + 1) * 10, x = c => c * 20 + 10, y = r => r * 10;
          const svg = `<svg class="ca-rails" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
            ${Array.from({ length: k }, (_, c) => `<line x1="${x(c)}" y1="0" x2="${x(c)}" y2="${H}" class="rail"/><line x1="${x(c)}" y1="0" x2="${x(c)}" y2="${H}" class="ties"/>`).join('')}
            ${rungs.map((g, r) => `<line x1="${x(g)}" y1="${y(r + 1)}" x2="${x(g + 1)}" y2="${y(r + 1)}" class="rail"/><line x1="${x(g)}" y1="${y(r + 1)}" x2="${x(g + 1)}" y2="${y(r + 1)}" class="ties"/>`).join('')}
            <polyline class="path" points="${res.pts.map(([c, r]) => `${x(c)},${y(r)}`).join(' ')}"/></svg>`;
          const row = (list, pickable, mark) => {
            const r = h('div', 'ca-rail-row'); r.style.setProperty('--k', k);
            list.forEach((e, i) => {
              const b = btn('ca-rail-stop' + (i === mark ? ' start' : ''), e);
              if (pickable) b.onclick = () => {
                if (!ctx.alive()) return;
                b.classList.add(i === wanted ? 'good' : 'bad'); r.children[wanted].classList.add('good');
                wrap.classList.add('show'); ctx.done(i === wanted, b);
              };
              else b.tabIndex = -1;
              r.appendChild(b);
            });
            return r;
          };
          const wrap = h('div', 'ca-rail-wrap');
          wrap.appendChild(row(trains, reverse, reverse ? -1 : start));
          wrap.appendChild(h('div', 'ca-rail-net', svg));
          wrap.appendChild(row(stations, !reverse, reverse ? dest : -1));
          el.appendChild(wrap);
        } };
    } },
    bouchetrou: { make(lv) {
      const W = lv < 4 ? 4 : 5, size = lv < 3 ? 3 : lv < 6 ? 4 : 5, piece = grow(size, W), n = lv < 4 ? 3 : 4;
      const ox = R(0, W - 1 - Math.max(...piece.map(c => c[0]))), oy = R(0, W - 1 - Math.max(...piece.map(c => c[1])));
      const seen = new Set([keyOf(piece)]), alts = [];
      const add = c => { if (c && alts.length < n - 1 && !seen.has(keyOf(c))) { seen.add(keyOf(c)); alts.push(c); } };
      const variants = shuffle([rot(piece), rot(rot(piece)), rot(rot(rot(piece))), mirror(piece), rot(mirror(piece))]);
      if (lv < 3) { for (let i = 0; i < 20; i++) add(mutate(piece)); variants.forEach(add); } else { variants.forEach(add); for (let i = 0; i < 20; i++) add(mutate(piece)); }
      for (let i = 0; i < 40 && alts.length < n - 1; i++) add(grow(size, W));
      const list = shuffle([piece, ...alts]), good = list.indexOf(piece);
      const draw = cells => { const w = Math.max(...cells.map(c => c[0])) + 1, hh = Math.max(...cells.map(c => c[1])) + 1; return `<span class="ca-piece" style="--w:${w};--h:${hh}">${Array.from({ length: w * hh }, (_, i) => `<i class="${has(cells, i % w, Math.floor(i / w)) ? 'on' : ''}"></i>`).join('')}</span>`; };
      return { q: 'Quelle pièce bouche exactement le trou ?<small>Sans la tourner ni la retourner</small>', answerMs: Math.round(lerp(lv, 9000, 7000)),
        mount(el, ctx) {
          const wall = h('div', 'ca-wall'); wall.style.setProperty('--w', W);
          for (let i = 0; i < W * W; i++) wall.appendChild(h('i', has(piece, i % W - ox, Math.floor(i / W) - oy) ? 'hole' : ''));
          el.appendChild(wall);
          options(el, list, good, ctx, 'ca-shapes', draw);
        } };
    } },
    cubes: { make(lv) {
      const gx = lv < 3 ? 2 : 3, gy = lv < 5 ? 2 : 3, maxH = lv < 3 ? 2 : lv < 7 ? 3 : 4;
      let hm, total;
      do {
        hm = Array.from({ length: gx }, () => Array(gy).fill(0));
        for (let s = 0; s <= gx + gy - 2; s++) for (let x = 0; x < gx; x++) { const y = s - x; if (y < 0 || y >= gy) continue;
          const lim = Math.min(x ? hm[x - 1][y] : maxH, y ? hm[x][y - 1] : maxH); hm[x][y] = x + y === 0 ? R(Math.max(1, maxH - 1), maxH) : R(Math.max(0, lim - 2), lim); }
        total = hm.flat().reduce((a, b) => a + b, 0);
      } while (total < 3);
      const hue = R(0, 359);
      return { q: 'Combien y a-t-il de cubes ?<small>Les cubes cachés comptent aussi</small>', answerMs: Math.round(lerp(lv, 9000, 7500)),
        mount(el, ctx) {
          const P = (x, y, z) => [(x - y) * 17.3, (x + y) * 10 - z * 20];
          const poly = (pts, cls, fill) => `<polygon points="${pts.map(p => p.join(',')).join(' ')}" class="${cls}"${fill ? ` fill="${fill}"` : ''}/>`;
          let out = '', all = [];
          for (let x = 0; x < gx; x++) for (let y = 0; y < gy; y++) { const f = [P(x, y, 0), P(x + 1, y, 0), P(x + 1, y + 1, 0), P(x, y + 1, 0)]; all.push(...f); out += poly(f, 'floor'); }
          const cubes = []; for (let x = 0; x < gx; x++) for (let y = 0; y < gy; y++) for (let z = 0; z < hm[x][y]; z++) cubes.push([x, y, z]);
          cubes.sort((a, b) => a[0] + a[1] - b[0] - b[1] || a[2] - b[2]).forEach(([x, y, z]) => {
            const top = [P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)];
            all.push(...top);
            out += poly([P(x + 1, y, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x + 1, y, z + 1)], 'cube', `hsl(${hue} 70% 52%)`);
            out += poly([P(x, y + 1, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], 'cube', `hsl(${hue} 60% 40%)`);
            out += poly(top, 'cube', `hsl(${hue} 90% 74%)`);
          });
          const xs = all.map(p => p[0]), ys = all.map(p => p[1]), m = 4;
          const vb = [Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) - Math.min(...xs) + 2 * m, Math.max(...ys) - Math.min(...ys) + 2 * m];
          el.appendChild(h('div', 'ca-cubes', `<svg viewBox="${vb.join(' ')}">${out}</svg>`));
          numOptions(el, total, lv < 5 ? 3 : 4, ctx, [total + gx, total - 1]);
        } };
    } },

    // 🔢 Maths
    calcul: { make(lv) {
      const m = Math.round(lerp(lv, 10, 60)), kind = pick(lv < 3 ? ['+', '−'] : lv < 6 ? ['+', '−', '×'] : ['+', '−', '×', '÷', '?']);
      let text, ans, extra = [];
      if (kind === '+') { const a = R(1, m), b = R(1, m); text = `${a} + ${b}`; ans = a + b; extra = [ans + 10, ans - 10]; }
      else if (kind === '−') { const a = R(3, m + 5), b = R(1, a - 1); text = `${a} − ${b}`; ans = a - b; extra = [a + b - a, ans + 10]; }
      else if (kind === '×') { const a = R(2, lv < 8 ? 9 : 12), b = R(2, 9); text = `${a} × ${b}`; ans = a * b; extra = [a * (b + 1), (a - 1) * b]; }
      else if (kind === '÷') { const b = R(2, 9), ans0 = R(2, 10); text = `${b * ans0} ÷ ${b}`; ans = ans0; extra = [ans + b]; }
      else { const a = R(2, 30), b = R(2, 30); text = `${a} + ? = ${a + b}`; ans = b; extra = [a]; }
      return { q: 'Calcule vite !', answerMs: Math.round(lerp(lv, 8000, 5000)),
        mount(el, ctx) { big(el, `${text}${kind === '?' ? '' : ' = ?'}`); numOptions(el, ans, lv < 4 ? 3 : 4, ctx, extra); } };
    } },
    balance: { make(lv) {
      const objs = sample(['🍎', '🍐', '🍉', '🍍', '🥥', '🍋', '🧀', '🎃', '🥔'], 3);
      const combo = (list, total, avoid, tries = 400) => {
        for (let t = 0; t < tries; t++) {
          const c = Array.from({ length: R(1, 4) }, () => R(0, list.length - 1)).sort();
          const s = c.reduce((a, i) => a + list[i], 0), key = c.join();
          if ((total == null || s === total) && !avoid.has(key)) return { c, s, key };
        }
        return null;
      };
      const show = c => c.c.map(i => objs[i]).join('');
      const pan = (l, r, cls = '') => `<div class="ca-scale ${cls}"><span class="pan">${l}</span><span class="beam">⚖️</span><span class="pan">${r}</span></div>`;
      let clues, ask, w;
      if (lv < 5 || Math.random() < 0.35) { // poids affichés
        w = [R(1, 3), R(2, 5), R(3, 9)];
        let goal; do { goal = combo(w, null, new Set()); } while (goal.c.length < 2);
        clues = `<div class="ca-weights">${objs.map((o, i) => `<span>${o}<b>${w[i]} kg</b></span>`).join('')}</div>`;
        ask = { q: `Quel plateau pèse <b>${goal.s} kg</b> ?`, total: goal.s, good: goal };
      } else { // relations entre objets (en unités du plus léger)
        const a = R(2, 3), b = lv >= 8 ? a + R(1, 2) : R(a + 1, 5);
        w = [1, a, b];
        const rel = lv >= 8 ? pan(objs[2], objs[1] + objs[0].repeat(b - a)) : pan(objs[2], objs[0].repeat(b));
        clues = pan(objs[1], objs[0].repeat(a), 'small') + rel.replace('ca-scale ', 'ca-scale small ');
        const left = { c: lv >= 7 ? [1, 2] : [2], s: lv >= 7 ? a + b : b };
        ask = { q: `Que faut-il mettre pour équilibrer ${left.c.map(i => objs[i]).join('')} ?`, total: left.s, avoid: left.c.join() };
        ask.good = combo(w, left.s, new Set([ask.avoid]));
        if (!ask.good) ask.good = { c: Array(left.s > 4 ? 4 : left.s).fill(0), s: left.s }; // de secours
        ask.good.s = ask.good.c.reduce((s, i) => s + w[i], 0);
        ask.total = ask.good.s;
      }
      const used = new Set([ask.good.key || ask.good.c.join()]), list = [ask.good];
      for (let t = 0; t < 300 && list.length < (lv < 4 ? 3 : 4); t++) {
        const c = combo(w, null, used, 1);
        if (c && c.s !== ask.total && Math.abs(c.s - ask.total) <= 3) { used.add(c.key); list.push(c); }
      }
      for (let t = 0; t < 300 && list.length < 3; t++) { const c = combo(w, null, used, 1); if (c && c.s !== ask.total) { used.add(c.key); list.push(c); } }
      const order = shuffle(list);
      return { q: ask.q, answerMs: Math.round(lerp(lv, 11000, 9000)),
        mount(el, ctx) { el.appendChild(h('div', 'ca-clues', clues)); options(el, order, order.indexOf(ask.good), ctx, 'ca-combos', show); } };
    } },
    compte: { make(lv) {
      const pair = lv >= 5 && Math.random() < 0.5 ? shuffle(pick(LOOKALIKE.filter(p => p[0] !== '🕐'))) : sample(THINGS, 2);
      const target = pair[0], k = R(3, 5 + Math.floor(lv / 2)), d = R(2, 3 + lv);
      const pool = [pair[1], ...sample(THINGS.filter(x => x !== target), lv < 4 ? 1 : 2)];
      const items = shuffle([...Array(k).fill(target), ...Array.from({ length: d }, () => pick(pool))]);
      return { q: `Combien y a-t-il de ${target} ?`, answerMs: Math.round(lerp(lv, 7500, 5500)),
        mount(el, ctx) {
          const field = h('div', 'bt-field small ca-pile');
          const pos = lv >= 6 ? items.map(() => ({ x: R(10, 90), y: R(12, 88) })) : spots(items.length);
          pos.forEach((p, i) => {
            const s = h('span', 'bt-thing' + (lv >= 8 ? ' ca-drift' : ''), items[i]);
            s.style.left = p.x + '%'; s.style.top = p.y + '%'; s.style.setProperty('--r', R(-35, 35) + 'deg');
            s.style.fontSize = lerp(lv, 2.3, 1.6) * (0.8 + Math.random() * 0.5) + 'rem'; s.style.animationDelay = (-Math.random() * 3) + 's';
            field.appendChild(s);
          });
          el.appendChild(field);
          numOptions(el, k, lv < 5 ? 3 : 4, ctx);
        } };
    } },

    // 🧠 Mémoire
    allo: { make(lv) {
      const n = lv < 3 ? 3 : lv < 6 ? 4 : 5, who = sample(ANIMALS, n), what = sample(FOOD, n), each = Math.round(lerp(lv, 1700, 1100));
      const kind = pick(lv < 3 ? ['what', 'who'] : lv < 6 ? ['what', 'who', 'rank'] : ['what', 'who', 'rank', 'before']);
      let q, list, ans;
      if (kind === 'what') { const i = R(0, n - 1); q = `Qu'a commandé ${who[i]} ?`; list = shuffle([...what, ...sample(FOOD.filter(f => !what.includes(f)), 1)]).slice(0, Math.min(6, n + 1)); if (!list.includes(what[i])) list[0] = what[i]; ans = what[i]; }
      else if (kind === 'who') { const i = R(0, n - 1); q = `Qui a commandé ${what[i]} ?`; list = shuffle(who.slice()); ans = who[i]; }
      else if (kind === 'rank') { const i = R(0, n - 1); q = `Qui a appelé en ${ord(i + 1)} ?`; list = shuffle(who.slice()); ans = who[i]; }
      else { const i = R(1, n - 1); q = `Qui a appelé juste avant ${who[i]} ?`; list = shuffle(who.filter((_, j) => j !== i)); ans = who[i - 1]; }
      list = shuffle(list);
      return { q: '☎️ Dring ! Écoute bien…', manualReady: true, answerMs: 7000,
        mount(el, ctx) {
          const phone = h('div', 'ca-phone', '<div class="ca-call"><span class="who">☎️</span><span class="bubble">…</span></div><div class="bt-dots"></div>');
          const dots = phone.querySelector('.bt-dots'); dots.innerHTML = who.map(() => '<i></i>').join('');
          el.appendChild(phone);
          const call = phone.querySelector('.ca-call');
          who.forEach((a, i) => ctx.later(() => {
            call.innerHTML = `<span class="who">${a}</span><span class="bubble">Je voudrais ${what[i]} !</span>`;
            call.classList.remove('ring'); void call.offsetWidth; call.classList.add('ring'); dots.children[i].classList.add('on'); sfx('note', i);
            ctx.setQ(`☎️ Appel n°${i + 1}`);
          }, 300 + i * each));
          ctx.later(() => { phone.remove(); ctx.ready(); ctx.setQ(q); options(el, list, list.indexOf(ans), ctx, 'emoji'); }, 300 + n * each);
        } };
    } },
    memo: { make(lv) {
      const n = lv < 3 ? 4 : lv < 6 ? 6 : 9, items = sample(THINGS, n), k = R(0, n - 1), gone = lv >= 2 && Math.random() < 0.45;
      const showMs = Math.round(900 + n * lerp(lv, 420, 260)), cols = n === 4 ? 2 : 3;
      return { q: 'Mémorise bien les cartes…', manualReady: true, answerMs: Math.round(lerp(lv, 7000, 5000)),
        mount(el, ctx) {
          const grid = h('div', 'bt-grid-tap ca-memogrid'); grid.style.setProperty('--cols', cols);
          const cards = items.map(e => { const c = btn('bt-card-mini', `<span>${e}</span>`); grid.appendChild(c); return c; });
          el.appendChild(grid);
          const bar = h('div', 'bt-memo-bar', '<i></i>'); el.appendChild(bar); bar.firstChild.style.animationDuration = showMs + 'ms';
          ctx.later(() => {
            bar.remove(); cards.forEach(c => c.classList.add('hidden'));
            if (gone) {
              ctx.setQ('Attention…');
              ctx.later(() => {
                cards.forEach((c, i) => { c.classList.remove('hidden'); if (i === k) { c.classList.add('empty'); c.innerHTML = '<span>❔</span>'; } c.tabIndex = -1; });
                ctx.ready(); ctx.setQ('Quel objet a disparu ?');
                const list = shuffle([items[k], ...sample(THINGS.filter(x => !items.includes(x)), lv < 5 ? 2 : 3)]);
                options(el, list, list.indexOf(items[k]), ctx, 'emoji');
              }, 700);
            } else {
              ctx.ready(); ctx.setQ(`Où était ${items[k]} ?`);
              cards.forEach((c, i) => c.onclick = () => {
                if (!ctx.alive()) return;
                cards[k].classList.remove('hidden'); cards[k].classList.add('good');
                if (i !== k) { c.classList.remove('hidden'); c.classList.add('bad'); }
                ctx.done(i === k, c);
              });
            }
          }, showMs);
        } };
    } },
    ordre: { make(lv) {
      const len = clamp(3 + Math.floor((lv - 1) / 2), 3, 7), items = sample(THINGS, len), back = lv >= 6 && Math.random() < 0.4;
      const each = Math.round(lerp(lv, 900, 600)), extra = lv >= 4 ? sample(THINGS.filter(x => !items.includes(x)), lv < 7 ? 1 : 2) : [];
      return { q: `Retiens l'ordre des ${len} objets…`, manualReady: true, answerMs: 2500 + len * 1100,
        mount(el, ctx) {
          const flash = btn('bt-flash'); flash.tabIndex = -1; el.appendChild(flash);
          const dots = h('div', 'bt-dots', items.map(() => '<i></i>').join('')); el.appendChild(dots);
          items.forEach((e, i) => ctx.later(() => { flash.innerHTML = `<span>${e}</span>`; flash.classList.remove('pop'); void flash.offsetWidth; flash.classList.add('pop'); sfx('note', i); ctx.later(() => { flash.innerHTML = ''; }, each - 150); }, 350 + i * each));
          ctx.later(() => {
            flash.remove(); ctx.ready(); ctx.setQ(back ? 'Touche-les dans l\'ordre <b>INVERSE</b> !' : 'Touche-les dans le bon ordre !');
            const want = back ? items.slice().reverse() : items;
            const grid = h('div', 'bt-grid-tap'); const all = shuffle([...items, ...extra]);
            grid.style.setProperty('--cols', all.length <= 4 ? all.length : all.length <= 6 ? 3 : 4); grid.style.setProperty('--fs', '2.3rem');
            let at = 0;
            all.forEach(e => {
              const b = btn('bt-tap', e);
              b.onclick = () => {
                if (!ctx.alive() || b.classList.contains('good')) return;
                if (e !== want[at]) { b.classList.add('bad'); return ctx.done(false, b, 'Mauvais ordre !'); }
                b.classList.add('good'); b.dataset.n = at + 1; dots.children[at++].classList.add('on'); sfx('note', at);
                if (at === want.length) ctx.done(true, b);
              };
              grid.appendChild(b);
            });
            el.insertBefore(grid, dots);
          }, 350 + len * each);
        } };
    } },

    // 🔎 Identification
    objets: { make(lv) {
      const n = lv < 3 ? 4 : lv < 6 ? 6 : 9, bgs = ['#ffd23f', '#7ff0c9', '#a8e6ff', '#ffb3d9', '#d9c7ff', '#ffcf8f'], badges = ['⭐', '❤️', '🎀', '⚡', '🌸', '💧'];
      const look = lv >= 6 ? pick(LOOKALIKE) : null, emos = look ? look : sample(['🧸', '🎈', '🚗', '🐱', '⚽', '🎁', '🦆', '🎸', '🌵'], 3);
      const model = { e: emos[0], bg: pick(bgs), b: lv >= 3 ? pick(badges) : '', r: 0 };
      const attrs = ['e', 'bg', ...(lv >= 3 ? ['b'] : []), ...(lv >= 8 ? ['r'] : [])];
      const vals = { e: emos, bg: bgs, b: badges, r: [0, 90, 180] }, key = o => [o.e, o.bg, o.b, o.r].join('|');
      const seen = new Set([key(model)]), list = [model];
      for (let t = 0; t < 200 && list.length < n; t++) {
        const o = { ...model }, change = lv < 4 ? sample(attrs, R(1, 2)) : [pick(attrs)];
        change.forEach(a => { o[a] = pick(vals[a].filter(v => v !== model[a])); });
        if (!seen.has(key(o))) { seen.add(key(o)); list.push(o); }
      }
      const order = shuffle(list), draw = o => `<span class="ca-obj" style="--bg:${o.bg}"><span style="transform:rotate(${o.r}deg)">${o.e}</span>${o.b ? `<i>${o.b}</i>` : ''}</span>`;
      return { q: 'Trouve l\'objet <b>identique</b> au modèle !', answerMs: Math.round(lerp(lv, 7000, 5000)),
        mount(el, ctx) { el.appendChild(h('div', 'ca-model', `<small>Modèle</small>${draw(model)}`)); options(el, order, order.indexOf(model), ctx, 'ca-objs', draw); } };
    } },
    silhouettes: { make(lv) {
      const fams = [['🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐷', '🐮', '🐸', '🐵'], ['🍎', '🍐', '🍊', '🍋', '🍑', '🍒', '🍓', '🍇', '🍌'], ['🚗', '🚕', '🚙', '🚌', '🚓', '🚑', '🚒', '🚜'], ['🐢', '🐊', '🦎', '🐍', '🦖', '🦕'], ['⚽', '🏀', '🏈', '🎾', '🏐', '🎱'], ['🦆', '🐔', '🦉', '🦅', '🐧', '🦜', '🕊️']];
      const n = lv < 4 ? 3 : lv < 7 ? 4 : 6, fam = lv < 3 ? fams.flat() : pick(fams), list = sample(fam, n), good = R(0, n - 1);
      const reverse = lv >= 3 && Math.random() < 0.4, turn = lv >= 7 ? pick([0, 90, 180, 270, 45]) : 0;
      const shade = e => `<span class="ca-shadow" style="transform:rotate(${turn}deg)">${e}</span>`;
      return { q: reverse ? `Quelle est l'ombre de ${list[good]} ?` : 'Qui se cache derrière cette ombre ?', answerMs: Math.round(lerp(lv, 6000, 4500)),
        mount(el, ctx) {
          el.appendChild(h('div', 'ca-model ca-spot', reverse ? `<span class="ca-lit">${list[good]}</span>` : shade(list[good])));
          options(el, list, good, ctx, 'emoji ca-sil', reverse ? shade : esc);
        } };
    } },
    differences: { make(lv) {
      const n = lv < 3 ? 6 : lv < 6 ? 9 : 12, cols = n === 6 ? 3 : n === 9 ? 3 : 4, d = R(0, n - 1);
      const mode = lv < 3 ? 'other' : lv < 6 ? pick(['other', 'turn', 'look']) : pick(['turn', 'look', 'look']);
      let pair = mode === 'look' ? shuffle(pick(LOOKALIKE)) : null;
      const pool = sample(['🐱', '🐶', '🦊', '🐼', '🚗', '🚀', '🎸', '🌵', '🍄', '🦆', '🐌', '🍕', '🎈', '🍉', '🐢', '🦒'], n);
      const A = pool.slice(), B = pool.slice(); let turnB = '';
      if (pair) { A[d] = pair[0]; B[d] = pair[1]; } else if (mode === 'turn') turnB = pick(['rotate(90deg)', 'rotate(180deg)', 'rotate(-90deg)']);
      else B[d] = pick(['🍩', '⚽', '🎁', '🔔', '🍀'].filter(x => !pool.includes(x)));
      return { q: 'Touche la case qui change !', answerMs: Math.round(lerp(lv, 8000, 6000)),
        mount(el, ctx) {
          const wrap = h('div', 'ca-diff'), grids = [A, B].map((set, g) => {
            const grid = h('div', 'bt-grid-tap'); grid.style.setProperty('--cols', cols); grid.style.setProperty('--fs', lerp(lv, 2.2, 1.7) + 'rem');
            set.forEach((e, i) => {
              const b = btn('bt-tap', `<span style="display:inline-block${g && i === d && turnB ? `;transform:${turnB}` : ''}">${e}</span>`);
              b.onclick = () => {
                if (!ctx.alive()) return;
                grids.forEach(gr => gr.children[d].classList.add('good'));
                if (i !== d) b.classList.add('bad');
                ctx.done(i === d, b);
              };
              grid.appendChild(b);
            });
            wrap.appendChild(grid); return grid;
          });
          el.appendChild(wrap);
        } };
    } },
  };

  // ---------- Records personnels ----------
  function updateRecords(res) {
    const prev = store('localStorage', RECORDS_KEY) || { score: 0, games: 0, best: {} };
    const best = { ...(prev.best || {}) }, isNew = { score: res.score > prev.score, eps: {} };
    (res.eps || []).forEach(e => { if (e.score > (best[e.id] || 0)) { if (best[e.id] != null) isNew.eps[e.id] = true; best[e.id] = e.score; } });
    const next = { score: Math.max(prev.score, res.score), games: (prev.games || 0) + 1, best };
    store('localStorage', RECORDS_KEY, next);
    return { prev, best: next, isNew, first: !prev.games };
  }

  // ---------- Partie en cours ----------
  let session = null;

  function run(el, o) {
    const saved = store('sessionStorage', o.key);
    const st = saved && !saved.finished ? saved : { score: 0, solved: 0, errors: 0, times: [], eps: o.plan.map(id => ({ id, score: 0, solved: 0, errors: 0, lv: 1 })) };
    const now = () => Date.now();
    let mode = '', cur = null, tok = 0, timers = [], finished = false, overlayTok = 0, lastCount = '', lastSec = null;

    el.innerHTML = `<div class="bt ca">
      <div class="bt-hud">
        <div class="bt-stat"><small>SCORE</small><b data-score>0</b></div>
        <div class="bt-stat bt-time"><small>TEMPS</small><b data-time>${T.PLAY_MS / 1000}</b></div>
        <div class="bt-stat"><small>ÉPREUVE</small><b data-ep>1/${EPISODES}</b></div>
      </div>
      <div class="bt-timebar"><i data-timebar></i></div>
      <div data-main></div>
      <div class="bt-fx" data-fx></div>
      <div class="bt-overlay" data-overlay></div>
    </div>`;
    const $ = k => el.querySelector(`[data-${k}]`);
    const main = $('main'), fx = $('fx'), overlay = $('overlay');
    const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
    const save = () => store('sessionStorage', o.key, st);
    const stats = i => ({
      score: st.score, solved: st.solved, errors: st.errors, ep: i, game: o.plan[clamp(i, 0, EPISODES - 1)] || '',
      avgMs: st.times.length ? Math.round(st.times.reduce((a, b) => a + b, 0) / st.times.length) : 0,
      eps: st.eps.map(({ id, score, solved, errors }) => ({ id, score, solved, errors })),
    });
    const hud = () => { $('score').textContent = fmtN(st.score); };
    const show = (html, cls, ms) => {
      const t = ++overlayTok;
      overlay.className = 'bt-overlay on ' + (cls || ''); overlay.innerHTML = `<div>${html}</div>`;
      if (ms) setTimeout(() => { if (t === overlayTok) overlay.className = 'bt-overlay'; }, ms);
    };
    const hide = () => { overlayTok++; overlay.className = 'bt-overlay'; };
    const float = (html, cls, x, y) => { const f = h('div', 'bt-float ' + (cls || ''), html); f.style.left = x + 'px'; f.style.top = y + 'px'; fx.appendChild(f); setTimeout(() => f.remove(), 1100); };
    const burst = (x, y, n = 14) => {
      for (let i = 0; i < n; i++) {
        const p = h('i', 'bt-particle'), a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 70;
        p.style.left = x + 'px'; p.style.top = y + 'px';
        p.style.setProperty('--dx', Math.cos(a) * d + 'px'); p.style.setProperty('--dy', Math.sin(a) * d + 'px');
        p.style.setProperty('--c', pick(['#ffd23f', '#ff5d8f', '#35d0ba', '#8f72ff', '#fff'])); p.style.setProperty('--s', 6 + Math.random() * 8 + 'px');
        if (Math.random() < 0.25) { p.textContent = pick(['✨', '🎓', '⭐']); p.className = 'bt-particle star'; }
        fx.appendChild(p); setTimeout(() => p.remove(), 800);
      }
    };
    const origin = src => {
      const box = el.querySelector('.bt').getBoundingClientRect(), r = (src && src.isConnected ? src : main).getBoundingClientRect();
      return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2];
    };

    // Présentation d'une épreuve (avec le bilan de la précédente)
    function intro(i) {
      clearTimers(); cur = null; hide();
      const g = GAMES[o.plan[i]], c = CATS[g.cat], p = i ? st.eps[i - 1] : null, pg = p && GAMES[p.id];
      $('ep').textContent = `${i + 1}/${EPISODES}`;
      $('time').textContent = T.PLAY_MS / 1000; $('timebar').style.width = '100%';
      el.querySelector('.bt-time').classList.remove('hurry');
      main.innerHTML = `<section class="bt-card ca-intro in" data-cat="${g.cat}">
        ${p ? `<div class="ca-recap"><span>${pg.icon} ${esc(pg.name)}</span><b class="ca-grade g-${grade(p.score)}">${grade(p.score)}</b><span>✅ ${p.solved} · +${fmtN(p.score)}</span></div>` : '<div class="ca-recap first">🎓 L\'examen commence !</div>'}
        <div class="ca-steps">${o.plan.map((id, j) => `<span class="${j < i ? 'done' : j === i ? 'on' : ''}">${GAMES[id].icon}</span>`).join('')}</div>
        <span class="bt-cat ca-catchip">${c.icon} ${c.name} · Épreuve ${i + 1}/${EPISODES}</span>
        <div class="ca-intro-icon">${g.icon}</div>
        <h2 class="ca-intro-name">${esc(g.name)}</h2>
        <p class="ca-intro-rule">${esc(g.rule)}</p>
        <div class="ca-intro-count" data-count></div>
      </section>`;
      sfx(i ? 'good' : 'go');
    }

    function play(i) {
      clearTimers();
      $('ep').textContent = `${i + 1}/${EPISODES}`;
      main.innerHTML = `<section class="bt-card" data-card>
        <div class="bt-meta"><span class="bt-cat" data-cat></span><span class="bt-num" data-num></span></div>
        <div class="bt-q" data-q></div>
        <div class="bt-stage" data-stage></div>
        <div class="bt-cbar"><i data-cbar></i></div>
      </section>`;
      next(i);
    }

    function next(i) {
      if (finished) return;
      clearTimers();
      const ep = st.eps[i], id = o.plan[i], g = GAMES[id], token = ++tok;
      let c; try { c = GEN[id].make(clamp(ep.lv, 1, 10)); } catch (e) { console.error('[academie]', id, e); c = GEN.calcul.make(clamp(ep.lv, 1, 10)); }
      cur = { c, i, token, mountAt: now(), readyAt: 0, resolved: false };
      const card = $('card'), stage = $('stage');
      $('cat').textContent = `${g.icon} ${g.name}`; $('cat').dataset.cat = g.cat;
      $('num').textContent = `Niveau ${Math.floor(ep.lv)}`;
      $('q').innerHTML = fmtQ(c.q); $('cbar').style.width = '100%';
      card.className = 'bt-card in ca-cat-' + g.cat;
      stage.innerHTML = ''; stage.className = 'bt-stage ca-' + id;
      const alive = () => !finished && cur && cur.token === token && !cur.resolved;
      const ctx = {
        alive,
        ready: () => { if (cur && cur.token === token && !cur.readyAt) cur.readyAt = now(); },
        done: (ok, src, msg) => { if (alive()) resolve(ok, src, msg); },
        later: (fn, ms) => timers.push(setTimeout(() => { if (alive()) fn(); }, ms)),
        setQ: html => { if (alive()) $('q').innerHTML = fmtQ(html); },
      };
      try { c.mount(stage, ctx); } catch (e) { console.error('[academie]', id, e); cur = null; return timers.push(setTimeout(() => next(i), 50)); }
      if (!c.manualReady) ctx.ready();
    }

    function resolve(ok, src, msg) {
      const { c, i } = cur, ep = st.eps[i], t = now(), rt = t - (cur.readyAt || cur.mountAt), g = GAMES[ep.id];
      cur.resolved = true;
      st.times.push(Math.min(rt, c.answerMs));
      const [x, y] = origin(src), card = $('card');
      if (ok) {
        const speed = Math.round(SPEED_MAX * clamp(1 - rt / c.answerMs, 0, 1)), pts = Math.round(g.w * (BASE + speed + 10 * (Math.floor(ep.lv) - 1)));
        st.score += pts; st.solved++; ep.score += pts; ep.solved++;
        ep.lv = Math.min(10, ep.lv + (rt < c.answerMs * 0.5 ? 1 : 0.6));
        card.classList.add('ok');
        float(`+${pts}<small>${speed >= 30 ? '⚡ rapide !' : 'bravo !'}</small>`, 'good', x, y);
        burst(x, y); sfx('good', 1 + Math.floor(ep.lv / 3));
      } else {
        st.errors++; ep.errors++; ep.lv = Math.max(1, ep.lv - 1);
        card.classList.add('ko');
        float(`${esc(msg || 'Raté !')}`, 'bad', x, y);
        sfx('bad');
        if (navigator.vibrate) try { navigator.vibrate(80); } catch (e) { /* facultatif */ }
      }
      hud(); save(); o.onProgress(stats(i));
      const token = cur.token;
      timers.push(setTimeout(() => { if (!finished && cur && cur.token === token && mode === 'play' + i) next(i); }, ok ? FEEDBACK_MS : FEEDBACK_MS + 1100)); // une erreur fait perdre du temps : répondre au hasard ne paie pas
    }

    function finish() {
      finished = true;
      clearInterval(loop); clearTimers();
      const res = stats(EPISODES); delete res.ep; delete res.game;
      const rec = updateRecords(res);
      st.finished = true; st.res = res; st.rec = rec; save();
      session.finished = true;
      $('time').textContent = '0'; $('timebar').style.width = '0%';
      show('FIN DE L\'EXAMEN !<small>🎓 Correction des copies…</small>', 'end');
      sfx('timeUp');
      o.onFinish(res);
      setTimeout(() => { if (session && session.key === o.key) results(el, res, rec); }, 1800);
    }

    function tick() {
      const t = now(), tl = timeline(o.startAt, t);
      if (tl.stage === 'end') return finish();
      if (tl.stage === 'wait') {
        if (mode !== 'wait') { mode = 'wait'; main.innerHTML = '<section class="bt-card ca-intro in"><div class="ca-intro-icon">🏛️</div><h2 class="ca-intro-name">Cérébrale Académie</h2><p class="ca-intro-rule">5 épreuves · 5 matières · Prépare tes neurones !</p></section>'; }
        return;
      }
      const m = tl.stage + tl.i;
      if (m !== mode) {
        if (mode.startsWith('play')) { o.onProgress(stats(tl.i)); save(); }
        mode = m;
        if (tl.stage === 'intro') intro(tl.i);
        else { show('GO !', 'go', 600); sfx('go'); play(tl.i); }
      }
      if (tl.stage === 'intro') {
        const s = Math.ceil(tl.left / 1000), lab = s <= 3 ? String(s) : '';
        if (lab !== lastCount) { lastCount = lab; const c = $('count'); if (c) { c.textContent = lab; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); } if (lab) sfx('tick'); }
        return;
      }
      lastCount = '';
      const sec = Math.ceil(tl.left / 1000);
      $('time').textContent = sec;
      $('timebar').style.width = (100 * tl.left / T.PLAY_MS) + '%';
      el.querySelector('.bt-time').classList.toggle('hurry', tl.left < 5000);
      if (sec !== lastSec) { if (sec <= 3 && lastSec !== null) sfx('tick'); lastSec = sec; }
      if (cur && cur.readyAt && !cur.resolved) {
        const p = (t - cur.readyAt) / cur.c.answerMs, bar = $('cbar');
        if (bar) { bar.style.width = Math.max(0, 100 * (1 - p)) + '%'; bar.classList.toggle('low', p > 0.7); }
        if (p >= 1) resolve(false, null, 'Trop lent !');
      }
    }

    hud();
    const loop = setInterval(tick, 50);
    tick();
    return () => { finished = true; clearInterval(loop); clearTimers(); };
  }

  // ---------- Écran de fin : le diplôme ----------
  function results(el, res, rec, extra) {
    const t = rate(res), acc = accuracy(res), g = grams(res.score), nw = rec ? rec.isNew : { eps: {} }, best = rec ? rec.best : null;
    const fresh = rec && !rec.first;
    const rank = extra && extra.rank ? `<div class="bt-rank">Tu termines <b>${extra.rank === 1 ? '1er·e' : extra.rank + 'ᵉ'}</b> sur ${extra.total} ${extra.rank === 1 ? '👑' : ''}</div>` : '';
    el.innerHTML = `<div class="bt bt-results ca">
      <h1 class="bt-end-title">🎓 DIPLÔME</h1>
      <div class="bt-title-badge"><span>${t.icon}</span><b>${esc(t.name)}</b></div>
      ${rank}
      <div class="bt-final-score ca-brain"><small>MASSE CÉRÉBRALE</small><b><span data-countup="${g}">0</span> g</b><span class="ca-pts">${fmtN(res.score)} points</span>${fresh && nw.score ? '<em class="bt-new">NOUVEAU RECORD ! 🏆</em>' : ''}</div>
      <section class="ca-bulletin"><h2>📋 Bulletin</h2>${(res.eps || []).map(e => { const gm = GAMES[e.id] || { icon: '❔', name: e.id, cat: '' }; return `<div><span>${gm.icon} ${esc(gm.name)}<small>${CATS[gm.cat] ? CATS[gm.cat].name : ''} · ✅ ${e.solved} ❌ ${e.errors}${fresh && nw.eps[e.id] ? ' · <em class="bt-new">record !</em>' : ''}</small></span><b class="ca-grade g-${grade(e.score)}">${grade(e.score)}</b><strong>${fmtN(e.score)}</strong></div>`; }).join('')}</section>
      <div class="bt-statgrid">
        <div><span>✅</span><b>${res.solved}</b><small>réussites</small></div>
        <div><span>❌</span><b>${res.errors}</b><small>erreur${res.errors > 1 ? 's' : ''}</small></div>
        <div><span>🎯</span><b>${acc} %</b><small>précision</small></div>
        <div><span>⏱️</span><b>${res.avgMs ? fmtS(res.avgMs) : '—'}</b><small>temps moyen</small></div>
      </div>
      ${best ? `<section class="bt-records"><h2>🏅 Mes records</h2>
        <div><span>Meilleure masse cérébrale</span><b>${fmtN(grams(best.score))} g</b></div>
        <p>${rec.first ? 'Première rentrée à l\'Académie : tes records sont lancés ! 🚀' : `${best.games} examens passés · Tu peux sûrement faire mieux 😉`}</p></section>` : ''}
      <div class="bt-wait">${extra && extra.rank ? '' : '⏳ Correction des autres copies…<br>'}L'hôte choisit : <b>🔁 Rejouer</b> ou <b>🏠 retour aux mini-jeux</b></div>
    </div>`;
    const out = el.querySelector('[data-countup]'), goal = g, t0 = performance.now();
    const step = tt => { const p = Math.min(1, (tt - t0) / 1000); out.textContent = fmtN(goal * (1 - (1 - p) ** 3)); if (p < 1 && out.isConnected) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    if (fresh && (nw.score || Object.keys(nw.eps).length) && !(extra && extra.quiet)) sfx('record');
  }

  // ---------- Point d'entrée appelé par play.html ----------
  // ctx : { me, code, off, send(stats), progress(stats) }
  function render(el, p, ctx) {
    if (p.kind === 'academy') {
      const key = `pg-academy:${ctx.code}:${p.n}`;
      if (session && session.key === key && el.querySelector('.ca')) return;
      if (session) session.destroy();
      if (!p.expected.includes(ctx.me)) {
        session = null;
        el.innerHTML = '<div class="bt bt-results ca"><h1 class="bt-end-title">🏛️ Académie</h1><p class="bt-wait">Un examen est en cours… tu passeras le prochain ! 🎓</p></div>';
        return;
      }
      const saved = store('sessionStorage', key);
      session = { key, destroy: () => {}, finished: false };
      if (saved && saved.finished) { session.finished = true; return results(el, saved.res, saved.rec); }
      session.destroy = run(el, { key, plan: p.data.plan, startAt: p.data.startAt - ctx.off, onProgress: ctx.progress, onFinish: ctx.send });
      return;
    }
    if (p.kind === 'academyResults') {
      if (session) session.destroy();
      session = null;
      const rows = (p.data && p.data.rows) || [], i = rows.findIndex(r => r.id === ctx.me);
      const saved = store('sessionStorage', `pg-academy:${ctx.code}:${p.data && p.data.playN}`);
      const res = saved && saved.res ? saved.res : rows[i], rec = saved && saved.rec;
      if (!res) { el.innerHTML = '<div class="bt bt-results ca"><h1 class="bt-end-title">Fin de l\'examen !</h1><p class="bt-wait">Regardez l\'écran 👀</p></div>'; return; }
      results(el, res, rec, { rank: i >= 0 ? i + 1 : 0, total: rows.length, quiet: true });
    }
  }

  window.AcademyGame = { ...shared, GEN, render };
})();
