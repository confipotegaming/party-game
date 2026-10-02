// Boss Fight : tout l'affichage. Pixel art façon Zelda Game Boy (donjon, héros, boss), manette sur les téléphones,
// écran Game Over et cinématique de fin (prairie, crédits, END GAME). La logique du combat est dans games/boss.js.
(function () {
  const W = 240, H = 176, HUD = 24;            // salle de jeu + bandeau du haut (en pixels « Game Boy »)
  const FONT = '"Press Start 2P", monospace';
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sfx = (n, ...a) => { const A = window.partyAudio; if (A && A.boss) A.boss(n, ...a); };

  // ---------- Classes ----------
  const CLASSES = {
    archer:   { name: 'Archer',     icon: '🏹', special: 'Pluie de flèches', desc: 'Tire vite et de loin.',                  sp: '7 flèches en éventail' },
    mage:     { name: 'Magicien',   icon: '🔮', special: 'Météore',          desc: 'Boules de feu puissantes.',              sp: 'Un météore s\'écrase sur le boss' },
    tank:     { name: 'Tank',       icon: '🛡️', special: 'Rempart',          desc: 'Épée au corps à corps, pare un coup sur deux.', sp: 'Toute l\'équipe est invincible 4 s' },
    heal:     { name: 'Soigneur',   icon: '💚', special: 'Soin sacré',       desc: 'Soigne les héros proches de lui.',       sp: '+1 cœur à tous, relève les K.O.' },
    summoner: { name: 'Invocateur', icon: '👻', special: 'Invocation',       desc: 'Appelle un esprit qui attaque seul.',    sp: 'Un esprit tire sur le boss 10 s' },
  };
  const PLAYER_COLORS = ['#ff4d6d', '#ffd23f', '#35d0ba', '#ff8a3d', '#4dabff', '#ff7ad9', '#a3e635', '#ffffff'];

  // ---------- Pixel art ----------
  // Chaque sprite est une grille de caractères ; « . » = transparent, les autres lettres renvoient à une palette.
  const HERO_BASE = [
    '................',
    '....kkkkkkkk....',
    '...kHHHHHHHHk...',
    '..kHHhHHHHhHHk..',
    '..kHHssssssHHk..',
    '..kHskssssksHk..',
    '...kssssssssk...',
    '....kPPPPPPk....',
    '...kBBBPPBBBk...',
    '..ksBBBBBBBBsk..',
    '..ksbBBBBBBbsk..',
    '...kPPPPPPPPk...',
    '...kbBBBBBBbk...',
    '....kLLkkLLk....',
    '....kLLkkLLk....',
    '....kkk..kkk....',
  ];
  const LEGS_B = ['....kLLkkLLk....', '...kLLk..kLLk...', '...kkk....kkk...'];
  const HERO = {
    archer: {
      pal: { H: '#3fb34f', h: '#2a7d36', B: '#2f9e44', b: '#1f6d2e', L: '#8a5a2b', W: '#b5712e', w: '#f2f2f2' },
      rows: { 0: '.kk.............', 1: '.kHkkkkkkkkk....', 2: '..kHHHHHHHHHk...' },
      over: { 4: '.............kW.', 5: '.............w.W', 6: '.............w.W', 7: '.............w.W', 8: '.............w.W', 9: '.............w.W', 10: '............sw.W', 11: '.............w.W', 12: '.............kW.' },
    },
    mage: {
      pal: { H: '#6a4bd8', h: '#ffd23f', B: '#6a4bd8', b: '#47309c', L: '#47309c', W: '#8a5a2b', O: '#ff8a3d' },
      rows: { 0: '........kk......', 1: '.......kHHk.....', 2: '......kHHHk.....', 3: '.....khhhhhk....', 4: '.kHHHHHHHHHHHHk.' },
      over: { 2: '.............kk.', 3: '............kOOk', 4: '............kOOk', 5: '.............kk.', 6: '.............W..', 7: '.............W..', 8: '.............W..', 9: '.............W..', 10: '............sW..', 11: '.............W..', 12: '.............W..', 13: '.............W..' },
    },
    tank: {
      pal: { H: '#aeb8c8', h: '#7d879a', B: '#9aa6b8', b: '#6c778a', L: '#5b6475', S: '#3c6fd8', X: '#ffd23f', W: '#8a5a2b', w: '#e8eef8', e: '#ffffff' },
      rows: { 0: '.......PP.......', 3: '..kHHHHHHHHHHk..', 4: '..kHkekkkkekHk..', 5: '..kHHhHHHHhHHk..' },
      over: { 3: '..............k.', 4: '.............kwk', 5: '.............kwk', 6: '.............kwk', 7: '.kkk.........kwk', 8: 'kSSSk.......kWWW', 9: 'kSXSk........sW.', 10: 'kXXXk...........', 11: 'kSXSk...........', 12: 'kSSSk...........', 13: '.kSk............', 14: '..k.............' },
    },
    heal: {
      pal: { H: '#fbf6ea', h: '#e8b84a', B: '#fbf6ea', b: '#d9cfb8', L: '#d9cfb8', W: '#c89a4a', O: '#52e08a' },
      rows: { 1: '....kkkkkkkk....', 2: '...khhhhhhhhk...' },
      over: { 2: '..............O.', 3: '.............OOO', 4: '..............O.', 5: '..............W.', 6: '..............W.', 7: '..............W.', 8: '..............W.', 9: '..............W.', 10: '.............sW.', 11: '..............W.', 12: '..............W.', 13: '..............W.' },
    },
    summoner: {
      pal: { H: '#3a2860', h: '#1d1430', B: '#3a2860', b: '#261a42', L: '#261a42', e: '#6ff8ff', O: '#6ff8ff' },
      rows: { 0: '.......kk.......', 1: '....kkkHHkkk....', 4: '..kHHhhhhhhHHk..', 5: '..kHhehhhhehHk..', 6: '...khhhhhhhhk...' },
      over: { 8: '............kkkk', 9: '...........skOOk', 10: '............kOOk', 11: '............kkkk' },
    },
  };
  const BASE_PAL = { k: '#1a1428', s: '#ffcf9e', e: '#1a1428' };

  const BOSS_ART = {
    bowser: { pal: { g: '#2f9e44', G: '#1f6d2e', y: '#f5c542', Y: '#d49a1f', o: '#ff6a2a', w: '#f4f4f4', r: '#e03030', t: '#f8e0a8', n: '#8a2a1a' }, map: [
      '..w..........w..',
      '.kwk.oooooo.kwk.',
      '.kwwkoooooookwwk',
      '..kyyyyyyyyyyk..',
      '.kyyrkyyyykryyk.',
      '.kyyyyyyyyyyyyk.',
      '.kyyywwnnwwyyyk.',
      'wgkkyyyyyyyykkgw',
      'kgggkttttttkgggk',
      'kgwgkttttttkgwgk',
      'kgggkttttttkgggk',
      '.kgykttttttkygk.',
      '.kyykttttttkyyk.',
      '..kyttttttttyk..',
      '.kyyyk.kk.kyyyk.',
      '.kwkwk....kwkwk.'] },
    bobomb: { pal: { b: '#2a2a3a', B: '#55557a', w: '#ffffff', y: '#ffd23f', r: '#e03030', o: '#ff9a3d', f: '#c8a070' }, map: [
      '....y.y..y.y....',
      '....yyyyyyyy....',
      '...kyyryyryyk...',
      '..kbbbbbbbbbbk..',
      '.kbBbbbbbbbbbbk.',
      '.kBbwwkbbwwkbbk.',
      'kbBbwwkbbwwkbbbk',
      'kbBbbbbbbbbbbbbk',
      'kbbbwwwwwwwwbbbk',
      'kbbwwwbbbbwwwbbk',
      'kbbbbbbbbbbbbbbk',
      '.kbbbbbbbbbbbbk.',
      '.kbbbbbbbbbbbbk.',
      '..kbbbbbbbbbbk..',
      '...kookkkkook...',
      '..kooook.kooook.'] },
    sephiroth: { pal: { h: '#e8eef6', H: '#aab6c8', s: '#ffd8b0', e: '#4dff9a', c: '#2a2a3a', C: '#4a4a66', m: '#dfe6f0', w: '#120c1e' }, map: [
      'w.....kkkk......',
      'ww...khhhhk.....',
      'www.khhhhhhk....',
      'wwwkhhssssHhk...',
      'wwwkhsekkeshk...',
      '.wwkhhssssHhhk..',
      '.wwkhhkcckhHhk..',
      '..khhcCCCCchhkm.',
      '..khcCcCCcCchkm.',
      '..khcCcCCcCchkm.',
      '...kcCcCCcCcksm.',
      '...kcCCCCCCck.m.',
      '...kcCCCCCCck.m.',
      '...kcCCkkCCck.m.',
      '...kccck.kccck..',
      '...kkkk...kkkk..'] },
    ganondorf: { pal: { r: '#d8402a', R: '#9a2a1a', s: '#6a8a5a', e: '#ffd23f', a: '#3a3a4a', A: '#5a5a6e', y: '#e0b040', c: '#7a1a2a', t: '#b0b8c8' }, map: [
      '....kkkkkkk....t',
      '...krrrrrrrk..tt',
      '..krryyyyyrrk..t',
      '..krsssssssrk..t',
      '..krsekssekrk..t',
      '..krsssssssrk..t',
      '..kkrrsRRsrrkk.t',
      '.kyaakrrrrkaaykt',
      'kyAaaAyyyyAaaAyk',
      'kaAaaaayyaaaaAak',
      'kcaAaaayyaaaAack',
      'kckaAaaaaaaAakck',
      '.kckaaaaaaaakck.',
      '..kkaaakkaaakk..',
      '...kaaak.kaaak..',
      '...kkkkk.kkkkk..'] },
    diablo: { pal: { r: '#c8281e', R: '#8a1410', o: '#ff8a3d', y: '#ffd23f', w: '#f0e8d8', d: '#4a0c0c' }, map: [
      'w..............w',
      'wk...........kw.',
      '.wk..kkkkkk.kw..',
      '..wkrrrrrrrrkw..',
      '..krrRrrrrRrrk..',
      '.krrykrrrrkyrrk.',
      '.krrrrrrrrrrrrk.',
      '.krrRwwwwwwRrrk.',
      'kwkrrRdwwdRrrkwk',
      'krrkrrrrrrrrkrrk',
      'krRrkrRrrRrkrRrk',
      '.kRrrkrrrrkrrRk.',
      '..kRrrkrrkrrRk..',
      '...krRk..kRrk...',
      '..kwwrk..krwwk..',
      '..kkkk....kkkk..'] },
    mewtwo: { pal: { p: '#e4d8f0', q: '#b8a8d0', P: '#9a6ad0', e: '#6a2ab0' }, map: [
      '..kk......kk....',
      '.kppk....kppk...',
      '.kpqpkkkkpqpk...',
      '..kppppppppk....',
      '..kpekppekpk....',
      '..kppppppppk....',
      '...kqppppqk.....',
      '..kkkpppppkk....',
      '.kpk.kPPPk.kpk..',
      'kpk.kPPPPPk.kpk.',
      'kk..kPPPPPk..kk.',
      '....kppppppk.kk.',
      '...kppk.kppk.kPk',
      '...kpk...kpk.kPk',
      '..kppk...kppkPk.',
      '..kkk.....kkkk..'] },
    eggman: { pal: { r: '#e02a2a', R: '#a01818', s: '#ffd0a0', o: '#ff8a3d', b: '#3a7ad8', g: '#d0d8e0', y: '#ffd23f', n: '#2a2a3a' }, map: [
      '....kkkkkkkk....',
      '...kssssssssk...',
      '..ksbbsssbbssk..',
      '..ksbgksbgkssk..',
      '.kssbbsssbbsssk.',
      '.ksssssoosssssk.',
      '.koooooooooooook',
      '.kssoo....oossk.',
      'kRrrrrrrrrrrrrRk',
      'krrrrryyyyrrrrrk',
      'krrrrrrrrrrrrrrk',
      'knrrrrrrrrrrrrnk',
      '.kgggggggggggggk',
      '..kgggggggggggk.',
      '...kkknnnnkkk...',
      '......kkkk......'] },
    ghirahim: { pal: { w: '#f4f4f8', g: '#c8c8d8', p: '#b070e0', P: '#7a3ab0', s: '#ece6f4', e: '#2a1a3a', d: '#ffd23f' }, map: [
      '...kkkkkkkkk....',
      '..kwwwwwwwwwk...',
      '..kwwssssswwk...',
      '..kwsekssesk....',
      '..kwssssssk.....',
      '...kssspssk.....',
      '..kPkssssk.kPk..',
      '.kpPPkwwkPPPpk..',
      'kpPPpkwdwkpPPpk.',
      'kPPpkwwwwwkpPPk.',
      'kPpk.kwwwk.kpPk.',
      'kpk..kwwwk..kpk.',
      'kk...kgwgk...kk.',
      '.....kgkgk......',
      '....kwk.kwk.....',
      '....kkk.kkk.....'] },
  };
  const MINION_ART = {
    bobomb: { pal: { b: '#2a2a3a', w: '#ffffff', o: '#ff9a3d', y: '#ffd23f', g: '#b0b0c0' }, map: [
      '....y.....', '....k..g..', '...kkk.gg.', '.kkbbbkkg.', 'kbbbbbbbk.', 'kbwkbwkbk.', 'kbbbbbbbk.', '.kbbbbbk..', '.kokkkok..', 'kook.kook.'] },
    badnik: { pal: { r: '#e03030', R: '#a01818', w: '#ffffff', g: '#9aa0b0', b: '#3a7ad8' }, map: [
      '...kkkk...', '..krrwrk..', '.krrRrrrk.', 'krrrrrrrrk', 'kwkrRrrrRk', 'kbkrrrrrrk', '.kkRRRRRk.', '.kgkkkgk..', 'kgggkgggk.', '.kkk.kkk..'] },
  };
  const HEART = ['.kkk.kkk.', 'kRRRkRRRk', 'kRRRRRRRk', 'kRRRRRRRk', '.kRRRRRk.', '..kRRRk..', '...kRk...', '....k....'];

  const cache = new Map();
  function makeSprite(map, pal, opts = {}) {
    const key = opts.key;
    if (key && cache.has(key)) return cache.get(key);
    const h = map.length, w = Math.max(...map.map(r => r.length)), c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    map.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.' || ch === ' ') return;
      const col = opts.white ? '#ffffff' : (pal[ch] || BASE_PAL[ch]);
      if (!col) return;
      x.fillStyle = col; x.fillRect(opts.flip ? w - 1 - i : i, j, 1, 1);
    }));
    if (key) cache.set(key, c);
    return c;
  }
  function heroMap(cls, frame) {
    const def = HERO[cls] || HERO.archer, rows = HERO_BASE.slice();
    for (const [i, r] of Object.entries(def.rows || {})) rows[i] = r;
    if (frame) for (let i = 0; i < 3; i++) rows[13 + i] = LEGS_B[i];
    for (const [i, r] of Object.entries(def.over || {})) rows[i] = [...rows[i]].map((ch, j) => (r[j] && r[j] !== '.' ? r[j] : ch)).join('');
    return rows;
  }
  function heroSprite(cls, color, frame = 0, flip = false, white = false) {
    const def = HERO[cls] || HERO.archer;
    return makeSprite(heroMap(cls, frame), { ...def.pal, P: PLAYER_COLORS[color % PLAYER_COLORS.length] }, { flip, white, key: `h:${cls}:${color}:${frame}:${flip}:${white}` });
  }
  const bossSprite = (key, white = false, flip = false) => { const a = BOSS_ART[key] || BOSS_ART.bowser; return makeSprite(a.map, a.pal, { white, flip, key: `b:${key}:${white}:${flip}` }); };
  const minionSprite = (k, flip) => { const a = MINION_ART[k] || MINION_ART.bobomb; return makeSprite(a.map, a.pal, { flip, key: `m:${k}:${flip}` }); };
  // Cœur coupé en quarts (comme Zelda) : q = nombre de quarts restants (0 à 4)
  function heartSprite(q) {
    const key = 'heart:' + q;
    if (cache.has(key)) return cache.get(key);
    const quad = (i, j) => (j <= 3 ? (i <= 4 ? 0 : 1) : (i <= 4 ? 2 : 3));
    const order = [2, 0, 1, 3]; // les quarts se vident dans cet ordre (inverse)
    const filled = new Set(order.slice(0, q));
    const map = HEART.map((r, j) => [...r].map((ch, i) => (ch === 'R' ? (filled.has(quad(i, j)) ? 'R' : 'E') : ch)).join(''));
    return makeSprite(map, { R: '#e8384a', E: '#4a2a3a' }, { key });
  }
  // Petite image (dataURL) pour l'interface HTML, agrandie sans flou
  const imgCache = new Map();
  function spriteURL(canvas, scale) {
    const key = canvas;
    if (!imgCache.has(key)) imgCache.set(key, new Map());
    const m = imgCache.get(key);
    if (!m.has(scale)) {
      const c = document.createElement('canvas'); c.width = canvas.width * scale; c.height = canvas.height * scale;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(canvas, 0, 0, c.width, c.height);
      m.set(scale, c.toDataURL());
    }
    return m.get(scale);
  }
  const heroImg = (cls, color, scale = 4, cl = '') => `<img class="pixel ${cl}" alt="" src="${spriteURL(heroSprite(cls, color), scale)}" width="${16 * scale}" height="${16 * scale}">`;
  const heartsHTML = (hp, scale = 3) => Array.from({ length: 5 }, (_, i) => `<img class="pixel" alt="" src="${spriteURL(heartSprite(clamp(hp - i * 4, 0, 4)), scale)}" width="${9 * scale}" height="${8 * scale}">`).join('');

  // ---------- Décor du donjon (pré-calculé) ----------
  let dungeonCanvas = null;
  function dungeon() {
    if (dungeonCanvas) return dungeonCanvas;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'), R = (col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    // Sol : dalles
    for (let ty = 1; ty < 10; ty++) for (let tx = 1; tx < 14; tx++) {
      const px = tx * 16, py = ty * 16, alt = (tx + ty) % 2;
      R(alt ? '#5d4c86' : '#66549a', px, py, 16, 16);
      R(alt ? '#6e5ca0' : '#7563aa', px + 1, py + 1, 14, 1); R(alt ? '#6e5ca0' : '#7563aa', px + 1, py + 1, 1, 14);
      R('#4a3c70', px, py + 15, 16, 1); R('#4a3c70', px + 15, py, 1, 16);
      if ((tx * 7 + ty * 3) % 5 === 0) { R('#4a3c70', px + 5, py + 6, 3, 1); R('#4a3c70', px + 7, py + 7, 2, 1); }
    }
    // Cercle de runes au centre
    x.strokeStyle = '#8a78c0'; x.lineWidth = 1;
    for (const r of [34, 30]) { x.beginPath(); x.arc(W / 2 + 0.5, H / 2 + 0.5, r, 0, Math.PI * 2); x.stroke(); }
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; R('#8a78c0', Math.round(W / 2 + Math.cos(a) * 32) - 1, Math.round(H / 2 + Math.sin(a) * 32) - 1, 3, 3); }
    // Murs en briques
    const wall = (a, b, w, h) => {
      R('#3a2e5a', a, b, w, h);
      for (let yy = b; yy < b + h; yy += 4) for (let xx = a - ((yy / 4) % 2) * 4; xx < a + w; xx += 8) {
        R('#56478a', Math.max(a, xx) + 1, yy + 1, Math.min(7, a + w - Math.max(a, xx) - 1), 2);
      }
    };
    wall(0, 0, W, 16); wall(0, H - 16, W, 16); wall(0, 0, 16, H); wall(W - 16, 0, 16, H);
    R('#241c3c', 16, 15, W - 32, 2); R('#241c3c', 15, 16, 2, H - 32); R('#241c3c', W - 17, 16, 2, H - 32); R('#241c3c', 16, H - 17, W - 32, 2);
    R('#2a2048', 16, 17, W - 32, 3); // ombre du mur du haut
    // Portes fermées (salle du boss)
    const door = (a, b, w, h) => { R('#1a1428', a, b, w, h); R('#7a6a3a', a + 1, b + 1, w - 2, h - 2); for (let i = 2; i < w - 2; i += 4) R('#4a3a1a', a + i, b + 2, 2, h - 4); };
    door(W / 2 - 12, 0, 24, 15); door(W / 2 - 12, H - 15, 24, 15); door(0, H / 2 - 12, 15, 24); door(W - 15, H / 2 - 12, 15, 24);
    // Supports des torches
    for (const [a, b] of [[28, 4], [W - 36, 4], [28, H - 12], [W - 36, H - 12]]) { R('#1a1428', a, b + 3, 8, 6); R('#9a8a5a', a + 1, b + 4, 6, 4); }
    return (dungeonCanvas = c);
  }

  // ---------- État réseau (instantanés du serveur, ~20/s) ----------
  const net = { prev: null, cur: null, at: 0, prevAt: 0, n: null, listeners: new Set() };
  function onSnap(s) {
    if (!s) return;
    if (net.n !== s.n) { net.prev = null; net.cur = null; net.n = s.n; }
    net.prev = net.cur; net.prevAt = net.at; net.cur = s; net.at = performance.now();
    net.listeners.forEach(f => { try { f(s); } catch (e) { console.error(e); } });
  }

  // ---------- Rendu du combat (écran de l'hôte) ----------
  const view = { raf: 0, n: null, parts: [], shake: 0, banner: null, flash: 0, heroes: {}, low: null, lx: null, big: null, bx: null, k: 4, lastHud: '', deathT: 0 };
  function heroInfo(id) { return view.heroes[id] || { cls: 'archer', color: 0, name: '?' }; }
  function lerpHero(id) {
    const c = net.cur.p.find(e => e.id === id), p = net.prev && net.prev.p.find(e => e.id === id);
    if (!p) return c;
    const t = clamp((performance.now() - net.at) / 50, 0, 1);
    return { ...c, x: p.x + (c.x - p.x) * t, y: p.y + (c.y - p.y) * t };
  }
  function bossPos() {
    const c = net.cur.boss, p = net.prev && net.prev.boss;
    if (!p || p.key !== c.key) return c;
    const t = clamp((performance.now() - net.at) / 50, 0, 1);
    return { ...c, x: p.x + (c.x - p.x) * t, y: p.y + (c.y - p.y) * t };
  }
  const ext = () => Math.min(0.12, (performance.now() - net.at) / 1000);

  function particle(x, y, vx, vy, life, col, size = 1, g = 0) { view.parts.push({ x, y, vx, vy, life, max: life, col, size, g }); }
  function burst(x, y, n, cols, sp = 40, life = 0.5, size = 1) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = sp * (0.4 + Math.random() * 0.8); particle(x, y, Math.cos(a) * s, Math.sin(a) * s, life * (0.6 + Math.random() * 0.6), cols[i % cols.length], size); } }

  function handleFx(s) {
    for (const e of s.fx || []) {
      const [k, a, b] = e;
      const hero = () => s.p.find(p => p.id === a);
      if (k === 'hit') { burst(a, b, 4, ['#ffffff', '#ffd23f'], 50, 0.25); sfx('hit'); }
      else if (k === 'boom') { burst(a, b, 16, ['#ffffff', '#ffd23f', '#ff8a3d', '#e03030'], 70, 0.6, 2); view.shake = Math.max(view.shake, 0.25); sfx('boom'); }
      else if (k === 'hurt') { const h = hero(); if (h) burst(h.x, h.y - 6, 6, ['#ff4d6d', '#ffffff'], 40, 0.35); sfx('hurt'); }
      else if (k === 'block') { const h = hero(); if (h) { burst(h.x, h.y - 6, 6, ['#ffffff', '#4dabff'], 50, 0.3); view.pop(h.x, h.y - 22, 'PARADE !', '#9ad0ff'); } sfx('block'); }
      else if (k === 'ko') { const h = hero(); if (h) burst(h.x, h.y - 6, 12, ['#ffffff', '#b0b0c0'], 30, 0.8); sfx('ko'); }
      else if (k === 'heal') { const h = hero(); if (h) particle(h.x, h.y - 14, 0, -18, 0.8, '#52e08a', 2); }
      else if (k === 'revive') { const h = hero(); if (h) { burst(h.x, h.y - 6, 14, ['#ffd23f', '#ffffff', '#52e08a'], 45, 0.9); view.pop(h.x, h.y - 22, 'DEBOUT !', '#ffd23f'); } sfx('revive'); }
      else if (k === 'special') {
        const h = hero(), col = { archer: '#a3e635', mage: '#ff8a3d', tank: '#4dabff', heal: '#52e08a', summoner: '#6ff8ff' }[b] || '#fff';
        if (h) { burst(h.x, h.y - 6, 20, [col, '#ffffff'], 70, 0.7); view.pop(h.x, h.y - 24, CLASSES[b].special.toUpperCase() + ' !', col); }
        if (b === 'tank') view.flash = Math.max(view.flash, 0.15);
        sfx('special', b);
      }
      else if (k === 'pew') sfx('pew', b);
      else if (k === 'swing') sfx('swing');
      else if (k === 'reflect') { const h = hero(); if (h) { burst(h.x, h.y - 6, 10, ['#9ad0ff', '#ffffff'], 60, 0.4); view.pop(h.x, h.y - 22, 'RENVOI !', '#9ad0ff'); } sfx('reflect'); }
      else if (k === 'say') { view.banner = { text: a, t: 2.2 }; }
      else if (k === 'shoot') sfx('shoot');
      else if (k === 'thud') { view.shake = Math.max(view.shake, 0.3); sfx('thud'); }
      else if (k === 'dash') sfx('dash');
      else if (k === 'zap') { view.flash = Math.max(view.flash, 0.12); sfx('zap'); }
      else if (k === 'tele') { if (a !== undefined) burst(a, b, 14, ['#ff7ad9', '#ffffff', '#b070e0'], 50, 0.5); sfx('tele'); }
      else if (k === 'throw') sfx('throw');
      else if (k === 'morph') { view.flash = 0.6; view.shake = 1.5; sfx('morph'); }
      else if (k === 'intro') { sfx('intro'); }
      else if (k === 'dying') { view.deathT = 0; sfx('morph'); }
      else if (k === 'wiped') sfx('wiped');
    }
  }
  view.pops = [];
  view.pop = (x, y, text, col) => view.pops.push({ x, y, text, col, t: 1 });

  function drawBullet(x, k, px, py, vx, vy, back, time) {
    const R = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), w, h); };
    const ang = Math.atan2(vy, vx), blink = Math.floor(time * 12) % 2;
    switch (k) {
      case 'orb': { const c = back ? '#6fd0ff' : (blink ? '#ffe86a' : '#b8ff6a'); x.fillStyle = c; x.beginPath(); x.arc(px, py, 5 + blink, 0, 7); x.fill(); R('#ffffff', px - 2, py - 2, 3, 3); break; }
      case 'meteor': x.fillStyle = '#ff6a2a'; x.beginPath(); x.arc(px, py, 5, 0, 7); x.fill(); R('#ffd23f', px - 2, py - 2, 4, 4); R('#ff8a3d', px - 1, py - 9, 2, 4); break;
      case 'fire': R(blink ? '#ffd23f' : '#ff8a3d', px - 2, py - 2, 5, 5); R('#e03030', px - 1, py - 1, 3, 3); break;
      case 'feather': R('#120c1e', px - 2, py - 1, 5, 2); R('#6a6a8a', px - 1, py - 1, 2, 1); break;
      case 'dark': R('#b070e0', px - 2, py - 2, 4, 4); R('#3a1a5a', px - 1, py - 1, 2, 2); break;
      case 'spark': R('#ffd23f', px - 1, py - 3, 2, 6); R('#ffd23f', px - 3, py - 1, 6, 2); R('#ffffff', px - 1, py - 1, 2, 2); break;
      case 'psy': x.strokeStyle = blink ? '#ff7ad9' : '#b070e0'; x.lineWidth = 1.5; x.beginPath(); x.arc(px, py, 3.5, 0, 7); x.stroke(); break;
      case 'shadow': x.fillStyle = '#2a1040'; x.beginPath(); x.arc(px, py, 5, 0, 7); x.fill(); x.strokeStyle = '#b070e0'; x.lineWidth = 1; x.stroke(); break;
      case 'hammer': { x.save(); x.translate(px, py); x.rotate(time * 12); R('#8a5a2b', -1, -1, 2, 6); R('#aab0c0', -3, -4, 6, 3); x.restore(); break; }
      case 'missile': { x.save(); x.translate(px, py); x.rotate(ang); R('#f4f4f4', -4, -2, 7, 4); R('#e03030', 2, -2, 2, 4); R('#ffd23f', -6, -1, 2, 2); x.restore(); break; }
      case 'dagger': { x.save(); x.translate(px, py); x.rotate(ang); R('#e8eef6', -3, -1, 7, 2); R('#b070e0', -5, -2, 2, 4); x.restore(); break; }
      // tirs des héros
      case 'arrow': { x.save(); x.translate(px, py); x.rotate(ang); R('#8a5a2b', -5, 0, 8, 1); R('#ffffff', 3, -1, 2, 3); R('#3fb34f', -6, -1, 2, 3); x.restore(); break; }
      case 'fireball': R('#ff8a3d', px - 2, py - 2, 5, 5); R('#ffd23f', px - 1, py - 1, 3, 3); particle(px, py, 0, 0, 0.18, '#ff6a2a'); break;
      case 'light': R('#fffbe0', px - 1, py - 1, 3, 3); R('#52e08a', px, py - 3, 1, 7); R('#52e08a', px - 3, py, 7, 1); break;
      case 'wisp': case 'spirit': R('#6ff8ff', px - 1, py - 1, 3, 3); particle(px, py, 0, 0, 0.2, '#3ab0c8'); break;
      default: R('#ffffff', px - 1, py - 1, 3, 3);
    }
  }

  function drawFight(time, dt) {
    const s = net.cur, x = view.lx, R = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), w, h); };
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.fillStyle = '#0d0a18'; x.fillRect(0, 0, W, H + HUD);
    if (!s) return;
    view.shake = Math.max(0, view.shake - dt);
    const sh = view.shake > 0 ? Math.min(3, view.shake * 6) : 0;
    x.setTransform(1, 0, 0, 1, Math.round((Math.random() - 0.5) * sh * 2), HUD + Math.round((Math.random() - 0.5) * sh * 2));
    x.drawImage(dungeon(), 0, 0);
    // Torches animées
    for (const [a, b] of [[28, 4], [W - 36, 4], [28, H - 12], [W - 36, H - 12]]) {
      const f = Math.floor(time * 8 + a) % 3;
      R('#ff8a3d', a + 2, b - 1 + f % 2, 4, 5); R('#ffd23f', a + 3, b + 1, 2, 3); if (f === 2) R('#ffffff', a + 3, b + 2, 1, 1);
    }
    const b = bossPos();
    // Dangers au sol (sous les personnages)
    for (const z of s.z) {
      if (z.k === 'bomb') {
        const urgent = z.t < 0.45, on = urgent ? Math.floor(time * 16) % 2 : Math.floor(time * 6) % 2;
        x.strokeStyle = on ? '#ff4d6d' : '#ffd23f'; x.lineWidth = 1; x.beginPath(); x.arc(z.x + 0.5, z.y + 0.5, z.r, 0, 7); x.stroke();
        const fall = z.m ? clamp(z.t / z.m, 0, 1) : 0;
        R('#1a1428', z.x - 3, z.y - 3 - fall * 60, 7, 7); R('#ff8a3d', z.x, z.y - 6 - fall * 60, 1, 3);
      } else if (z.k === 'meteor') {
        x.strokeStyle = '#ff8a3d'; x.lineWidth = 1; x.beginPath(); x.arc(z.x + 0.5, z.y + 0.5, z.r, 0, 7); x.stroke();
        const fall = z.m ? clamp(z.t / z.m, 0, 1) : 0;
        x.fillStyle = '#ff6a2a'; x.beginPath(); x.arc(z.x - fall * 40, z.y - fall * 110, 8, 0, 7); x.fill();
        R('#ffd23f', z.x - fall * 40 - 3, z.y - fall * 110 - 3, 6, 6);
        particle(z.x - fall * 40, z.y - fall * 110, 0, 0, 0.3, '#ff8a3d', 2);
      } else if (z.k === 'beam' || z.k === 'aim') {
        const cx = Math.cos(z.a), cy = Math.sin(z.a), L = 400;
        const x0 = (z.k === 'aim' ? b.x : z.x) - (z.k === 'aim' ? 0 : cx * L), y0 = (z.k === 'aim' ? b.y : z.y) - (z.k === 'aim' ? 0 : cy * L);
        x.save(); x.beginPath(); x.rect(16, 16, W - 32, H - 32); x.clip();
        if (z.on) {
          x.strokeStyle = '#ff4d6d'; x.lineWidth = 9; x.beginPath(); x.moveTo(x0, y0); x.lineTo(z.x + cx * L, z.y + cy * L); x.stroke();
          x.strokeStyle = '#ffffff'; x.lineWidth = 4; x.stroke();
        } else {
          x.strokeStyle = Math.floor(time * 10) % 2 ? '#ff4d6d' : '#ffd23f'; x.lineWidth = 1; x.setLineDash([4, 3]);
          x.beginPath(); x.moveTo(x0, y0); x.lineTo((z.k === 'aim' ? b.x : z.x) + cx * L, (z.k === 'aim' ? b.y : z.y) + cy * L); x.stroke(); x.setLineDash([]);
        }
        x.restore();
      } else if (z.k === 'wave') {
        x.save(); x.beginPath(); x.rect(16, 16, W - 32, H - 32); x.clip();
        x.strokeStyle = '#ff8a3d'; x.lineWidth = 4; x.beginPath(); x.arc(z.x, z.y, z.r, z.ga + z.gw / 2, z.ga - z.gw / 2 + Math.PI * 2); x.stroke();
        x.strokeStyle = '#ffd23f'; x.lineWidth = 1.5; x.stroke();
        x.restore();
      }
    }
    // Ombres
    x.fillStyle = 'rgba(0,0,0,.28)';
    if (b.vis) { x.beginPath(); x.ellipse(b.x, b.y + 18, 16, 5, 0, 0, 7); x.fill(); }
    // Liste à trier en profondeur (y)
    const draw = [];
    if (b.vis || s.st === 'morph' || s.st === 'dying') draw.push({ y: b.y + 18, f: () => drawBoss(x, b, s, time) });
    for (const m of s.m) draw.push({ y: m[3] + 5, f: () => { x.drawImage(minionSprite(m[1], m[4] < 0), Math.round(m[2] - 5), Math.round(m[3] - 6 + (Math.floor(time * 8 + m[0]) % 2))); if (m[1] === 'bobomb' && Math.floor(time * 10) % 2) R('#ffffff', m[2] - 1, m[3] - 7, 1, 1); } });
    for (const pc of s.p) {
      const h = lerpHero(pc.id), info = heroInfo(pc.id);
      draw.push({ y: h.y + 2, f: () => drawHero(x, h, info, time) });
    }
    draw.sort((a, c) => a.y - c.y).forEach(d => d.f());
    // Esprits invoqués
    for (const f of s.f) { const bob = Math.sin(time * 6) * 1.5; R('#6ff8ff', f[0] - 2, f[1] - 3 + bob, 5, 5); R('#ffffff', f[0] - 1, f[1] - 2 + bob, 1, 1); R('#ffffff', f[0] + 1, f[1] - 2 + bob, 1, 1); R('#3ab0c8', f[0] - 2, f[1] + 2 + bob, 1, 1); R('#3ab0c8', f[0] + 2, f[1] + 2 + bob, 1, 1); }
    // Projectiles (extrapolés entre deux instantanés)
    const e = ext();
    for (const sh of s.s) drawBullet(x, sh[1], sh[2] + sh[4] * e, sh[3] + sh[5] * e, sh[4], sh[5], 0, time);
    for (const bl of s.b) drawBullet(x, bl[1], bl[2] + bl[4] * e, bl[3] + bl[5] * e, bl[4], bl[5], bl[6], time);
    // Particules
    view.parts = view.parts.filter(p => (p.life -= dt) > 0);
    for (const p of view.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; x.globalAlpha = clamp(p.life / p.max * 1.5, 0, 1); R(p.col, p.x, p.y, p.size, p.size); }
    x.globalAlpha = 1;
    // Mort du boss : explosions en chaîne
    if (s.st === 'dying') {
      view.deathT += dt;
      if (Math.random() < dt * 14) { const ex = b.x + (Math.random() - 0.5) * 50, ey = b.y + (Math.random() - 0.5) * 50; burst(ex, ey, 10, ['#ffffff', '#ffd23f', '#ff8a3d'], 60, 0.5, 2); if (Math.random() < 0.5) sfx('boom'); view.shake = Math.max(view.shake, 0.2); }
    }
    x.setTransform(1, 0, 0, 1, 0, 0);
    // Flash blanc (métamorphose, éclair, fin du boss)
    view.flash = Math.max(0, view.flash - dt);
    let white = view.flash > 0 ? view.flash * 1.4 : 0;
    if (s.st === 'morph') white = Math.max(white, (Math.floor(time * 8) % 2) * 0.35);
    if (s.st === 'dying') white = Math.max(white, clamp((4.2 - s.sT - 2.6) / 1.4, 0, 1)); // fondu vers le blanc de la cinématique
    if (white > 0) { x.fillStyle = `rgba(255,255,255,${clamp(white, 0, 1)})`; x.fillRect(0, HUD, W, H); }
    // Bandeau du haut (HUD) : barre de vie du boss
    R('#0d0a18', 0, 0, W, HUD);
    R('#f4f4f8', 0, HUD - 1, W, 1);
    const ratio = b.max ? clamp(b.hp / b.max, 0, 1) : 0, bw = 120;
    R('#1a1428', W - bw - 10, 12, bw + 2, 7); R('#4a2a3a', W - bw - 9, 13, bw, 5); R('#e8384a', W - bw - 9, 13, Math.round(bw * ratio), 5); R('#ff8a9a', W - bw - 9, 13, Math.round(bw * ratio), 1);
    for (let i = 0; i < 3; i++) { const done = i < s.form || (i === s.form && (s.st === 'dying')), cur = i === s.form; R(done ? '#4a2a3a' : cur ? '#ffd23f' : '#f4f4f8', W - bw - 10 + i * 9, 3, 6, 6); R('#1a1428', W - bw - 8 + i * 9, 5, 2, 1); }
  }

  function drawBoss(x, b, s, time) {
    let alpha = 1;
    if (b.st === 'intro') alpha = b.it > 2.2 ? (Math.floor(time * 12) % 2 ? 0.2 : 0.8) : 1;
    if (b.st === 'tele' && !b.vis) return;
    const bob = Math.round(Math.sin(time * 3) * 1.5), shk = (s.st === 'morph' || s.st === 'dying') ? Math.round((Math.random() - 0.5) * 4) : 0;
    const white = b.fl || (s.st === 'morph' && Math.floor(time * 14) % 2) || (s.st === 'dying' && Math.floor(time * 18) % 2);
    const spr = bossSprite(b.key, !!white);
    x.globalAlpha = alpha;
    x.imageSmoothingEnabled = false;
    x.drawImage(spr, Math.round(b.x - 24 + shk), Math.round(b.y - 30 + bob), 48, 48);
    if (b.dash) { x.globalAlpha = 0.35; x.drawImage(spr, Math.round(b.x - 24 - 6), Math.round(b.y - 30 + bob), 48, 48); }
    x.globalAlpha = 1;
  }

  function drawHero(x, h, info, time) {
    const R = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), w, hh); };
    if (h.ko) { // pierre tombale
      R('#1a1428', h.x - 5, h.y - 10, 10, 12); R('#b0b0c0', h.x - 4, h.y - 9, 8, 10); R('#80809a', h.x - 1, h.y - 7, 2, 6); R('#80809a', h.x - 3, h.y - 5, 6, 2);
      const gy = h.y - 18 - (time * 6 % 6); x.globalAlpha = 0.6; R('#ffffff', h.x - 2, gy, 4, 4); x.globalAlpha = 1;
      return;
    }
    if (h.inv && Math.floor(time * 16) % 2) return; // clignote après un coup
    x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(h.x, h.y + 2, 6, 2, 0, 0, 7); x.fill();
    const frame = h.mv ? Math.floor(time * 7) % 2 : 0, bob = h.mv ? 0 : (Math.floor(time * 2) % 2);
    x.drawImage(heroSprite(info.cls, info.color, frame, h.f < 0), Math.round(h.x - 8), Math.round(h.y - 14 + bob));
    if (h.sw) { // coup d'épée
      x.strokeStyle = '#ffffff'; x.lineWidth = 2; x.beginPath();
      const a0 = h.f < 0 ? Math.PI * 0.7 : -Math.PI * 0.3; x.arc(h.x, h.y - 6, 13, a0, a0 + Math.PI * 0.6); x.stroke();
    }
    if (h.sh) { x.strokeStyle = Math.floor(time * 8) % 2 ? '#9ad0ff' : '#4dabff'; x.lineWidth = 1; x.beginPath(); x.arc(h.x, h.y - 6, 11, 0, 7); x.stroke(); }
  }

  // Textes nets par-dessus l'image agrandie (noms, bandeaux)
  function drawText(time, dt) {
    const s = net.cur, c = view.bx, k = view.k;
    if (!s) return;
    const txt = (t, px, py, size, col, align = 'center', shadow = true) => {
      c.font = `${Math.round(size)}px ${FONT}`; c.textAlign = align; c.textBaseline = 'middle';
      if (shadow) { c.fillStyle = '#0d0a18'; c.fillText(t, px + Math.max(1, size / 8), py + Math.max(1, size / 8)); }
      c.fillStyle = col; c.fillText(t, px, py);
    };
    // HUD
    const name = (s.boss && (view.formNames[s.boss.key] || {}).name) || '';
    txt(name, 8 * k, 8 * k, Math.max(10, k * 5.5), '#ffd23f', 'left');
    txt(`FORME ${Math.min(3, s.form + 1)}/3`, 8 * k, 18 * k, Math.max(8, k * 3.2), '#f4f4f8', 'left', false);
    // Noms des héros
    for (const pc of s.p) {
      const h = lerpHero(pc.id), info = heroInfo(pc.id);
      txt(info.name, h.x * k, (HUD + h.y - (h.ko ? 17 : 21)) * k, Math.max(8, k * 3.2), PLAYER_COLORS[info.color % PLAYER_COLORS.length]);
    }
    // Petits textes flottants (PARADE !, sorts…)
    view.pops = view.pops.filter(p => (p.t -= dt) > 0);
    for (const p of view.pops) { c.globalAlpha = clamp(p.t * 2, 0, 1); txt(p.text, p.x * k, (HUD + p.y - (1 - p.t) * 10) * k, Math.max(8, k * 3.4), p.col); }
    c.globalAlpha = 1;
    // Bandeau d'attaque (boîte de dialogue façon Zelda)
    if (view.banner && (view.banner.t -= dt) > 0 && s.st === 'fight') {
      const bw = W * 0.86 * k, bh = 18 * k, bx = (W * k - bw) / 2, by = (HUD + H - 26) * k;
      c.fillStyle = '#0d0a18'; c.fillRect(bx, by, bw, bh); c.strokeStyle = '#f4f4f8'; c.lineWidth = k; c.strokeRect(bx + k, by + k, bw - 2 * k, bh - 2 * k);
      txt(view.banner.text.toUpperCase(), W * k / 2, by + bh / 2, Math.max(9, k * 4), '#ffffff', 'center', false);
    }
    // Présentation du boss
    const b = s.boss;
    if (b && b.st === 'intro') {
      const f = view.formNames[b.key] || { name: '', title: '' };
      const a = clamp((2.8 - b.it) * 2, 0, 1);
      c.globalAlpha = a;
      c.fillStyle = 'rgba(13,10,24,.75)'; c.fillRect(0, (HUD + 10) * k, W * k, 46 * k);
      txt(f.name, W * k / 2, (HUD + 26) * k, Math.max(16, k * 10), '#ffd23f');
      txt(f.title, W * k / 2, (HUD + 46) * k, Math.max(9, k * 4.5), '#ffffff');
      if (s.form > 0) txt(`MÉTAMORPHOSE ${s.form + 1}/3`, W * k / 2, (HUD + 64) * k, Math.max(9, k * 4.5), '#ff7ad9');
      c.globalAlpha = 1;
    }
    if (s.st === 'morph') txt('LE BOSS SE MÉTAMORPHOSE…', W * k / 2, (HUD + H / 2 + 44) * k, Math.max(10, k * 5), Math.floor(time * 4) % 2 ? '#ff7ad9' : '#ffffff');
    if (s.st === 'wiped') { c.fillStyle = 'rgba(13,10,24,.6)'; c.fillRect(0, HUD * k, W * k, H * k); txt('GAME OVER', W * k / 2, (HUD + H / 2) * k, Math.max(16, k * 6), '#e8384a'); }
  }

  function fitHost() {
    const wrap = document.querySelector('.bf-stage');
    if (!wrap || !view.big) return;
    const side = window.innerWidth > 1100;
    const availW = window.innerWidth - (side ? 330 : 40), availH = window.innerHeight - (side ? 90 : 260);
    const k = Math.max(2, Math.floor(Math.min(availW / W, availH / (H + HUD)) * 2) / 2);
    if (k !== view.k || view.big.width !== W * k) {
      view.k = k; view.big.width = W * k; view.big.height = (H + HUD) * k;
    }
  }

  function hostLoop() {
    let last = performance.now();
    const frame = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!document.body.contains(view.big)) { view.raf = 0; return; }
      const time = now / 1000;
      drawFight(time, dt);
      const c = view.bx; c.imageSmoothingEnabled = false;
      c.clearRect(0, 0, view.big.width, view.big.height);
      c.drawImage(view.low, 0, 0, view.big.width, view.big.height);
      drawText(time, dt);
      view.raf = requestAnimationFrame(frame);
    };
    cancelAnimationFrame(view.raf);
    view.raf = requestAnimationFrame(frame);
  }

  function updateHeroPanel(s) {
    const box = document.getElementById('bf-heroes');
    if (!box) return;
    for (const pc of s.p) {
      const el = box.querySelector(`[data-id="${CSS.escape(pc.id)}"]`);
      if (!el) continue;
      const sig = `${pc.hp}|${pc.ko}|${pc.sh}|${Math.round(pc.cd / 10)}`;
      if (el.dataset.sig === sig) continue;
      el.dataset.sig = sig;
      el.querySelector('.bf-hearts').innerHTML = heartsHTML(pc.hp, 2);
      el.classList.toggle('ko', pc.ko);
      el.querySelector('.bf-cd i').style.width = (100 - pc.cd) + '%';
      el.classList.toggle('ready', pc.cd <= 0);
      el.querySelector('.bf-state').textContent = pc.ko ? '💀 K.O.' : pc.sh ? '🛡️ Protégé' : pc.cd <= 0 ? '✨ Spécial prêt' : '';
    }
  }

  // ---------- Écrans de l'hôte ----------
  function hostPick(app, p, ctx) {
    document.body.classList.add('bf-body');
    const picks = p.data.picks || {}, players = ctx.players || [];
    const byCls = id => players.filter(pl => picks[pl.id] === id);
    const waiting = players.filter(pl => !picks[pl.id]);
    app.innerHTML = `<div class="bf bf-pick">
      <header class="bf-title"><small>BOSS FIGHT · COOPÉRATIF</small><h1>CHOISISSEZ VOTRE HÉROS</h1><p>Sur votre téléphone, choisissez une classe. Chacun a une attaque spéciale !</p>${ctx.timer}</header>
      <section class="bf-classes">${p.data.classes.map((c, i) => `<div class="bf-class ${byCls(c.id).length ? 'taken' : ''}">
        <div class="bf-class-art">${heroImg(c.id, i, 6)}</div>
        <b>${c.icon} ${esc(c.name)}</b><span>${esc(c.desc)}</span>
        <em>✨ ${esc(c.special)}<small>${esc(c.specialDesc || '')}</small></em>
        <div class="bf-pickers">${byCls(c.id).map(pl => `<span>${esc(pl.name)}</span>`).join('') || '<i>—</i>'}</div></div>`).join('')}</section>
      <footer class="bf-foot"><span>${waiting.length ? `⏳ En attente : ${waiting.map(pl => esc(pl.name)).join(', ')}` : '✅ Tout le monde a choisi !'}</span>
      <button id="bf-go" ${Object.keys(picks).length ? '' : 'disabled'}>⚔️ Entrer dans le donjon</button></footer>${ctx.stopButton}</div>`;
    document.getElementById('bf-go').onclick = () => ctx.emit('host:skip');
    ctx.bindStop();
  }

  function hostFight(app, p, ctx) {
    document.body.classList.add('bf-body');
    view.heroes = Object.fromEntries((p.data.heroes || []).map(h => [h.id, h]));
    view.formNames = Object.fromEntries((p.data.forms || []).map(f => [f.key, f]));
    if (view.n === p.n && document.body.contains(view.big)) return;
    view.n = p.n; view.parts = []; view.pops = []; view.banner = null;
    app.innerHTML = `<div class="bf bf-fight"><div class="bf-stage"><canvas id="bf-canvas" class="pixel"></canvas></div>
      <aside class="bf-side"><div class="bf-side-title">HÉROS</div><div id="bf-heroes">${(p.data.heroes || []).map(h => `<div class="bf-hero" data-id="${esc(h.id)}">
        ${heroImg(h.cls, h.color, 3)}<div class="bf-hero-main"><b style="color:${PLAYER_COLORS[h.color % 8]}">${esc(h.name)}</b><small>${CLASSES[h.cls].icon} ${esc(CLASSES[h.cls].name)} <span class="bf-state"></span></small>
        <div class="bf-hearts">${heartsHTML(20, 2)}</div><div class="bf-cd"><i></i></div></div></div>`).join('')}</div>
        ${p.data.continues ? `<p class="bf-cont">Continues : ${p.data.continues}</p>` : ''}${ctx.stopButton}</aside></div>`;
    view.big = document.getElementById('bf-canvas'); view.bx = view.big.getContext('2d');
    view.low = document.createElement('canvas'); view.low.width = W; view.low.height = H + HUD; view.lx = view.low.getContext('2d');
    view.k = 0; fitHost();
    window.onresize = fitHost;
    ctx.bindStop();
    hostLoop();
  }
  net.listeners.add(s => {
    if (view.n !== s.n) return;
    handleFx(s);
    updateHeroPanel(s);
  });

  function hostOver(app, p, ctx) {
    document.body.classList.add('bf-body');
    app.innerHTML = `<div class="bf bf-over"><h1>GAME OVER</h1><p>${esc(p.data.boss)} a vaincu l'équipe… (forme ${p.data.form + 1}/3)</p>
      <div class="bf-over-menu"><button id="bf-cont">▶ CONTINUER</button><button id="bf-quit" class="alt">ABANDONNER</button></div>
      <small>Continuer reprend le combat à cette forme, avec tous les cœurs. (bonus de victoire −100)</small></div>`;
    document.getElementById('bf-cont').onclick = () => ctx.emit('host:action', 'continue');
    document.getElementById('bf-quit').onclick = () => ctx.emit('host:skip');
  }

  // ---------- Cinématique de fin ----------
  const CREDITS = [
    ['big', 'Les Confipotes, le jeu'], ['gap'],
    ['', 'Inspiré par de longues soirées'], ['', 'à chercher un jeu pour nous divertir'], ['gap'],
    ['small', 'Créé par'], ['name', 'Elizou'], ['gap'],
    ['', 'Un grand merci à l\'ensemble'], ['', 'des membres du groupe Confipotes'], ['', 'pour leur fidélité, leur amitié et …'], ['gap'],
    ['', 'Beaucoup de pipi et de caca,'], ['', 'surtout le jour où j\'ai laissé'], ['', 'une petite crotte dans les toilettes'], ['', 'de Hélène.'], ['gap'],
  ];
  const END = { start: 1.5, fadeIn: 3.5, credits: 6, house: 54, endGame: 60, panel: 64 };
  function endingTimeline(p, off) { return (Date.now() + off - p.data.startAt) / 1000; }

  const ending = { raf: 0, n: null, skip: 0, low: null, lx: null, big: null, bx: null, k: 4, clouds: [], birds: [], smoke: [], faded: false, panel: false };
  function sceneBackground(x, t) {
    const R = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), w, h); };
    const SW = 240, SH = 160;
    // Ciel en bandes (dégradé « pixel »)
    const sky = ['#4aa8f0', '#5ab4f4', '#6ac0f6', '#7ccaf8', '#90d4fa', '#a6defc', '#bce8fc'];
    sky.forEach((c, i) => R(c, 0, i * 15, SW, 15)); // jusqu'à l'herbe (y = 104)
    R('#fff6c8', 196, 14, 14, 14); R('#ffffff', 199, 17, 8, 8); // soleil doux
    // Nuages
    for (const cl of ending.clouds) {
      const cx = ((cl.x - t * cl.v) % (SW + 60) + SW + 60) % (SW + 60) - 40;
      R('#ffffff', cx, cl.y, cl.w, 6); R('#ffffff', cx + 4, cl.y - 4, cl.w - 12, 4); R('#ffffff', cx + 8, cl.y - 7, cl.w / 3, 3); R('#e4f2fc', cx + 2, cl.y + 5, cl.w - 4, 2);
    }
    // Collines lointaines
    for (let i = 0; i < SW; i++) {
      const h1 = 18 + Math.sin(i / 23) * 8 + Math.sin(i / 9) * 2, h2 = 10 + Math.sin(i / 31 + 2) * 6;
      R('#8ccf8c', i, 96 - h1, 1, h1 + 10); R('#6ab86e', i, 104 - h2, 1, h2 + 2);
    }
    // Oiseaux
    for (const bd of ending.birds) {
      const bx = (bd.x + t * bd.v) % (SW + 40) - 20, by = bd.y + Math.sin(t * 2 + bd.x) * 3, up = Math.floor(t * 5 + bd.x) % 2;
      R('#3a3a5a', bx, by, 1, 1); R('#3a3a5a', bx - 2, by - (up ? 1 : -1), 2, 1); R('#3a3a5a', bx + 1, by - (up ? 1 : -1), 2, 1);
    }
    // Prairie
    R('#78c850', 0, 104, SW, SH - 104);
    for (let y = 106; y < SH; y += 5) for (let i = (y * 7) % 11; i < SW; i += 11) R('#5ea83e', i, y, 1, 2);
    // Chemin
    R('#e8cc90', 0, 128, SW, 10); R('#d4b478', 0, 137, SW, 1); R('#f4dcaa', 0, 129, SW, 1);
    // Arbres
    const tree = (a, b) => { R('#7a4a2a', a + 5, b + 14, 4, 10); R('#2f8f3a', a, b + 2, 14, 13); R('#3fb34f', a + 2, b, 10, 12); R('#5ccf5c', a + 4, b + 2, 4, 3); };
    tree(40, 82); tree(118, 86);
    // Maison isolée
    const hx = 182, hy = 92;
    R('#c84838', hx - 4, hy, 44, 4); R('#c84838', hx - 2, hy - 4, 40, 4); R('#a83428', hx + 2, hy - 8, 32, 4); R('#e06a50', hx - 2, hy - 4, 40, 1);
    R('#8a6a5a', hx + 26, hy - 16, 6, 10); // cheminée
    R('#f0e0b0', hx, hy + 4, 36, 30); R('#d8c490', hx, hy + 32, 36, 2);
    const lit = t > END.house;
    R('#5a3a2a', hx + 14, hy + 16, 9, 18); R('#ffd23f', hx + 20, hy + 25, 1, 1); // porte
    R('#1a1428', hx + 3, hy + 10, 8, 8); R(lit ? '#ffd86a' : '#6ab0e0', hx + 4, hy + 11, 6, 6); R('#1a1428', hx + 6, hy + 11, 1, 6);
    R('#1a1428', hx + 26, hy + 10, 8, 8); R(lit ? '#ffd86a' : '#6ab0e0', hx + 27, hy + 11, 6, 6); R('#1a1428', hx + 29, hy + 11, 1, 6);
    // Fumée de la cheminée
    if (Math.random() < 0.05) ending.smoke.push({ x: hx + 29, y: hy - 18, t: 0 });
    ending.smoke = ending.smoke.filter(s => (s.t += 1 / 60) < 4);
    for (const s of ending.smoke) { x.globalAlpha = clamp(1 - s.t / 4, 0, 0.8); R('#f4f4f8', s.x + Math.sin(s.t * 2) * 3 + s.t * 4, s.y - s.t * 9, 3 + s.t, 3 + s.t); }
    x.globalAlpha = 1;
    // Fleurs qui ondulent dans le vent
    for (let i = 0; i < 46; i++) {
      const fx = (i * 53) % SW, fy = 110 + (i * 37) % 46;
      if (fy > 125 && fy < 140) continue;
      const sway = Math.round(Math.sin(t * 1.6 + i) * 1);
      R('#3f8f2f', fx, fy, 1, 3); R(['#ffffff', '#ffd23f', '#ff7ad9', '#ff8a9a'][i % 4], fx - 1 + sway, fy - 2, 3, 2);
    }
  }
  function drawEnding(p, t) {
    const x = ending.lx, SW = 240;
    x.setTransform(1, 0, 0, 1, 0, 0);
    sceneBackground(x, t);
    // Les héros marchent vers la maison
    const heroes = p.data.heroes || [], door = 196, start = 4.5, arrive = END.house + 2;
    const spacing = 18, dist = door + 24 + spacing * Math.max(0, heroes.length - 1), speed = dist / (arrive - start);
    heroes.forEach((h, i) => {
      const hxp = -24 - i * spacing + Math.max(0, t - start) * speed;
      if (hxp >= door) return; // entré dans la maison
      const frame = Math.floor(t * 4 + i) % 2;
      x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(Math.round(hxp - 5), 136, 10, 2);
      x.drawImage(heroSprite(h.cls, h.color, frame, false), Math.round(hxp - 8), 122);
    });
    // Fondu depuis le blanc
    const white = t < END.start ? 1 : t < END.fadeIn + END.start ? 1 - (t - END.start) / END.fadeIn : 0;
    if (white > 0) { x.fillStyle = `rgba(255,255,255,${clamp(white, 0, 1)})`; x.fillRect(0, 0, SW, 160); }
    // Fondu au noir final derrière « END GAME »
    if (t > END.endGame) { x.fillStyle = `rgba(13,10,24,${clamp((t - END.endGame) / 2.5, 0, 0.82)})`; x.fillRect(0, 0, SW, 160); }
  }
  function drawEndingText(p, t) {
    const c = ending.bx, k = ending.k, SW = 240;
    const txt = (s, px, py, size, col, a = 1) => {
      c.globalAlpha = a; c.font = `${Math.round(size)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = 'rgba(13,10,24,.85)'; c.fillText(s, px + Math.max(1, size / 7), py + Math.max(1, size / 7)); c.fillStyle = col; c.fillText(s, px, py); c.globalAlpha = 1;
    };
    // Crédits qui défilent (dans le ciel, au-dessus des héros)
    const lines = [...CREDITS, ['small', 'Les héros'], ...(p.data.heroes || []).map(h => ['', `${h.name} · ${CLASSES[h.cls].name}`]), ['gap'],
      ['small', 'Boss vaincus'], ...(p.data.forms || []).map(f => ['', f.name]), ['gap'], ['small', 'Merci d\'avoir joué !']];
    const lh = { big: 28, name: 24, small: 15, '': 14, gap: 14 };
    const total = lines.reduce((s, l) => s + lh[l[0]], 0);
    const span = END.endGame - 1 - END.credits, top = 108, prog = (t - END.credits) / span;
    let y = top + 20 - prog * (total + top + 20);
    if (t > END.credits && t < END.endGame) {
      c.save(); c.beginPath(); c.rect(0, 0, SW * k, (top + 6) * k); c.clip();
      for (const [kind, s] of lines) {
        const h = lh[kind];
        if (kind !== 'gap' && y > -20 && y < top + 20) {
          const fade = clamp(Math.min(y / 16, (top - y) / 16), 0, 1);
          const size = { big: 7, name: 7, small: 4, '': 4.4 }[kind] * k;
          const col = { big: '#ffd23f', name: '#ff7ad9', small: '#1d1a3b', '': '#ffffff' }[kind];
          txt(kind === 'big' ? s.toUpperCase() : s, SW * k / 2, (y + h / 2) * k, Math.max(8, size), col, fade);
        }
        y += h;
      }
      c.restore();
    }
    if (t > END.endGame) {
      const a = clamp((t - END.endGame) / 1.5, 0, 1), word = 'END GAME', shown = Math.floor(clamp((t - END.endGame) * 6, 0, word.length));
      txt(word.slice(0, shown), SW * k / 2, 70 * k, Math.max(18, k * 9), '#ffd23f', a);
    }
  }
  function hostEnding(app, p, ctx) {
    document.body.classList.add('bf-body');
    if (ending.n === p.n && document.body.contains(ending.big)) return;
    ending.n = p.n; ending.skip = 0; ending.faded = false; ending.panel = false; ending.smoke = [];
    ending.clouds = Array.from({ length: 6 }, (_, i) => ({ x: i * 50 + Math.random() * 30, y: 14 + Math.random() * 40, w: 18 + Math.random() * 16, v: 2 + Math.random() * 3 }));
    ending.birds = Array.from({ length: 3 }, (_, i) => ({ x: i * 70, y: 30 + i * 9, v: 9 + i * 3 }));
    app.innerHTML = `<div class="bf bf-ending"><canvas id="bf-end" class="pixel"></canvas>
      <div class="bf-end-panel" id="bf-end-panel" hidden><h2>+ ${Math.max(...(p.data.rows || [{ pts: 0 }]).map(r => r.bonus || 0))} pts pour chaque héros</h2>
        <div class="bf-end-rows">${(p.data.rows || []).map(r => { const h = (p.data.heroes || []).find(e => e.id === r.id) || {}; return `<div>${heroImg(r.cls, h.color || 0, 2)}<b>${esc(r.name)}</b><small>${r.dmg} dégâts${r.help ? ` · ${r.help / 40} relevé(s)` : ''}</small><strong>+${r.pts}</strong></div>`; }).join('')}</div>
        <div class="bf-end-actions"><button id="bf-final">🏆 Classement final</button><button class="alt" id="bf-menu">🏠 Retour aux mini-jeux</button></div></div>
      <button class="bf-skip" id="bf-skip">⏭ Passer</button></div>`;
    ending.big = document.getElementById('bf-end'); ending.bx = ending.big.getContext('2d');
    ending.low = document.createElement('canvas'); ending.low.width = 240; ending.low.height = 160; ending.lx = ending.low.getContext('2d');
    const fit = () => { const k = Math.max(2, Math.floor(Math.min((window.innerWidth - 32) / 240, (window.innerHeight - 40) / 160) * 2) / 2); ending.k = k; ending.big.width = 240 * k; ending.big.height = 160 * k; };
    fit(); window.onresize = fit;
    document.getElementById('bf-skip').onclick = () => { ending.skip = Math.max(ending.skip, END.endGame - 0.5 - endingTimeline(p, ctx.off)); };
    document.getElementById('bf-final').onclick = () => ctx.emit('host:skip');
    document.getElementById('bf-menu').onclick = () => ctx.emit('host:lobby');
    cancelAnimationFrame(ending.raf);
    const frame = () => {
      if (!document.body.contains(ending.big)) { ending.raf = 0; return; }
      const t = endingTimeline(p, ctx.off) + ending.skip;
      drawEnding(p, t);
      const c = ending.bx; c.imageSmoothingEnabled = false; c.clearRect(0, 0, ending.big.width, ending.big.height);
      c.drawImage(ending.low, 0, 0, ending.big.width, ending.big.height);
      drawEndingText(p, t);
      if (t > END.endGame && !ending.faded) { ending.faded = true; if (window.partyAudio && window.partyAudio.fadeOut) window.partyAudio.fadeOut(6); }
      if (t > END.panel && !ending.panel) { ending.panel = true; document.getElementById('bf-end-panel').hidden = false; document.getElementById('bf-skip').hidden = true; }
      ending.raf = requestAnimationFrame(frame);
    };
    ending.raf = requestAnimationFrame(frame);
  }

  function host(app, p, ctx) {
    if (p.kind !== 'boss') { cancelAnimationFrame(view.raf); view.n = null; }
    if (p.kind !== 'bossEnding') { cancelAnimationFrame(ending.raf); ending.n = null; }
    if (p.kind === 'bossPick') hostPick(app, p, ctx);
    else if (p.kind === 'boss') hostFight(app, p, ctx);
    else if (p.kind === 'bossOver') hostOver(app, p, ctx);
    else if (p.kind === 'bossEnding') hostEnding(app, p, ctx);
  }

  // ---------- Téléphone : choix, manette, fin ----------
  const pad = { n: null, dx: 0, dy: 0, atk: false, sp: 0, last: '', timer: 0, send: null, keys: new Set(), me: null };
  function sendInput(force) {
    if (!pad.send) return;
    const v = { dx: Math.round(pad.dx * 100) / 100, dy: Math.round(pad.dy * 100) / 100, atk: pad.atk, sp: pad.sp };
    const sig = JSON.stringify(v);
    if (!force && sig === pad.last) return;
    pad.last = sig; pad.send(v);
  }
  function keyInput() {
    const k = pad.keys;
    if (!k.size) return;
    pad.dx = (k.has('ArrowRight') || k.has('d') ? 1 : 0) - (k.has('ArrowLeft') || k.has('q') || k.has('a') ? 1 : 0);
    pad.dy = (k.has('ArrowDown') || k.has('s') ? 1 : 0) - (k.has('ArrowUp') || k.has('z') || k.has('w') ? 1 : 0);
  }

  function playerPick(app, p, ctx) {
    document.body.classList.remove('bf-pad-mode');
    const picks = p.data.picks || {}, mine = picks[ctx.me], players = ctx.players || [];
    app.innerHTML = `${ctx.top}<div class="bf-phone bf-phone-pick"><h2>Choisis ton héros</h2>
      ${p.data.classes.map((c, i) => { const who = players.filter(pl => picks[pl.id] === c.id && pl.id !== ctx.me).map(pl => esc(pl.name)); return `<button class="bf-pick-btn ${mine === c.id ? 'sel' : ''}" data-c="${c.id}">
        ${heroImg(c.id, i, 3)}<span><b>${c.icon} ${esc(c.name)}</b><small>${esc(c.desc)}</small><em>✨ ${esc(c.special)} : ${esc(c.specialDesc || '')}</em>${who.length ? `<i>Aussi : ${who.join(', ')}</i>` : ''}</span></button>`; }).join('')}
      <p class="bf-hint">${mine ? `Tu joues <b>${esc(CLASSES[mine].name)}</b>. Tu peux encore changer d'avis !` : 'Touche une classe pour la choisir.'}</p></div>`;
    app.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { window.partyAudio && window.partyAudio.click(); ctx.action({ pick: b.dataset.c }); });
  }

  function playerFight(app, p, ctx) {
    document.body.classList.add('bf-pad-mode');
    const me = (p.data.heroes || []).find(h => h.id === ctx.me);
    if (pad.n === p.n && document.getElementById('bf-pad')) return;
    pad.n = p.n; pad.send = ctx.input; pad.me = ctx.me; pad.dx = 0; pad.dy = 0; pad.atk = false; pad.last = '';
    if (!me) { app.innerHTML = `${ctx.top}<div class="bf-phone"><p class="bf-hint">Le combat a commencé sans toi… regarde l'écran ! 👀</p></div>`; return; }
    const cls = CLASSES[me.cls];
    app.innerHTML = `<div class="bf-pad" id="bf-pad">
      <div class="bf-pad-top">${heroImg(me.cls, me.color, 3)}<div><b style="color:${PLAYER_COLORS[me.color % 8]}">${esc(me.name)}</b><small>${cls.icon} ${esc(cls.name)}</small></div><div class="bf-pad-hearts" id="bf-hearts">${heartsHTML(20, 3)}</div></div>
      <div class="bf-pad-msg" id="bf-msg">Regarde la télé ! Le boss arrive…</div>
      <div class="bf-pad-controls">
        <div class="bf-stick" id="bf-stick"><div class="bf-knob" id="bf-knob"></div></div>
        <div class="bf-btns">
          <button class="bf-b" id="bf-sp" type="button"><span>✨</span><small>${esc(cls.special)}</small><i id="bf-cdring"></i></button>
          <button class="bf-a" id="bf-atk" type="button"><span>${me.cls === 'tank' ? '⚔️' : cls.icon}</span><small>ATTAQUE</small></button>
        </div>
      </div></div>`;
    // Joystick
    const stick = document.getElementById('bf-stick'), knob = document.getElementById('bf-knob');
    let pid = null;
    const move = e => {
      const r = stick.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, max = r.width * 0.38;
      let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy);
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      const n = Math.hypot(dx, dy) / max;
      pad.dx = n < 0.18 ? 0 : dx / max; pad.dy = n < 0.18 ? 0 : dy / max;
      sendInput();
    };
    stick.onpointerdown = e => { e.preventDefault(); pid = e.pointerId; stick.setPointerCapture(pid); move(e); };
    stick.onpointermove = e => { if (e.pointerId === pid) move(e); };
    stick.onpointerup = stick.onpointercancel = e => { if (e.pointerId !== pid) return; pid = null; pad.dx = 0; pad.dy = 0; knob.style.transform = ''; sendInput(); };
    // Boutons (attaque maintenue = tir continu)
    const atk = document.getElementById('bf-atk'), sp = document.getElementById('bf-sp');
    atk.onpointerdown = e => { e.preventDefault(); atk.setPointerCapture(e.pointerId); pad.atk = true; atk.classList.add('on'); sendInput(); };
    atk.onpointerup = atk.onpointercancel = () => { pad.atk = false; atk.classList.remove('on'); sendInput(); };
    sp.onpointerdown = e => { e.preventDefault(); pad.sp++; sp.classList.add('on'); setTimeout(() => sp.classList.remove('on'), 150); sendInput(); };
    atk.oncontextmenu = sp.oncontextmenu = stick.oncontextmenu = e => e.preventDefault();
    clearInterval(pad.timer);
    pad.timer = setInterval(() => { if (!document.getElementById('bf-pad')) return clearInterval(pad.timer); keyInput(); sendInput(true); }, 200);
  }
  // Clavier (pour tester sur ordinateur) : flèches/ZQSD, J ou Espace = attaque, K = spécial
  window.addEventListener('keydown', e => {
    if (!document.getElementById('bf-pad')) return;
    if (e.key === ' ' || e.key === 'j') pad.atk = true;
    else if (e.key === 'k' && !e.repeat) pad.sp++;
    else pad.keys.add(e.key);
    keyInput(); sendInput();
  });
  window.addEventListener('keyup', e => {
    if (!document.getElementById('bf-pad')) return;
    if (e.key === ' ' || e.key === 'j') pad.atk = false; else pad.keys.delete(e.key);
    if (!pad.keys.size) { pad.dx = 0; pad.dy = 0; } else keyInput();
    sendInput();
  });
  // Mise à jour de la manette à chaque instantané
  const padState = { hp: null, ko: null, cd: null, msg: '' };
  net.listeners.add(s => {
    if (!document.getElementById('bf-pad') || pad.n !== s.n) return;
    const h = s.p.find(e => e.id === pad.me);
    if (!h) return;
    if (padState.hp !== h.hp) { document.getElementById('bf-hearts').innerHTML = heartsHTML(h.hp, 3); if (padState.hp !== null && h.hp < padState.hp && navigator.vibrate) navigator.vibrate(70); padState.hp = h.hp; }
    const ring = document.getElementById('bf-cdring');
    if (ring && padState.cd !== h.cd) { ring.style.setProperty('--cd', h.cd); document.getElementById('bf-sp').classList.toggle('ready', h.cd <= 0); if (padState.cd > 0 && h.cd <= 0 && navigator.vibrate) navigator.vibrate(25); padState.cd = h.cd; }
    document.getElementById('bf-pad').classList.toggle('ko', h.ko);
    let msg = s.boss.lb ? `⚠️ ${s.boss.lb}` : 'Esquive et attaque !';
    if (h.ko) msg = '💀 K.O. ! Un soigneur peut te relever… sinon attends la métamorphose.';
    else if (s.st === 'intro') msg = s.form ? `Le boss revient… forme ${s.form + 1}/3 !` : 'Le boss arrive… prépare-toi !';
    else if (s.st === 'morph') msg = '✨ Le boss se métamorphose !';
    else if (s.st === 'dying') msg = '💥 Le boss est vaincu !!!';
    else if (s.st === 'wiped') msg = '💀 Toute l\'équipe est tombée…';
    else if (h.sh) msg = '🛡️ Rempart : tu es protégé·e !';
    if (msg !== padState.msg) { padState.msg = msg; document.getElementById('bf-msg').textContent = msg; }
    for (const e of s.fx || []) if (e[0] === 'hurt' && e[1] === pad.me) sfx('hurt');
  });

  function playerOver(app, p, ctx) {
    document.body.classList.remove('bf-pad-mode');
    app.innerHTML = `${ctx.top}<div class="bf-phone bf-phone-over"><h2>GAME OVER</h2><p>${esc(p.data.boss)} a gagné cette fois…</p><p class="bf-hint">L'hôte choisit : continuer ou abandonner.</p></div>`;
  }
  function playerEnding(app, p, ctx) {
    document.body.classList.remove('bf-pad-mode');
    const r = (p.data.rows || []).find(x => x.id === ctx.me);
    app.innerHTML = `${ctx.top}<div class="bf-phone bf-phone-end"><h2 id="bf-pend">🎬 Victoire !</h2><p id="bf-ptxt">Regarde l'écran… la cinématique de fin commence.</p>
      ${r ? `<div class="bf-phone-pts" id="bf-ppts" hidden>${heroImg(r.cls, ((p.data.heroes || []).find(h => h.id === ctx.me) || {}).color || 0, 3)}<b>+${r.pts} pts</b><small>${r.dmg} dégâts infligés</small></div>` : ''}</div>`;
    clearInterval(pad.timer);
    pad.timer = setInterval(() => {
      const t = endingTimeline(p, ctx.off);
      if (!document.getElementById('bf-pend')) return clearInterval(pad.timer);
      if (t > END.endGame) {
        document.getElementById('bf-pend').textContent = 'END GAME';
        document.getElementById('bf-ptxt').textContent = 'Merci d\'avoir joué !';
        const pts = document.getElementById('bf-ppts'); if (pts) pts.hidden = false;
        if (window.partyAudio && window.partyAudio.fadeOut) window.partyAudio.fadeOut(6);
        clearInterval(pad.timer);
      }
    }, 250);
  }
  function player(app, p, ctx) {
    if (p.kind !== 'boss') document.body.classList.remove('bf-pad-mode');
    if (p.kind === 'bossPick') playerPick(app, p, ctx);
    else if (p.kind === 'boss') playerFight(app, p, ctx);
    else if (p.kind === 'bossOver') playerOver(app, p, ctx);
    else if (p.kind === 'bossEnding') playerEnding(app, p, ctx);
  }
  // Quitter le jeu : on retire les styles plein écran
  function leave() { document.body.classList.remove('bf-body', 'bf-pad-mode'); cancelAnimationFrame(view.raf); cancelAnimationFrame(ending.raf); view.n = null; ending.n = null; pad.n = null; window.onresize = null; }

  const KINDS = ['bossPick', 'boss', 'bossOver', 'bossEnding'];
  window.BossGame = { KINDS, host, player, onSnap, leave, CLASSES, PLAYER_COLORS, _sprites: { heroSprite, bossSprite, minionSprite, heartSprite, BOSS_ART, HERO, dungeon, sceneBackground, drawEnding, drawEndingText, ending, END } };
  if (document.fonts && document.fonts.load) document.fonts.load(`10px ${FONT}`).catch(() => {});
})();
