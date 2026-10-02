// Cerveau Turbo — moteur des mini-défis côté joueur.
// Le barème des titres (rate/accuracy) est partagé avec le serveur (games/cerveau.js).
(function () {
  'use strict';

  // ---------- Titres de fin de partie (partagés client + serveur) ----------
  const TITLES = [
    { min: 8000, acc: 85, icon: '🏆', name: 'Maître des réflexes' },
    { min: 5000, acc: 75, icon: '🧠', name: 'Génie' },
    { min: 2800, acc: 0, icon: '⚡', name: 'Éclair' },
    { min: 1200, acc: 0, icon: '⭐', name: 'Rapide' },
    { min: 0, acc: 0, icon: '🌱', name: 'Débutant' },
  ];
  const accuracy = r => (r.solved + r.errors ? Math.round(100 * r.solved / (r.solved + r.errors)) : 0);
  const rate = r => TITLES.find(t => (r.score || 0) >= t.min && accuracy(r) >= t.acc) || TITLES[TITLES.length - 1];
  const CATS = {
    calc: { icon: '🧮', name: 'Calcul' }, logic: { icon: '🧩', name: 'Logique' }, memory: { icon: '🧠', name: 'Mémoire' },
    reflex: { icon: '⚡', name: 'Réflexe' }, speed: { icon: '🔢', name: 'Rapidité' },
  };
  const shared = { TITLES, CATS, accuracy, rate };
  if (typeof module === 'object' && module.exports) { module.exports = shared; return; }

  // ---------- Réglages ----------
  const BASE = 100, SPEED_MAX = 50, HARD_BONUS = 30, PENALTY_MS = 2000, FEEDBACK_MS = 430;
  const mult = combo => Math.min(5, 1 + Math.floor(combo / 3)); // ×2 à 3 bonnes réponses d'affilée, ×3 à 6…
  const RECORDS_KEY = 'pg-brain-records';

  // ---------- Outils ----------
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (a, n) => shuffle(a).slice(0, n);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (lv, a, b) => a + (b - a) * clamp((lv - 1) / 9, 0, 1); // niveau 1 → a, niveau 10 → b
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const sfx = (name, ...a) => { try { window.partyAudio && window.partyAudio[name] && window.partyAudio[name](...a); } catch (e) { /* son facultatif */ } };
  const ord = k => (k === 1 ? '1er' : k + 'ᵉ');
  const fmtS = ms => (ms / 1000).toFixed(1).replace('.', ',') + ' s';
  const fmtN = n => Math.round(n).toLocaleString('fr-FR');
  const store = (kind, key, val) => { try { const s = window[kind]; if (val === undefined) return JSON.parse(s.getItem(key) || 'null'); s.setItem(key, JSON.stringify(val)); } catch (e) { return null; } };

  const FRUITS = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍑', '🍍', '🥝', '🍋', '🍉', '🥕', '🍄'];
  const ANIMALS = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐸', '🐵', '🐨', '🐯', '🦄', '🐷', '🐮', '🐙', '🐧'];
  const THINGS = ['⭐', '🌙', '☀️', '❤️', '⚡', '🎈', '🎁', '🔔', '🍀', '💎', '🎵', '🚀', '🌈', '🍩'];
  const ALL = [...FRUITS, ...ANIMALS, ...THINGS];
  const LOOKALIKE = [['😀', '😃'], ['🐱', '😺'], ['⭐', '🌟'], ['💙', '💜'], ['🕐', '🕑'], ['🌕', '🌝'], ['🍏', '🍎'], ['🐶', '🐕'], ['❤️', '🧡'], ['🌲', '🌳'], ['🙂', '😊'], ['🔷', '🔹']];
  const SHAPES = ['🔺', '🟦', '🟢', '⭐', '💜', '🔶'];
  const COLORS = [
    { n: 'ROUGE', c: '#ff4d6d' }, { n: 'BLEU', c: '#3b8cff' }, { n: 'VERT', c: '#2fbf5b' },
    { n: 'JAUNE', c: '#ffd23f' }, { n: 'VIOLET', c: '#9b6bff' }, { n: 'ORANGE', c: '#ff8c2b' },
  ];

  // Mélange des emplacements dans une zone (positions en %, sans trop de chevauchement).
  function spots(n) {
    const cols = Math.ceil(Math.sqrt(n * 1.6)), rows = Math.ceil(n / cols) + 1;
    return sample(Array.from({ length: cols * rows }, (_, i) => i), n).map(i => ({
      x: 10 + 80 * ((i % cols) + 0.5 + (Math.random() - 0.5) * 0.45) / cols, // marge de 10 % pour rester dans le cadre
      y: 12 + 76 * (Math.floor(i / cols) + 0.5 + (Math.random() - 0.5) * 0.4) / rows,
    }));
  }

  // Réponses numériques proches de la bonne (erreurs plausibles).
  function near(ans, n, extra = []) {
    const out = new Set([ans]);
    const cands = shuffle([...extra, ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, ans + 3, ans - 3, ans + 5, ans - 5]);
    for (const c of cands) { if (out.size >= n) break; if (c >= 0 && Number.isInteger(c)) out.add(c); }
    while (out.size < n) out.add(ans + out.size * 4);
    return shuffle([...out]);
  }

  // Boutons de réponse : la bonne réponse est montrée en cas d'erreur.
  function choices(el, opts, good, ctx, cls = '') {
    const box = h('div', 'bt-choices ' + cls);
    box.style.setProperty('--cols', opts.length <= 3 ? opts.length : opts.length === 4 ? 2 : 3);
    opts.forEach(o => {
      const b = h('button', 'bt-choice', esc(o));
      b.type = 'button';
      b.onclick = () => {
        if (!ctx.alive()) return;
        const ok = o === good;
        b.classList.add(ok ? 'good' : 'bad');
        if (!ok) box.querySelectorAll('.bt-choice').forEach(x => { if (x.textContent === String(good)) x.classList.add('good'); });
        ctx.done(ok, b);
      };
      box.appendChild(b);
    });
    el.appendChild(box);
    return box;
  }
  const big = (el, html, cls = '') => el.appendChild(h('div', 'bt-big ' + cls, html));
  const numQ = (cat, type, lv, q, text, ans, extra, more = {}) => ({
    cat, type, q, answerMs: Math.round(lerp(lv, 9000, 4500)), ...more,
    mount(el, ctx) { big(el, text); choices(el, near(ans, 3 + Math.floor((lv - 1) / 3), extra), ans, ctx, 'num'); },
  });

  // ---------- Les défis ----------
  // Chaque générateur reçoit le niveau (1 à 10) et renvoie :
  //  { cat, type, q (consigne), answerMs (temps de réponse), hard, manualReady, mount(el, ctx) }
  //  ctx.done(ok, élément) termine le défi · ctx.ready() démarre le chrono de réponse · ctx.later(fn, ms)
  const GEN = {
    add: { cat: 'calc', make(lv) {
      const m = [5, 9, 12, 20, 30, 45, 60, 80, 99, 99][Math.floor(lv) - 1];
      const a = R(1, m), b = R(1, m);
      return numQ('calc', 'add', lv, 'Calcule vite !', `${a} + ${b} = ?`, a + b, [a + b + 10, a + b - 10]);
    } },
    sub: { cat: 'calc', make(lv) {
      const m = [9, 12, 15, 20, 30, 45, 60, 80, 99, 99][Math.floor(lv) - 1];
      const a = R(3, m), b = R(1, a - 1);
      return numQ('calc', 'sub', lv, 'Calcule vite !', `${a} − ${b} = ?`, a - b, [a + b, a - b + 10]);
    } },
    mul: { cat: 'calc', make(lv) {
      const [a, b] = lv < 3 ? [pick([2, 3, 5, 10]), R(1, 5)] : lv < 6 ? [R(2, 9), R(2, 9)] : [R(3, 12), R(3, 12)];
      return numQ('calc', 'mul', lv, 'Calcule vite !', `${a} × ${b} = ?`, a * b, [a * (b + 1), (a + 1) * b, a * (b - 1), a + b]);
    } },
    missing: { cat: 'calc', min: 3, make(lv) {
      const k = R(0, lv >= 5 ? 2 : 1);
      if (k === 0) { const a = R(1, 9 + lv * 3), b = R(1, 9 + lv * 3); return numQ('calc', 'missing', lv, 'Trouve le nombre manquant', `? + ${b} = ${a + b}`, a, [a + b]); }
      if (k === 1) { const a = R(2, 9 + lv * 3), b = R(1, a); return numQ('calc', 'missing', lv, 'Trouve le nombre manquant', `${a} − ? = ${a - b}`, b, [a]); }
      const a = R(2, 9), b = R(2, 9); return numQ('calc', 'missing', lv, 'Trouve le nombre manquant', `${a} × ? = ${a * b}`, b, [a, b + a]);
    } },
    chain: { cat: 'calc', min: 5, make(lv) {
      let text, ans;
      if (Math.random() < 0.5) { const a = R(2, 9), b = R(2, 9), c = R(1, 15); text = `${a} × ${b} + ${c}`; ans = a * b + c; }
      else { const a = R(5, 30), b = R(2, 20), c = R(1, a + b - 1); text = `${a} + ${b} − ${c}`; ans = a + b - c; }
      return numQ('calc', 'chain', lv, 'Calcul en chaîne !', `${text} = ?`, ans, [], { hard: true, answerMs: Math.round(lerp(lv, 11000, 7000)) });
    } },

    sequence: { cat: 'logic', make(lv) {
      let seq, ans;
      const r = Math.random();
      if (lv < 3 || r < 0.3) { const s = R(1, 10), d = R(1, lv < 3 ? 3 : 6) * (lv >= 4 && Math.random() < 0.4 ? -1 : 1), st = d < 0 ? s + 20 : s; seq = [0, 1, 2, 3].map(i => st + d * i); ans = st + d * 4; }
      else if (lv < 6 || r < 0.55) { const s = R(1, 4), q = pick([2, 3]); seq = [0, 1, 2, 3].map(i => s * q ** i); ans = s * q ** 4; if (ans > 400) { seq = [0, 1, 2, 3].map(i => s * 2 ** i); ans = s * 16; } }
      else if (r < 0.75) { const s = R(1, 9), a = R(1, 4), b = R(5, 9); seq = [s]; for (let i = 0; i < 3; i++) seq.push(seq[i] + (i % 2 ? b : a)); ans = seq[3] + b; }
      else { const a = R(1, 4), b = R(1, 5); seq = [a, b]; while (seq.length < 5) seq.push(seq[seq.length - 1] + seq[seq.length - 2]); ans = seq.pop(); }
      return numQ('logic', 'sequence', lv, 'Suite logique : quel nombre vient ensuite ?', `${seq.join(' → ')} → ?`, ans, [], { hard: lv >= 6, answerMs: Math.round(lerp(lv, 11000, 6500)) });
    } },
    odd: { cat: 'logic', make(lv) {
      const n = lv < 3 ? 5 : lv < 5 ? 9 : lv < 8 ? 12 : 16;
      const pair = lv >= 4 && Math.random() < (lv - 2) / 8 ? shuffle(pick(LOOKALIKE)) : sample(ALL, 2);
      const at = R(0, n - 1);
      return { cat: 'logic', type: 'odd', q: 'Touche le symbole différent !', hard: pair[0] !== pair[1] && LOOKALIKE.some(p => p.includes(pair[0]) && p.includes(pair[1])), answerMs: Math.round(lerp(lv, 7000, 4500)),
        mount(el, ctx) {
          const grid = h('div', 'bt-grid-tap');
          grid.style.setProperty('--cols', n <= 5 ? n : n <= 9 ? 3 : 4);
          grid.style.setProperty('--fs', lerp(lv, 2.8, 1.7) + 'rem');
          for (let i = 0; i < n; i++) {
            const b = h('button', 'bt-tap', i === at ? pair[1] : pair[0]); b.type = 'button';
            b.onclick = () => { if (!ctx.alive()) return; b.classList.add(i === at ? 'good' : 'bad'); if (i !== at) grid.children[at].classList.add('good'); ctx.done(i === at, b); };
            grid.appendChild(b);
          }
          el.appendChild(grid);
        } };
    } },
    least: { cat: 'logic', make(lv) {
      const k = lv < 4 ? 2 : lv < 7 ? 3 : 4, few = Math.random() < 0.6 || lv < 3;
      const [pool, word] = pick([[ANIMALS, 'animal'], [FRUITS, 'fruit'], [THINGS, 'symbole']]);
      const types = sample(pool, k), base = R(1, lv < 5 ? 2 : 3);
      const counts = types.map((_, i) => (i === 0 ? base : base + R(1, lv < 5 ? 3 : 1) + (i > 1 ? R(0, 1) : 0)));
      if (!few) { const top = Math.max(...counts); counts[0] = top + R(1, lv < 5 ? 2 : 1); }
      const items = shuffle(types.flatMap((t, i) => Array(counts[i]).fill(t)));
      return { cat: 'logic', type: 'least', q: `Quel ${word} apparaît le ${few ? 'moins' : 'plus'} ?`, answerMs: Math.round(lerp(lv, 8000, 5500)), hard: k >= 4,
        mount(el, ctx) {
          big(el, items.join(' '), 'bt-emoji-line');
          el.lastChild.style.fontSize = lerp(lv, 2.4, 1.6) + 'rem';
          choices(el, shuffle(types), types[0], ctx, 'emoji');
        } };
    } },
    pattern: { cat: 'logic', make(lv) {
      const L = lv < 3 ? 2 : lv < 6 ? pick([2, 3]) : pick([3, 4]);
      const pool = sample(SHAPES, Math.max(L, 3));
      let unit; do { unit = Array.from({ length: L }, () => pick(pool)); } while (new Set(unit).size < 2);
      const len = R(2 * L, 2 * L + L - 1), seq = Array.from({ length: len }, (_, i) => unit[i % L]), ans = unit[len % L];
      const opts = shuffle([ans, ...sample(SHAPES.filter(s => s !== ans), lv < 4 ? 2 : 3)]);
      return { cat: 'logic', type: 'pattern', q: 'Quelle forme vient ensuite ?', hard: L >= 4, answerMs: Math.round(lerp(lv, 9000, 5500)),
        mount(el, ctx) {
          big(el, seq.join(' ') + ' <span class="bt-qmark">?</span>', 'bt-emoji-line');
          el.lastChild.style.fontSize = lerp(lv, 2.4, 1.6) + 'rem';
          choices(el, opts, ans, ctx, 'emoji');
        } };
    } },

    memo: { cat: 'memory', make(lv) {
      const n = lv < 3 ? 3 : lv < 5 ? 4 : lv < 8 ? 5 : 6, items = sample(ALL, n), k = R(0, n - 1);
      const where = lv >= 4 && Math.random() < 0.45, showMs = Math.round(900 + n * lerp(lv, 520, 330));
      return { cat: 'memory', type: 'memo', manualReady: true, hard: n >= 6, answerMs: Math.round(lerp(lv, 7000, 4500)),
        q: 'Mémorise bien ces symboles…',
        mount(el, ctx) {
          const row = h('div', 'bt-cards');
          row.style.setProperty('--n', n);
          const cards = items.map(e => { const c = h('button', 'bt-card-mini', `<span>${e}</span>`); c.type = 'button'; row.appendChild(c); return c; });
          el.appendChild(row);
          const bar = h('div', 'bt-memo-bar', '<i></i>'); el.appendChild(bar);
          bar.firstChild.style.animationDuration = showMs + 'ms';
          ctx.later(() => {
            bar.remove();
            cards.forEach(c => c.classList.add('hidden'));
            ctx.ready();
            if (where) {
              ctx.setQ(`Où était ${items[k]} ?`);
              cards.forEach((c, i) => c.onclick = () => {
                if (!ctx.alive()) return;
                cards[k].classList.remove('hidden'); cards[k].classList.add('good');
                if (i !== k) { c.classList.remove('hidden'); c.classList.add('bad'); }
                ctx.done(i === k, c);
              });
            } else {
              ctx.setQ(`Quel était le ${ord(k + 1)} symbole ?`);
              cards[k].classList.add('ask');
              const opts = [items[k], ...sample(items.filter((_, i) => i !== k), Math.min(n - 1, 3)), ...sample(ALL.filter(x => !items.includes(x)), lv < 5 ? 1 : 2)];
              choices(el, shuffle(opts), items[k], ctx, 'emoji');
            }
          }, showMs);
        } };
    } },
    shell: { cat: 'memory', make(lv) {
      const n = lv < 4 ? 3 : lv < 7 ? 4 : 5, swaps = Math.round(lerp(lv, 3, 9)), swapMs = Math.round(lerp(lv, 520, 260)), target = R(0, n - 1);
      const prize = pick(['⭐', '💎', '🍀', '🐱', '🍩', '🎁']);
      return { cat: 'memory', type: 'shell', manualReady: true, hard: swaps >= 7, answerMs: 4500,
        q: `Suis la carte ${prize} !`,
        mount(el, ctx) {
          const zone = h('div', 'bt-shell');
          zone.style.setProperty('--n', n);
          zone.style.setProperty('--swap', swapMs + 'ms');
          const slot = Array.from({ length: n }, (_, i) => i);
          const cards = slot.map(i => {
            const c = h('button', 'bt-shell-card', `<span class="face">${i === target ? prize : '·'}</span><span class="back">?</span>`);
            c.type = 'button'; c.style.setProperty('--i', i); zone.appendChild(c); return c;
          });
          el.appendChild(zone);
          cards[target].classList.add('open');
          const doSwap = left => {
            if (!left) {
              ctx.ready(); ctx.setQ(`Où est la carte ${prize} ?`); zone.classList.add('pickable');
              cards.forEach((c, i) => c.onclick = () => {
                if (!ctx.alive()) return;
                cards[target].classList.add('open', 'good'); if (i !== target) c.classList.add('bad');
                ctx.done(i === target, c);
              });
              return;
            }
            const [a, b] = sample(slot, 2), ca = cards.findIndex((_, i) => slot[i] === a), cb = cards.findIndex((_, i) => slot[i] === b);
            slot[ca] = b; slot[cb] = a;
            cards[ca].style.setProperty('--i', b); cards[cb].style.setProperty('--i', a);
            cards[ca].classList.add('lift'); cards[cb].classList.add('sink');
            ctx.later(() => { cards[ca].classList.remove('lift'); cards[cb].classList.remove('sink'); ctx.later(() => doSwap(left - 1), 40); }, swapMs);
          };
          ctx.later(() => { cards[target].classList.remove('open'); ctx.setQ('Les cartes se mélangent…'); ctx.later(() => doSwap(swaps), 450); }, 1100);
        } };
    } },
    simon: { cat: 'memory', make(lv) {
      const pads = COLORS.slice(0, lv >= 7 ? 6 : 4), len = 3 + Math.floor((lv - 1) / 2);
      const seq = Array.from({ length: len }, () => R(0, pads.length - 1)), lit = Math.round(lerp(lv, 520, 300));
      return { cat: 'memory', type: 'simon', manualReady: true, hard: len >= 6, answerMs: 2200 + len * 900,
        q: `Regarde la séquence de ${len} couleurs…`,
        mount(el, ctx) {
          const box = h('div', 'bt-simon');
          box.style.setProperty('--cols', pads.length === 4 ? 2 : 3);
          const els = pads.map(p => { const b = h('button', 'bt-pad'); b.type = 'button'; b.style.setProperty('--c', p.c); b.setAttribute('aria-label', p.n); box.appendChild(b); return b; });
          const dots = h('div', 'bt-dots', seq.map(() => '<i></i>').join(''));
          el.appendChild(box); el.appendChild(dots);
          const flash = (i, ms) => { els[i].classList.add('lit'); ctx.later(() => els[i].classList.remove('lit'), ms); };
          seq.forEach((p, i) => ctx.later(() => { flash(p, lit); sfx('note', p); }, 500 + i * (lit + 170)));
          ctx.later(() => {
            ctx.ready(); ctx.setQ('À toi ! Reproduis la séquence'); box.classList.add('pickable');
            let at = 0;
            els.forEach((b, i) => b.onclick = () => {
              if (!ctx.alive()) return;
              flash(i, 160); sfx('note', i);
              if (i !== seq[at]) { b.classList.add('bad'); return ctx.done(false, b); }
              dots.children[at++].classList.add('on');
              if (at === seq.length) ctx.done(true, b);
            });
          }, 500 + len * (lit + 170));
        } };
    } },

    colorTap: { cat: 'reflex', make(lv) {
      const n = Math.round(lerp(lv, 3, 10)), target = pick(COLORS), stroop = lv >= 5 && Math.random() < 0.5;
      const others = COLORS.filter(c => c !== target), ink = stroop ? pick(others) : target;
      const items = shuffle([target, ...Array.from({ length: n - 1 }, () => pick(others))]);
      return { cat: 'reflex', type: 'colorTap', hard: stroop, answerMs: Math.round(lerp(lv, 4000, 2200)),
        q: `<span class="bt-shout" style="color:${ink.c}">CLIQUE SUR LE ${target.n} !</span>${stroop ? '<small>La couleur du texte ne compte pas 😈</small>' : ''}`,
        mount(el, ctx) {
          const field = h('div', 'bt-field'), size = lerp(lv, 74, 42);
          spots(n).forEach((p, i) => {
            const b = h('button', 'bt-dot'); b.type = 'button';
            Object.assign(b.style, { left: p.x + '%', top: p.y + '%', width: size + 'px', height: size + 'px', background: items[i].c, animationDelay: i * 25 + 'ms' });
            b.onclick = () => { if (!ctx.alive()) return; const ok = items[i] === target; b.classList.add(ok ? 'good' : 'bad'); ctx.done(ok, b); };
            field.appendChild(b);
          });
          el.appendChild(field);
        } };
    } },
    green: { cat: 'reflex', make(lv) {
      const wait = R(1100, 2900), win = Math.round(lerp(lv, 1100, 600)), fake = lv >= 4 && Math.random() < 0.55;
      return { cat: 'reflex', type: 'green', manualReady: true, answerMs: win, hard: fake,
        q: 'Touche dès que le rond devient <b style="color:#2fbf5b">VERT</b> !',
        mount(el, ctx) {
          const b = h('button', 'bt-light wait', 'Attends…'); b.type = 'button';
          el.appendChild(b);
          let green = false, decoy = false;
          b.onclick = () => {
            if (!ctx.alive()) return;
            if (green) { b.classList.add('good'); return ctx.done(true, b); }
            b.classList.add('bad'); b.textContent = decoy ? 'Pas le orange !' : 'Trop tôt !';
            ctx.done(false, b, decoy ? 'Ce n\'était pas vert !' : 'Trop tôt !');
          };
          if (fake) ctx.later(() => { decoy = true; b.className = 'bt-light decoy'; b.textContent = 'Hmm…'; ctx.later(() => { decoy = false; b.className = 'bt-light wait'; b.textContent = 'Attends…'; }, 520); }, Math.round(wait * 0.45));
          ctx.later(() => { green = true; b.className = 'bt-light go'; b.textContent = 'CLIQUE !'; ctx.ready(); }, wait);
        } };
    } },
    starOnly: { cat: 'reflex', make(lv) {
      const every = Math.round(lerp(lv, 950, 480)), before = R(2, 3 + Math.floor(lv / 3)), tricky = lv >= 4;
      const decoys = tricky ? ['🌟', '💫', '✨', '🌙', '☀️', '🔶'] : ['🍎', '🐱', '🌙', '🎈', '🍀', '💎', '🔔'];
      const seq = [...Array.from({ length: before }, () => pick(decoys)), '⭐'];
      return { cat: 'reflex', type: 'starOnly', manualReady: true, hard: tricky, answerMs: every + 250,
        q: 'Touche uniquement quand tu vois <b>⭐</b> !',
        mount(el, ctx) {
          const b = h('button', 'bt-flash', ''); b.type = 'button';
          el.appendChild(b);
          let cur = '';
          b.onclick = () => {
            if (!ctx.alive() || !cur) return;
            const ok = cur === '⭐'; b.classList.add(ok ? 'good' : 'bad');
            ctx.done(ok, b, ok ? '' : `Ce n'était pas ⭐ !`);
          };
          seq.forEach((e, i) => ctx.later(() => {
            cur = e; b.innerHTML = `<span>${e}</span>`; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
            if (e === '⭐') { ctx.ready(); ctx.later(() => ctx.done(false, b, 'Raté !'), every + 250); }
            else ctx.later(() => { if (cur === e) { cur = ''; b.innerHTML = ''; } }, every - 120);
          }, 350 + i * every));
        } };
    } },

    compare: { cat: 'speed', make(lv) {
      const n = lv < 4 ? 3 : lv < 7 ? 4 : 5, small = lv >= 5 && Math.random() < 0.4, max = Math.round(lerp(lv, 10, 999));
      const nums = new Set(); while (nums.size < n) nums.add(R(1, max));
      let vals = [...nums], labels = vals.map(String);
      if (lv >= 7 && Math.random() < 0.5) { // mélange de calculs et de nombres
        vals = []; labels = [];
        while (vals.length < n) { const a = R(2, 12), b = R(2, 12), op = pick(['+', '×']), v = op === '+' ? a + b : a * b; if (!vals.includes(v)) { vals.push(v); labels.push(`${a} ${op} ${b}`); } }
      }
      const best = vals.indexOf(small ? Math.min(...vals) : Math.max(...vals));
      return { cat: 'speed', type: 'compare', hard: labels[0].includes(' '), answerMs: Math.round(lerp(lv, 5000, labels[0].includes(' ') ? 6000 : 3000)),
        q: `Quel nombre est le plus <b>${small ? 'PETIT' : 'GRAND'}</b> ?`,
        mount(el, ctx) { choices(el, labels, labels[best], ctx, 'num tall'); } };
    } },
    count: { cat: 'speed', make(lv) {
      const target = lv >= 4 && Math.random() < 0.5 ? '🌟' : '⭐', k = R(2, 4 + Math.floor(lv / 2));
      const pool = target === '🌟' ? ['⭐', '✨', '💫'] : ['🌙', '☀️', '❤️', '🍀'], d = R(0, Math.floor(lv * 0.9));
      const items = shuffle([...Array(k).fill(target), ...Array.from({ length: d }, () => pick(pool))]);
      return { cat: 'speed', type: 'count', hard: target === '🌟', answerMs: Math.round(lerp(lv, 6500, 4500)),
        q: `Combien y a-t-il de ${target} ?`,
        mount(el, ctx) {
          const field = h('div', 'bt-field small');
          field.style.setProperty('--fs', lerp(lv, 2.4, 1.5) + 'rem');
          spots(items.length).forEach((p, i) => { const s = h('span', 'bt-thing', items[i]); s.style.left = p.x + '%'; s.style.top = p.y + '%'; s.style.setProperty('--r', R(-20, 20) + 'deg'); field.appendChild(s); });
          el.appendChild(field);
          choices(el, near(k, lv < 5 ? 3 : 4).filter(x => x > 0), k, ctx, 'num');
        } };
    } },
    twice: { cat: 'speed', make(lv) {
      const n = Math.min(9, 3 + Math.floor(lv / 1.5)), set = sample(lv >= 6 ? ALL : pick([FRUITS, ANIMALS, THINGS]), n), dup = set[0];
      const items = shuffle([...set, dup]);
      return { cat: 'speed', type: 'twice', answerMs: Math.round(lerp(lv, 7000, 4500)), hard: n >= 8,
        q: 'Quel symbole apparaît deux fois ?',
        mount(el, ctx) {
          const grid = h('div', 'bt-grid-tap');
          grid.style.setProperty('--cols', items.length <= 4 ? items.length : items.length <= 6 ? 3 : items.length <= 8 ? 4 : 5);
          grid.style.setProperty('--fs', lerp(lv, 2.6, 1.7) + 'rem');
          items.forEach(e => {
            const b = h('button', 'bt-tap', e); b.type = 'button';
            b.onclick = () => {
              if (!ctx.alive()) return;
              const ok = e === dup;
              grid.querySelectorAll('.bt-tap').forEach(x => { if (x.textContent === dup) x.classList.add('good'); });
              if (!ok) b.classList.add('bad');
              ctx.done(ok, b);
            };
            grid.appendChild(b);
          });
          el.appendChild(grid);
        } };
    } },
  };

  // Choix du prochain défi : on alterne les familles (réfléchir, mémoriser, réagir) et on évite les répétitions.
  function nextChallenge(st) {
    const lv = clamp(st.lv, 1, 10);
    const cats = shuffle(Object.keys(CATS).filter(c => c !== st.lastCat));
    for (const cat of cats) {
      const types = shuffle(Object.keys(GEN).filter(t => GEN[t].cat === cat && (GEN[t].min || 0) <= lv && !(st.recent || []).includes(t)));
      if (types.length) {
        const type = types[0];
        st.lastCat = cat; st.recent = [...(st.recent || []), type].slice(-4);
        const c = GEN[type].make(lv);
        c.type = type; c.cat = cat;
        return c;
      }
    }
    st.recent = [];
    return nextChallenge(st);
  }

  // ---------- Records personnels (profil local du joueur) ----------
  function updateRecords(res) {
    const prev = store('localStorage', RECORDS_KEY) || { score: 0, combo: 0, solved: 0, avgMs: 0, games: 0 };
    const avgOk = res.solved >= 5 && res.avgMs > 0;
    const isNew = {
      score: res.score > prev.score, combo: res.maxCombo > prev.combo, solved: res.solved > prev.solved,
      avgMs: avgOk && (!prev.avgMs || res.avgMs < prev.avgMs),
    };
    const next = {
      score: Math.max(prev.score, res.score), combo: Math.max(prev.combo, res.maxCombo), solved: Math.max(prev.solved, res.solved),
      avgMs: isNew.avgMs ? res.avgMs : prev.avgMs, games: (prev.games || 0) + 1,
    };
    store('localStorage', RECORDS_KEY, next);
    return { prev, best: next, isNew, first: !prev.games };
  }

  // ---------- Partie en cours ----------
  let session = null; // { key, destroy, finished, res, rec }

  function run(el, o) {
    const saved = store('sessionStorage', o.key);
    const st = saved && !saved.finished ? saved : { score: 0, solved: 0, errors: 0, combo: 0, maxCombo: 0, times: [], lv: 1, penalty: 0, n: 0, cats: {}, errStreak: 0 };
    const now = () => Date.now();
    const endAt = () => o.startAt + o.playMs - st.penalty;
    let cur = null, tok = 0, timers = [], begun = false, finished = false, introShown = '', lastSec = null, overlayTok = 0;

    el.innerHTML = `<div class="bt">
      <div class="bt-hud">
        <div class="bt-stat"><small>SCORE</small><b data-score>0</b></div>
        <div class="bt-stat bt-time"><small>TEMPS</small><b data-time>${Math.round(o.playMs / 1000)}</b></div>
        <div class="bt-stat bt-combo"><small>COMBO</small><b data-combo>×1</b></div>
      </div>
      <div class="bt-timebar"><i data-timebar></i></div>
      <section class="bt-card" data-card>
        <div class="bt-meta"><span class="bt-cat" data-cat>🧠 Cerveau Turbo</span><span class="bt-num" data-num></span></div>
        <div class="bt-q" data-q>Prépare tes neurones…</div>
        <div class="bt-stage" data-stage></div>
        <div class="bt-cbar"><i data-cbar></i></div>
      </section>
      <div class="bt-fx" data-fx></div>
      <div class="bt-overlay" data-overlay></div>
    </div>`;
    const $ = k => el.querySelector(`[data-${k}]`);
    const card = $('card'), stage = $('stage'), fx = $('fx'), overlay = $('overlay');

    const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
    const save = () => store('sessionStorage', o.key, st);
    const stats = () => ({
      score: st.score, solved: st.solved, errors: st.errors, combo: st.combo, maxCombo: st.maxCombo,
      avgMs: st.times.length ? Math.round(st.times.reduce((a, b) => a + b, 0) / st.times.length) : 0,
      level: Math.round(st.lv), type: cur ? cur.c.type : '', cats: st.cats,
    });
    const hud = () => {
      $('score').textContent = fmtN(st.score);
      const m = mult(st.combo);
      $('combo').innerHTML = st.combo ? `${st.combo}<span> ×${m}</span>` : '×1';
      el.querySelector('.bt-combo').classList.toggle('hot', m >= 2);
      el.querySelector('.bt-combo').dataset.m = m;
    };
    const show = (html, cls, ms) => { // les minuteries d'overlay survivent au changement de défi
      const t = ++overlayTok;
      overlay.className = 'bt-overlay on ' + (cls || '');
      overlay.innerHTML = `<div>${html}</div>`;
      if (ms) setTimeout(() => { if (t === overlayTok) overlay.className = 'bt-overlay'; }, ms);
    };
    const float = (html, cls, x, y) => {
      const f = h('div', 'bt-float ' + (cls || ''), html);
      f.style.left = x + 'px'; f.style.top = y + 'px';
      fx.appendChild(f); setTimeout(() => f.remove(), 1100);
    };
    const burst = (x, y, n = 16) => {
      const cols = ['#ffd23f', '#ff5d8f', '#35d0ba', '#8f72ff', '#fff'];
      for (let i = 0; i < n; i++) {
        const p = h('i', 'bt-particle'), a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 70;
        p.style.left = x + 'px'; p.style.top = y + 'px';
        p.style.setProperty('--dx', Math.cos(a) * d + 'px'); p.style.setProperty('--dy', Math.sin(a) * d + 'px');
        p.style.setProperty('--c', pick(cols)); p.style.setProperty('--s', 6 + Math.random() * 8 + 'px');
        if (Math.random() < 0.25) { p.textContent = pick(['✨', '⭐', '💖']); p.className = 'bt-particle star'; }
        fx.appendChild(p); setTimeout(() => p.remove(), 800);
      }
    };
    const origin = src => {
      const box = el.querySelector('.bt').getBoundingClientRect(), r = (src && src.isConnected ? src : card).getBoundingClientRect();
      return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2];
    };

    function next() {
      if (finished) return;
      clearTimers();
      const c = nextChallenge(st), token = ++tok;
      cur = { c, token, mountAt: now(), readyAt: 0, resolved: false };
      st.n++;
      const cat = CATS[c.cat];
      $('cat').textContent = `${cat.icon} ${cat.name}`;
      $('cat').dataset.cat = c.cat;
      $('num').textContent = `Défi n°${st.n}${c.hard ? ' · 🌶️' : ''}`;
      $('q').innerHTML = c.q;
      $('cbar').style.width = '100%';
      card.className = 'bt-card in cat-' + c.cat;
      stage.innerHTML = ''; stage.className = 'bt-stage bt-' + c.type;
      const alive = () => !finished && cur && cur.token === token && !cur.resolved;
      const ctx = {
        alive,
        ready: () => { if (cur.token === token && !cur.readyAt) cur.readyAt = now(); },
        done: (ok, src, msg) => { if (alive()) resolve(ok, src, msg); },
        later: (fn, ms) => timers.push(setTimeout(() => { if (alive()) fn(); }, ms)),
        setQ: html => { if (alive()) $('q').innerHTML = html; },
      };
      try { c.mount(stage, ctx); } catch (e) { console.error('[brain]', c.type, e); return next(); }
      if (!c.manualReady) ctx.ready();
    }

    function resolve(ok, src, msg) {
      const c = cur.c, t = now(), rt = t - (cur.readyAt || cur.mountAt);
      cur.resolved = true;
      st.times.push(Math.min(rt, c.answerMs));
      const tally = st.cats[c.cat] = st.cats[c.cat] || [0, 0];
      tally[1]++;
      const [x, y] = origin(src);
      if (ok) {
        const before = mult(st.combo);
        st.solved++; st.combo++; tally[0]++; st.errStreak = 0;
        st.maxCombo = Math.max(st.maxCombo, st.combo);
        const m = mult(st.combo), speed = Math.round(SPEED_MAX * clamp(1 - rt / c.answerMs, 0, 1));
        const diff = 10 * Math.floor((st.lv - 1) / 2) + (c.hard ? HARD_BONUS : 0), pts = (BASE + speed + diff) * m;
        st.score += pts;
        st.lv = Math.min(10, st.lv + (rt < c.answerMs * 0.45 ? 0.7 : 0.35));
        card.classList.add('ok');
        float(`+${pts}<small>${speed >= 30 ? '⚡ rapide ! ' : ''}${m > 1 ? '×' + m : ''}</small>`, 'good', x, y);
        burst(x, y, 12 + m * 3);
        sfx('good', m);
        if (m > before) {
          show(`COMBO ×${m}<small>🔥 ${st.combo} d'affilée !</small>`, 'combo', 750);
          sfx('combo', m);
          if (navigator.vibrate) try { navigator.vibrate([20, 30, 20]); } catch (e) { /* facultatif */ }
        }
      } else {
        const lostCombo = st.combo >= 3;
        st.errors++; st.combo = 0; st.errStreak++; st.penalty += PENALTY_MS;
        st.lv = Math.max(1, st.lv - (st.errStreak >= 2 ? 1.5 : 1));
        card.classList.add('ko');
        float(`${esc(msg || 'Raté !')}<small>−2 s${lostCombo ? ' · combo perdu' : ''}</small>`, 'bad', x, y);
        const tEl = el.querySelector('.bt-time'); tEl.classList.remove('hit'); void tEl.offsetWidth; tEl.classList.add('hit');
        sfx('bad');
        if (navigator.vibrate) try { navigator.vibrate(90); } catch (e) { /* facultatif */ }
      }
      hud(); save();
      o.onProgress(stats());
      timers.push(setTimeout(next, ok ? FEEDBACK_MS : FEEDBACK_MS + 450));
    }

    function finish() {
      finished = true;
      clearInterval(loop); clearTimers();
      st.finished = true;
      const res = stats();
      const rec = updateRecords(res);
      st.res = res; st.rec = rec; save();
      session.finished = true; session.res = res; session.rec = rec;
      el.querySelector('.bt-time b').textContent = '0';
      $('timebar').style.width = '0%';
      show('TEMPS ÉCOULÉ !<small>⏱️ Pose ton cerveau…</small>', 'end');
      sfx('timeUp');
      o.onFinish(res);
      setTimeout(() => { if (session && session.key === o.key) results(el, res, rec); }, 1700);
    }

    function tick() {
      const t = now();
      if (t < o.startAt) {
        const left = o.startAt - t, label = left > 3000 ? 'PRÊT ?' : String(Math.ceil(left / 1000));
        if (label !== introShown) { introShown = label; show(label, label === 'PRÊT ?' ? 'ready' : 'count'); if (label !== 'PRÊT ?') sfx('tick'); }
        return;
      }
      if (!begun) {
        begun = true;
        if (introShown) { introShown = ''; show('GO !', 'go', 650); sfx('go'); }
        next();
      }
      const left = Math.max(0, endAt() - t);
      const sec = Math.ceil(left / 1000);
      $('time').textContent = sec;
      $('timebar').style.width = (100 * left / o.playMs) + '%';
      el.querySelector('.bt-time').classList.toggle('hurry', left < 10000);
      if (sec !== lastSec) { if (sec <= 5 && sec > 0 && lastSec !== null) sfx('tick'); lastSec = sec; }
      if (left <= 0) return finish();
      if (cur && cur.readyAt && !cur.resolved) {
        const p = (t - cur.readyAt) / cur.c.answerMs;
        $('cbar').style.width = Math.max(0, 100 * (1 - p)) + '%';
        $('cbar').classList.toggle('low', p > 0.7);
        if (p >= 1) resolve(false, null, 'Trop lent !');
      }
    }

    hud();
    const loop = setInterval(tick, 50);
    tick();
    return () => { finished = true; clearInterval(loop); clearTimers(); };
  }

  // ---------- Écran de fin ----------
  function results(el, res, rec, extra) {
    const t = rate(res), acc = accuracy(res), nw = rec ? rec.isNew : {}, best = rec ? rec.best : null;
    const badge = k => (nw[k] && rec && !rec.first ? '<em class="bt-new">NOUVEAU RECORD ! 🏆</em>' : '');
    const anyNew = rec && !rec.first && Object.values(nw).some(Boolean);
    const catRows = Object.entries(res.cats || {}).map(([k, [ok, n]]) => `<span class="bt-catstat" data-cat="${k}">${CATS[k] ? CATS[k].icon : ''} ${CATS[k] ? CATS[k].name : k} <b>${ok}/${n}</b></span>`).join('');
    const rank = extra && extra.rank ? `<div class="bt-rank">Tu termines <b>${extra.rank === 1 ? '1er·e' : extra.rank + 'ᵉ'}</b> sur ${extra.total} ${extra.rank === 1 ? '👑' : ''}</div>` : '';
    el.innerHTML = `<div class="bt bt-results">
      <h1 class="bt-end-title">TEMPS ÉCOULÉ !</h1>
      <div class="bt-title-badge"><span>${t.icon}</span><b>${t.name}</b></div>
      ${rank}
      <div class="bt-final-score"><small>SCORE</small><b data-countup="${res.score}">0</b>${badge('score')}</div>
      <div class="bt-statgrid">
        <div><span>✅</span><b>${res.solved}</b><small>défis réussis</small>${badge('solved')}</div>
        <div><span>❌</span><b>${res.errors}</b><small>erreur${res.errors > 1 ? 's' : ''}</small></div>
        <div><span>🎯</span><b>${acc} %</b><small>précision</small></div>
        <div><span>⏱️</span><b>${res.avgMs ? fmtS(res.avgMs) : '—'}</b><small>temps moyen</small>${badge('avgMs')}</div>
        <div class="wide"><span>🔥</span><b>${res.maxCombo}</b><small>meilleur combo</small>${badge('combo')}</div>
      </div>
      ${catRows ? `<div class="bt-cats">${catRows}</div>` : ''}
      ${best ? `<section class="bt-records">
        <h2>🏅 Mes records${anyNew ? ' <em class="bt-new">NOUVEAU RECORD ! 🏆</em>' : ''}</h2>
        <div><span>Meilleur score</span><b>${fmtN(best.score)}</b></div>
        <div><span>Plus grand combo</span><b>${best.combo}</b></div>
        <div><span>Plus de défis réussis</span><b>${best.solved}</b></div>
        <div><span>Meilleur temps moyen</span><b>${best.avgMs ? fmtS(best.avgMs) : '—'}</b></div>
        <p>${rec.first ? 'Première partie : tes records sont lancés ! 🚀' : `${best.games} parties jouées · Encore une ? Tu peux sûrement faire mieux 😉`}</p>
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
  function render(el, p, ctx) {
    if (p.kind === 'brain') {
      const key = `pg-brain:${ctx.code}:${p.n}`;
      if (session && session.key === key && el.querySelector('.bt')) return; // déjà en cours (ou terminé) pour cette partie
      if (session) session.destroy();
      if (!p.expected.includes(ctx.me)) {
        session = null;
        el.innerHTML = '<div class="bt bt-results"><h1 class="bt-end-title">Cerveau Turbo</h1><p class="bt-wait">Une partie est en cours… tu joueras à la prochaine ! 🧠</p></div>';
        return;
      }
      const saved = store('sessionStorage', key);
      session = { key, destroy: () => {}, finished: false };
      if (saved && saved.finished) { session.finished = true; session.res = saved.res; session.rec = saved.rec; return results(el, saved.res, saved.rec); }
      session.destroy = run(el, {
        key, startAt: p.data.startAt - ctx.off, playMs: p.data.playMs,
        onProgress: ctx.progress, onFinish: ctx.send,
      });
      return;
    }
    if (p.kind === 'brainResults') {
      if (session) session.destroy();
      const rows = (p.data && p.data.rows) || [];
      const i = rows.findIndex(r => r.id === ctx.me), row = rows[i];
      const saved = store('sessionStorage', `pg-brain:${ctx.code}:${p.data && p.data.playN}`);
      const res = saved && saved.res ? saved.res : row, rec = saved && saved.rec;
      session = null;
      if (!res) { el.innerHTML = '<div class="bt bt-results"><h1 class="bt-end-title">Temps écoulé !</h1><p class="bt-wait">Regardez l\'écran 👀</p></div>'; return; }
      results(el, res, rec, { rank: i >= 0 ? i + 1 : 0, total: rows.length, quiet: true });
    }
  }

  window.BrainGame = { ...shared, render };
})();
