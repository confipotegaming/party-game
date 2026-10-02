// Boss Fight : combat coopératif en temps réel dans un donjon façon Zelda Game Boy.
// 1) Chacun choisit sa classe (archer, magicien, tank, soigneur, invocateur), tout le monde voit les choix.
// 2) Combat : la simulation tourne ici, côté serveur (20 images/s). Les téléphones envoient leurs commandes
//    (joystick, attaque, spécial) via l'évènement « input » ; l'état est diffusé à tous via l'évènement « boss ».
//    Le boss a 3 formes tirées au hasard parmi des boss mythiques du jeu vidéo.
// 3) Victoire : cinématique de fin (prairie, crédits, END GAME) puis des points pour tous les héros.
// L'affichage (pixel art, manette, cinématique) est dans public/boss.js.

const TICK_MS = 50;
const W = 240, H = 176, WALL = 16;           // salle de 15 × 11 tuiles de 16 px
const CX = W / 2, CY = H / 2;
const MAX_HP = 20;                            // 5 cœurs × 4 quarts
const PR = 6;                                 // rayon d'un héros
const PICK_S = 60;

const CLASSES = {
  archer:   { name: 'Archer',     icon: '🏹', special: 'Pluie de flèches', desc: 'Tire vite et de loin.',              atk: { cd: 0.38, dmg: 2,   speed: 210, kind: 'arrow' }, spCd: 10 },
  mage:     { name: 'Magicien',   icon: '🔮', special: 'Météore',          desc: 'Boules de feu puissantes.',          atk: { cd: 0.7,  dmg: 3.5, speed: 140, kind: 'fireball' }, spCd: 14 },
  tank:     { name: 'Tank',       icon: '🛡️', special: 'Rempart',          desc: 'Épée au corps à corps, pare un coup sur deux.', atk: { cd: 0.42, dmg: 4.5, melee: 30 }, spCd: 18 },
  heal:     { name: 'Soigneur',   icon: '💚', special: 'Soin sacré',       desc: 'Soigne les héros proches de lui.',   atk: { cd: 0.45, dmg: 1.5, speed: 170, kind: 'light' }, spCd: 16 },
  summoner: { name: 'Invocateur', icon: '👻', special: 'Invocation',       desc: 'Appelle un esprit qui attaque seul.', atk: { cd: 0.42, dmg: 1.5, speed: 170, kind: 'wisp' }, spCd: 15 },
};
const CLASS_IDS = Object.keys(CLASSES);
const SPECIAL_DESC = {
  archer: '7 flèches en éventail',
  mage: 'Un météore s\'écrase sur le boss',
  tank: 'Toute l\'équipe est invincible 4 s',
  heal: '+1 cœur à tous, relève les K.O.',
  summoner: 'Un esprit tire sur le boss 10 s',
};

// Les boss : chaque forme a son nom, son sous-titre et ses attaques (motifs génériques paramétrés).
const BOSSES = {
  sephiroth: { name: 'SEPHIROTH', title: 'L\'Ange à une aile', attacks: [
    { p: 'spiral', label: 'Plumes noires', kind: 'feather', arms: 3, speed: 70, dur: 3, rate: 0.12, spin: 2.2 },
    { p: 'charge', label: 'Octaslash', times: 3, speed: 260 },
    { p: 'rain', label: 'Supernova', kind: 'meteor', count: 16, speed: 85, dur: 3 },
    { p: 'beams', label: 'Lames de Masamune', count: 3 },
  ] },
  ganondorf: { name: 'GANONDORF', title: 'Le Roi du Malin', attacks: [
    { p: 'aimed', label: 'Boule d\'énergie (renvoie-la !)', kind: 'orb', count: 1, spread: 0, speed: 85, volleys: 3, gap: 1.1, reflect: true },
    { p: 'wave', label: 'Onde des ténèbres', count: 2, speed: 75 },
    { p: 'charge', label: 'Charge du trident', times: 2, speed: 230 },
    { p: 'burst', label: 'Éclats maléfiques', kind: 'dark', ring: 14, speed: 70, waves: 3, gap: 0.6 },
  ] },
  bowser: { name: 'BOWSER', title: 'Roi des Koopas', attacks: [
    { p: 'aimed', label: 'Souffle de feu', kind: 'fire', count: 5, spread: 0.5, speed: 95, volleys: 3, gap: 0.7 },
    { p: 'wave', label: 'Écrasement', count: 2, speed: 85 },
    { p: 'rain', label: 'Pluie de marteaux', kind: 'hammer', count: 14, speed: 90, dur: 3 },
    { p: 'minions', label: 'Bob-ombs !', kind: 'bobomb', count: 3 },
  ] },
  bobomb: { name: 'ROI BOB-OMB', title: 'Monarque explosif', attacks: [
    { p: 'minions', label: 'Armée de Bob-ombs', kind: 'bobomb', count: 4 },
    { p: 'bombs', label: 'Lancer royal', count: 5, delay: 1.3, r: 20 },
    { p: 'wave', label: 'Saut royal', count: 1, speed: 80 },
    { p: 'burst', label: 'Étincelles', kind: 'spark', ring: 12, speed: 75, waves: 3, gap: 0.5 },
  ] },
  diablo: { name: 'DIABLO', title: 'Seigneur de la Terreur', attacks: [
    { p: 'burst', label: 'Nova de feu', kind: 'fire', ring: 18, speed: 75, waves: 3, gap: 0.55 },
    { p: 'beams', label: 'Éclair rouge', count: 4 },
    { p: 'bombs', label: 'Feu de l\'enfer', count: 6, delay: 1.2, r: 18 },
    { p: 'spiral', label: 'Tempête de flammes', kind: 'fire', arms: 4, speed: 65, dur: 3, rate: 0.14, spin: -1.8 },
  ] },
  mewtwo: { name: 'MEWTWO', title: 'Le Pokémon génétique', attacks: [
    { p: 'spiral', label: 'Psyko', kind: 'psy', arms: 5, speed: 60, dur: 3, rate: 0.16, spin: 1.5 },
    { p: 'teleport', label: 'Téléport', kind: 'psy', ring: 12, speed: 80 },
    { p: 'aimed', label: 'Ball\'Ombre', kind: 'shadow', count: 3, spread: 0.35, speed: 100, volleys: 3, gap: 0.6 },
    { p: 'beams', label: 'Choc mental', count: 3 },
  ] },
  eggman: { name: 'Dr EGGMAN', title: 'Le génie maléfique', attacks: [
    { p: 'charge', label: 'Egg Mobile', times: 3, speed: 240 },
    { p: 'aimed', label: 'Missiles', kind: 'missile', count: 2, spread: 0.3, speed: 110, volleys: 4, gap: 0.5 },
    { p: 'minions', label: 'Badniks', kind: 'badnik', count: 3 },
    { p: 'bombs', label: 'Bombes à pics', count: 5, delay: 1.2, r: 18 },
  ] },
  ghirahim: { name: 'GHIRAHIM', title: 'Le Seigneur Démon', attacks: [
    { p: 'aimed', label: 'Dagues', kind: 'dagger', count: 6, spread: 0.9, speed: 115, volleys: 2, gap: 0.8 },
    { p: 'teleport', label: 'Claquement de doigts', kind: 'dagger', ring: 10, speed: 90 },
    { p: 'charge', label: 'Fente démoniaque', times: 2, speed: 270 },
    { p: 'rain', label: 'Pluie de dagues', kind: 'dagger', count: 18, speed: 100, dur: 3 },
  ] },
};
const BOSS_IDS = Object.keys(BOSSES);
// Difficulté de chaque forme (1re, 2e, 3e)
const FORM = [
  { hp: 1, speed: 1, rest: 1.7 },
  { hp: 1.2, speed: 1.15, rest: 1.35 },
  { hp: 1.45, speed: 1.3, rest: 1.05 },
];
const BULLET_R = { feather: 3, meteor: 5, orb: 6, dark: 3, fire: 4, hammer: 4, spark: 3, psy: 4, shadow: 5, missile: 4, dagger: 3 };

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const r1 = v => Math.round(v * 10) / 10;

// ---------- Phase 1 : choix des classes ----------
function pickPhase(room, api) {
  const g = room.g;
  api.setPhase({
    kind: 'bossPick', step: 'pick', title: 'Choisissez votre héros', prompt: 'Chaque classe a une attaque spéciale.',
    duration: PICK_S, expected: [],
    data: { classes: CLASS_IDS.map(id => ({ id, ...CLASSES[id], atk: undefined, specialDesc: SPECIAL_DESC[id] })), picks: g.picks },
  });
}

// ---------- Phase 2 : le combat ----------
function makeHeroes(room, api) {
  const g = room.g, ids = Object.keys(g.picks).filter(id => room.players[id]);
  return ids.map((id, i) => {
    const a = Math.PI / 2 + (i - (ids.length - 1) / 2) * 0.35;
    return {
      id, cls: g.picks[id], color: i % 8, x: CX + Math.cos(a) * 62, y: clamp(CY + Math.sin(a) * 62, WALL + PR, H - WALL - PR),
      hp: MAX_HP, ko: false, inv: 0, shield: 0, atkCd: 0.5, spCd: 2, face: 1, moving: false, swing: 0, blockNext: false,
      input: { dx: 0, dy: 0, atk: false, sp: 0, at: Date.now() }, spSeen: null, auraT: 0, dmg: 0, revives: 0, hits: 0,
    };
  });
}

function newBoss(g, n) {
  const key = g.forms[g.formIdx], f = FORM[g.formIdx];
  const max = Math.round((110 + 170 * n) * f.hp);
  return { key, x: CX, y: CY - 10, r: 17, hp: max, max, state: 'intro', t: 2.8, flash: 0, act: null, label: '', next: 1.2, order: shuffle(BOSSES[key].attacks), oi: 0, vis: true, vx: 0, vy: 0, goal: null };
}

function fightPhase(room, api) {
  const g = room.g;
  g.heroes = makeHeroes(room, api);
  g.boss = newBoss(g, g.heroes.length);
  g.bullets = []; g.shots = []; g.hazards = []; g.minions = []; g.summons = []; g.fx = []; g.uid = 1;
  g.state = 'intro'; g.stateT = 0;
  api.setPhase({
    kind: 'boss', step: 'fight', title: 'Boss Fight', prompt: 'Battez le boss tous ensemble !', expected: [],
    data: { forms: g.forms.map(k => ({ key: k, name: BOSSES[k].name, title: BOSSES[k].title })), heroes: g.heroes.map(h => ({ id: h.id, cls: h.cls, color: h.color, name: api.name(h.id) })), w: W, h: H, continues: g.continues },
  });
  g.fightN = room.phase.n;
  startLoop(room, api);
}

function startLoop(room, api) {
  const g = room.g;
  clearInterval(g.loop);
  let last = Date.now();
  g.loop = setInterval(() => {
    const ph = room.phase;
    if ((api.alive && !api.alive()) || !ph || ph.n !== g.fightN || ph.done || room.g !== g) return clearInterval(g.loop);
    const now = Date.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { step(room, api, dt); } catch (err) { console.error('[boss:step]', err); clearInterval(g.loop); }
  }, TICK_MS);
  if (g.loop.unref) g.loop.unref();
}

const fx = (g, ...e) => g.fx.push(e);
const alive = g => g.heroes.filter(h => !h.ko);

function hurtHero(g, h, n = 1) {
  if (h.ko || h.inv > 0 || h.shield > 0 || g.state !== 'fight') return false;
  if (h.cls === 'tank') { h.blockNext = !h.blockNext; if (!h.blockNext) { h.inv = 0.5; fx(g, 'block', h.id); return false; } }
  h.hp = Math.max(0, h.hp - n); h.hits++;
  h.inv = h.cls === 'tank' ? 1.4 : 1.1;
  fx(g, 'hurt', h.id);
  if (h.hp <= 0) { h.ko = true; fx(g, 'ko', h.id); }
  return true;
}

function hitBoss(g, dmg, by, x, y) {
  const b = g.boss;
  if (g.state !== 'fight' || !b.vis || b.state === 'tele') return;
  const h = g.heroes.find(e => e.id === by);
  const real = Math.min(b.hp, dmg);
  b.hp -= real; b.flash = 0.12;
  if (h) h.dmg += real;
  fx(g, 'hit', Math.round(x), Math.round(y));
  if (b.hp <= 0) bossDown(g);
}

function bossDown(g) {
  const b = g.boss;
  g.bullets = []; g.hazards = []; g.minions.forEach(m => fx(g, 'boom', Math.round(m.x), Math.round(m.y))); g.minions = [];
  if (g.formIdx < 2) { g.state = 'morph'; g.stateT = 3.2; fx(g, 'morph'); }
  else { g.state = 'dying'; g.stateT = 4.2; fx(g, 'dying'); }
  b.act = null; b.label = '';
}

// Cible d'attaque : le tank qui provoque (Rempart) sinon un héros au hasard
function target(g) {
  const al = alive(g);
  if (!al.length) return { x: CX, y: CY };
  const taunt = al.find(h => h.cls === 'tank' && h.shield > 0);
  return taunt || pick(al);
}

function spawnBullet(g, x, y, ang, speed, kind, extra) {
  g.bullets.push({ id: g.uid++, kind, x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, r: BULLET_R[kind] || 4, life: 7, ...extra });
}

// ---------- Les attaques du boss ----------
function startAttack(g) {
  const b = g.boss, atk = b.order[b.oi++ % b.order.length], sp = FORM[g.formIdx].speed;
  if (b.oi % b.order.length === 0) b.order = shuffle(b.order);
  b.act = { ...atk, t: 0, n: 0, sp, phase: 0 };
  b.label = atk.label;
  fx(g, 'say', atk.label);
  if (atk.p === 'beams') {
    const base = rnd(0, Math.PI);
    for (let i = 0; i < atk.count; i++) g.hazards.push({ k: 'beam', x: b.x, y: b.y, a: base + i * Math.PI / atk.count, t: 1.1 / Math.sqrt(sp), on: 0.55 });
  } else if (atk.p === 'bombs') {
    const al = alive(g);
    for (let i = 0; i < atk.count + Math.floor(g.heroes.length / 2); i++) {
      const tg = al.length && i < al.length * 1.5 ? al[i % al.length] : { x: rnd(40, W - 40), y: rnd(40, H - 40) };
      g.hazards.push({ k: 'bomb', x: clamp(tg.x + rnd(-10, 10), WALL + 8, W - WALL - 8), y: clamp(tg.y + rnd(-10, 10), WALL + 8, H - WALL - 8), r: atk.r, t: atk.delay / sp + i * 0.12, max: atk.delay / sp + i * 0.12 });
    }
    fx(g, 'throw');
  } else if (atk.p === 'minions') {
    const max = 6;
    for (let i = 0; i < atk.count && g.minions.length < max; i++) {
      const a = (i / atk.count) * Math.PI * 2;
      g.minions.push({ id: g.uid++, k: atk.kind, x: b.x + Math.cos(a) * 20, y: b.y + Math.sin(a) * 20, hp: 5, life: rnd(6, 8), speed: (atk.kind === 'badnik' ? 38 : 30) * sp });
    }
  } else if (atk.p === 'teleport') {
    b.state = 'tele'; b.vis = false; fx(g, 'tele', Math.round(b.x), Math.round(b.y));
  }
}

function runAttack(g, dt) {
  const b = g.boss, a = b.act;
  if (!a) return;
  a.t += dt;
  const sp = a.sp;
  const finish = () => { b.act = null; b.label = ''; b.next = FORM[g.formIdx].rest * rnd(0.85, 1.15); b.state = 'idle'; b.vis = true; };
  switch (a.p) {
    case 'burst': {
      const gap = a.gap / sp;
      while (a.n < a.waves && a.t >= 0.35 + a.n * gap) { burstRing(g, b.x, b.y, a.ring, a.speed * sp, a.kind, a.n * 0.2); a.n++; fx(g, 'shoot'); }
      if (a.n >= a.waves && a.t > 0.35 + a.waves * gap) finish();
      break;
    }
    case 'spiral': {
      const dur = a.dur;
      while (a.t < dur && a.n * a.rate / sp <= a.t) {
        const base = a.n * 0.22 * a.spin;
        for (let k = 0; k < a.arms; k++) spawnBullet(g, b.x, b.y, base + k * Math.PI * 2 / a.arms, a.speed * sp, a.kind);
        a.n++;
        if (a.n % 4 === 0) fx(g, 'shoot');
      }
      if (a.t >= dur + 0.3) finish();
      break;
    }
    case 'aimed': {
      const gap = a.gap / sp;
      while (a.n < a.volleys && a.t >= 0.45 + a.n * gap) {
        for (let v = 0; v < 1 + Math.floor((g.heroes.length - 1) / 3); v++) { // une salve de plus tous les 3 héros
          const tg = target(g), ang = Math.atan2(tg.y - b.y, tg.x - b.x);
          for (let k = 0; k < a.count; k++) {
            const off = a.count > 1 ? (k / (a.count - 1) - 0.5) * a.spread : 0;
            spawnBullet(g, b.x, b.y, ang + off, a.speed * sp, a.kind, a.reflect ? { reflect: true } : undefined);
          }
        }
        a.n++; fx(g, 'shoot');
      }
      if (a.n >= a.volleys && a.t > 0.45 + a.volleys * gap) finish();
      break;
    }
    case 'charge': {
      // phase 0 : visée (télégraphiée) · phase 1 : ruée · phase 2 : retour
      if (a.phase === 0) {
        if (!a.goal) { const tg = target(g); a.goal = { x: tg.x, y: tg.y }; a.ang = Math.atan2(tg.y - b.y, tg.x - b.x); g.hazards.push({ k: 'aim', x: b.x, y: b.y, a: a.ang, t: 0.75 / sp }); }
        if (a.t >= 0.75 / sp) { a.phase = 1; a.t = 0; fx(g, 'dash'); }
      } else if (a.phase === 1) {
        const s = a.speed * sp * dt;
        b.x += Math.cos(a.ang) * s; b.y += Math.sin(a.ang) * s;
        const out = b.x < WALL + b.r || b.x > W - WALL - b.r || b.y < WALL + b.r || b.y > H - WALL - b.r;
        b.x = clamp(b.x, WALL + b.r, W - WALL - b.r); b.y = clamp(b.y, WALL + b.r, H - WALL - b.r);
        if (out || a.t > 1.2) {
          fx(g, 'thud', Math.round(b.x), Math.round(b.y));
          a.n++; a.t = 0; a.goal = null; a.phase = a.n >= a.times ? 2 : 0;
        }
      } else {
        const d = Math.hypot(CX - b.x, CY - 10 - b.y);
        if (d < 3 || a.t > 2) finish();
        else { const s = Math.min(d, 90 * dt); b.x += (CX - b.x) / d * s; b.y += (CY - 10 - b.y) / d * s; }
      }
      break;
    }
    case 'rain': {
      const count = Math.round(a.count * (1 + g.heroes.length * 0.08)), every = a.dur / count;
      while (a.n < count && a.t >= 0.3 + a.n * every) {
        const al = alive(g), aimX = al.length && a.n % 3 === 0 ? pick(al).x : rnd(WALL + 6, W - WALL - 6);
        spawnBullet(g, clamp(aimX + rnd(-6, 6), WALL + 4, W - WALL - 4), WALL - 2, Math.PI / 2, a.speed * sp * rnd(0.85, 1.15), a.kind);
        a.n++;
        if (a.n % 3 === 0) fx(g, 'shoot');
      }
      if (a.n >= count && a.t > a.dur + 0.5) finish();
      break;
    }
    case 'wave': {
      while (a.n < a.count && a.t >= 0.5 + a.n * 1.1) {
        g.hazards.push({ k: 'wave', x: b.x, y: b.y, r: b.r, speed: a.speed * sp, ga: rnd(0, Math.PI * 2), gw: 0.75, hit: {} });
        a.n++; fx(g, 'thud', Math.round(b.x), Math.round(b.y));
      }
      if (a.n >= a.count && a.t > 0.6 + a.count * 1.1) finish();
      break;
    }
    case 'beams': case 'bombs': case 'minions':
      if (a.t >= (a.p === 'minions' ? 1.2 : 1.9)) finish();
      break;
    case 'teleport': {
      if (a.phase === 0 && a.t >= 0.6) {
        const tg = target(g);
        let x, y, tries = 0;
        do { x = rnd(WALL + 30, W - WALL - 30); y = rnd(WALL + 30, H - WALL - 30); tries++; } while (tries < 20 && Math.hypot(x - tg.x, y - tg.y) < 55);
        b.x = x; b.y = y; b.vis = true; b.state = 'attack'; a.phase = 1; a.t = 0; fx(g, 'tele', Math.round(x), Math.round(y));
      } else if (a.phase === 1) {
        while (a.n < 2 && a.t >= 0.35 + a.n * 0.5) { burstRing(g, b.x, b.y, a.ring, a.speed * sp, a.kind, a.n * 0.25); a.n++; fx(g, 'shoot'); }
        if (a.n >= 2 && a.t > 1.3) finish();
      }
      break;
    }
  }
}

function burstRing(g, x, y, n, speed, kind, off) {
  for (let i = 0; i < n; i++) spawnBullet(g, x, y, off + i * Math.PI * 2 / n, speed, kind);
}

// ---------- Héros : déplacement, attaque, spécial ----------
function heroShoot(g, h) {
  const c = CLASSES[h.cls].atk, b = g.boss;
  // Vise le sbire le plus proche s'il est tout près, sinon le boss
  let tg = b.vis ? b : null;
  for (const m of g.minions) if (dist(m, h) < 55 && (!tg || dist(m, h) < dist(tg, h))) tg = m;
  if (!tg) return false;
  h.face = tg.x < h.x ? -1 : 1;
  // Renvoyer la boule d'énergie de Ganondorf (n'importe quelle attaque, à bout portant)
  for (const bl of g.bullets) if (bl.reflect && !bl.back && Math.hypot(bl.x - h.x, bl.y - h.y) < 16) {
    const ang = Math.atan2(b.y - bl.y, b.x - bl.x), sp = Math.hypot(bl.vx, bl.vy) * 1.5;
    bl.vx = Math.cos(ang) * sp; bl.vy = Math.sin(ang) * sp; bl.back = h.id; fx(g, 'reflect', h.id);
  }
  if (c.melee) {
    h.swing = 0.2;
    fx(g, 'swing', h.id);
    if (tg === b ? dist(h, b) < b.r + c.melee : dist(h, tg) < c.melee) {
      if (tg === b) hitBoss(g, c.dmg, h.id, (h.x + b.x) / 2, (h.y + b.y) / 2); else hitMinion(g, tg, c.dmg, h);
    }
    return true;
  }
  const ang = Math.atan2(tg.y - h.y, tg.x - h.x);
  g.shots.push({ id: g.uid++, kind: c.kind, x: h.x, y: h.y, vx: Math.cos(ang) * c.speed, vy: Math.sin(ang) * c.speed, dmg: c.dmg, by: h.id, life: 2 });
  fx(g, 'pew', h.id, c.kind);
  return true;
}

function special(g, h) {
  const b = g.boss;
  fx(g, 'special', h.id, h.cls);
  if (h.cls === 'archer') {
    const ang = Math.atan2(b.y - h.y, b.x - h.x);
    for (let i = 0; i < 7; i++) { const a = ang + (i - 3) * 0.12; g.shots.push({ id: g.uid++, kind: 'arrow', x: h.x, y: h.y, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, dmg: 3.5, by: h.id, life: 2 }); }
  } else if (h.cls === 'mage') {
    g.hazards.push({ k: 'meteor', x: b.x, y: b.y, r: 34, t: 0.9, max: 0.9, by: h.id, dmg: 30 });
  } else if (h.cls === 'tank') {
    for (const e of g.heroes) if (!e.ko) e.shield = 4;
  } else if (h.cls === 'heal') {
    for (const e of g.heroes) {
      if (e.ko) { e.ko = false; e.hp = 8; e.inv = 1.5; h.revives++; fx(g, 'revive', e.id); }
      else e.hp = Math.min(MAX_HP, e.hp + 4);
    }
  } else if (h.cls === 'summoner') {
    g.summons = g.summons.filter(s => s.by !== h.id);
    g.summons.push({ by: h.id, t: 10, a: 0, cd: 0.5, x: h.x, y: h.y });
  }
}

function hitMinion(g, m, dmg, h) {
  m.hp -= dmg;
  if (m.hp <= 0) { m.dead = true; fx(g, 'boom', Math.round(m.x), Math.round(m.y)); if (h) h.dmg += 3; }
}

function moveHeroes(g, dt) {
  const b = g.boss, now = Date.now();
  for (const h of g.heroes) {
    h.inv = Math.max(0, h.inv - dt); h.shield = Math.max(0, h.shield - dt); h.swing = Math.max(0, h.swing - dt);
    h.atkCd = Math.max(0, h.atkCd - dt); h.spCd = Math.max(0, h.spCd - dt);
    const inp = h.input;
    if (now - inp.at > 1500) { inp.dx = 0; inp.dy = 0; inp.atk = false; } // téléphone silencieux : le héros s'arrête
    if (h.ko) { h.moving = false; continue; }
    let { dx, dy } = inp; const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    h.moving = len > 0.15;
    if (h.moving) {
      const speed = h.cls === 'tank' ? 68 : 78;
      h.x = clamp(h.x + dx * speed * dt, WALL + PR, W - WALL - PR);
      h.y = clamp(h.y + dy * speed * dt, WALL + PR + 2, H - WALL - PR);
      if (Math.abs(dx) > 0.2) h.face = dx < 0 ? -1 : 1;
    }
    // On ne traverse pas le boss : il repousse
    if (b.vis && g.state === 'fight') {
      const d = dist(h, b);
      if (d < b.r + PR) {
        const nx = (h.x - b.x) / (d || 1), ny = (h.y - b.y) / (d || 1);
        h.x = clamp(b.x + nx * (b.r + PR + 1), WALL + PR, W - WALL - PR); h.y = clamp(b.y + ny * (b.r + PR + 1), WALL + PR, H - WALL - PR);
        if (hurtHero(g, h)) { h.x = clamp(h.x + nx * 14, WALL + PR, W - WALL - PR); h.y = clamp(h.y + ny * 14, WALL + PR, H - WALL - PR); }
      }
    }
    if (g.state !== 'fight') continue;
    if (inp.atk && h.atkCd <= 0 && heroShoot(g, h)) h.atkCd = CLASSES[h.cls].atk.cd;
    if (h.spSeen === null) h.spSeen = inp.sp;
    if (inp.sp !== h.spSeen) { // nouvel appui sur « spécial »
      h.spSeen = inp.sp;
      if (h.spCd <= 0) { special(g, h); h.spCd = CLASSES[h.cls].spCd; }
    }
    // Aura du soigneur : +¼ de cœur toutes les 2,5 s aux héros proches
    if (h.cls === 'heal') {
      h.auraT += dt;
      if (h.auraT >= 2.5) {
        h.auraT = 0;
        for (const e of g.heroes) if (!e.ko && e.hp < MAX_HP && dist(e, h) < 40) { e.hp++; fx(g, 'heal', e.id); }
      }
    }
  }
}

function moveShots(g, dt) {
  const b = g.boss;
  for (const s of g.shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.x < WALL - 4 || s.x > W - WALL + 4 || s.y < WALL - 4 || s.y > H - WALL + 4) s.dead = true;
    if (s.dead) continue;
    for (const m of g.minions) if (!m.dead && Math.hypot(m.x - s.x, m.y - s.y) < 8) { hitMinion(g, m, s.dmg, g.heroes.find(h => h.id === s.by)); s.dead = true; break; }
    if (!s.dead && b.vis && Math.hypot(b.x - s.x, b.y - s.y) < b.r + 2) { hitBoss(g, s.dmg, s.by, s.x, s.y); s.dead = true; }
  }
  g.shots = g.shots.filter(s => !s.dead && s.life > 0);
  // Esprits de l'invocateur
  for (const sm of g.summons) {
    const h = g.heroes.find(e => e.id === sm.by);
    sm.t -= dt; sm.a += dt * 3; sm.cd -= dt;
    if (h) { sm.x = h.x + Math.cos(sm.a) * 16; sm.y = h.y - 4 + Math.sin(sm.a) * 10; }
    if (sm.cd <= 0 && b.vis && g.state === 'fight') {
      sm.cd = 0.35;
      const ang = Math.atan2(b.y - sm.y, b.x - sm.x);
      g.shots.push({ id: g.uid++, kind: 'spirit', x: sm.x, y: sm.y, vx: Math.cos(ang) * 180, vy: Math.sin(ang) * 180, dmg: 2, by: sm.by, life: 2 });
    }
  }
  g.summons = g.summons.filter(s => s.t > 0);
}

function moveDanger(g, dt) {
  const b = g.boss;
  // Projectiles du boss
  for (const bl of g.bullets) {
    bl.x += bl.vx * dt; bl.y += bl.vy * dt; bl.life -= dt;
    if (bl.x < WALL - 6 || bl.x > W - WALL + 6 || bl.y < WALL - 8 || bl.y > H - WALL + 6) bl.dead = true;
    if (bl.dead) continue;
    if (bl.back) { // boule renvoyée : touche le boss
      if (b.vis && Math.hypot(b.x - bl.x, b.y - bl.y) < b.r + bl.r) { hitBoss(g, 22, bl.back, bl.x, bl.y); bl.dead = true; fx(g, 'boom', Math.round(bl.x), Math.round(bl.y)); }
      continue;
    }
    for (const h of g.heroes) if (!h.ko && Math.hypot(h.x - bl.x, h.y - bl.y) < PR + bl.r - 1) { if (hurtHero(g, h) || h.shield > 0) { bl.dead = true; break; } }
  }
  g.bullets = g.bullets.filter(bl => !bl.dead && bl.life > 0);
  // Dangers au sol
  for (const z of g.hazards) {
    if (z.k === 'bomb' || z.k === 'meteor') {
      z.t -= dt;
      if (z.t <= 0) {
        z.dead = true; fx(g, 'boom', Math.round(z.x), Math.round(z.y));
        if (z.k === 'bomb') { for (const h of g.heroes) if (Math.hypot(h.x - z.x, h.y - z.y) < z.r + PR) hurtHero(g, h); }
        else {
          if (b.vis && Math.hypot(b.x - z.x, b.y - z.y) < z.r + b.r) hitBoss(g, z.dmg, z.by, z.x, z.y);
          for (const m of g.minions) if (Math.hypot(m.x - z.x, m.y - z.y) < z.r + 6) hitMinion(g, m, 99, null);
        }
      }
    } else if (z.k === 'beam') {
      z.t -= dt;
      if (z.t <= 0) {
        if (!z.fired) { z.fired = true; fx(g, 'zap'); }
        z.on -= dt;
        const cx = Math.cos(z.a), cy = Math.sin(z.a);
        for (const h of g.heroes) { const px = h.x - z.x, py = h.y - z.y; if (Math.abs(px * cy - py * cx) < 6 + PR - 2) hurtHero(g, h); }
        if (z.on <= 0) z.dead = true;
      }
    } else if (z.k === 'aim') {
      z.t -= dt; z.x = b.x; z.y = b.y; if (z.t <= 0) z.dead = true;
    } else if (z.k === 'wave') {
      z.r += z.speed * dt;
      for (const h of g.heroes) {
        if (h.ko || z.hit[h.id]) continue;
        const d = Math.hypot(h.x - z.x, h.y - z.y);
        if (Math.abs(d - z.r) < 5) {
          let da = Math.abs(((Math.atan2(h.y - z.y, h.x - z.x) - z.ga) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
          if (da > z.gw / 2) { z.hit[h.id] = true; hurtHero(g, h); }
        }
      }
      if (z.r > 300) z.dead = true;
    }
  }
  g.hazards = g.hazards.filter(z => !z.dead);
  // Sbires : foncent sur le héros le plus proche et explosent
  for (const m of g.minions) {
    if (m.dead) continue;
    m.life -= dt;
    let tg = null; for (const h of alive(g)) if (!tg || dist(h, m) < dist(tg, m)) tg = h;
    if (tg) { const d = dist(tg, m) || 1; m.x += (tg.x - m.x) / d * m.speed * dt; m.y += (tg.y - m.y) / d * m.speed * dt; m.face = tg.x < m.x ? -1 : 1; }
    if ((tg && dist(tg, m) < PR + 5) || m.life <= 0) {
      m.dead = true; fx(g, 'boom', Math.round(m.x), Math.round(m.y));
      for (const h of g.heroes) if (Math.hypot(h.x - m.x, h.y - m.y) < 20) hurtHero(g, h);
    }
  }
  g.minions = g.minions.filter(m => !m.dead);
}

function moveBoss(g, dt) {
  const b = g.boss;
  b.flash = Math.max(0, b.flash - dt);
  if (b.state === 'intro') { b.t -= dt; if (b.t <= 0) { b.state = 'idle'; g.state = 'fight'; } return; }
  if (b.act) return runAttack(g, dt);
  // Au repos : flotte vers un point au hasard, puis lance l'attaque suivante
  if (!b.goal || Math.hypot(b.goal.x - b.x, b.goal.y - b.y) < 3) b.goal = { x: rnd(CX - 60, CX + 60), y: rnd(CY - 35, CY + 25) };
  const d = Math.hypot(b.goal.x - b.x, b.goal.y - b.y) || 1, s = 26 * FORM[g.formIdx].speed * dt;
  b.x += (b.goal.x - b.x) / d * Math.min(s, d); b.y += (b.goal.y - b.y) / d * Math.min(s, d);
  b.next -= dt;
  if (b.next <= 0) { b.state = 'attack'; startAttack(g); }
}

// ---------- Une image de simulation ----------
function step(room, api, dt) {
  const g = room.g;
  g.fx = [];
  if (g.state === 'intro' || g.state === 'fight') {
    moveBoss(g, dt);
    moveHeroes(g, dt);
    if (g.state === 'fight') { moveShots(g, dt); moveDanger(g, dt); }
    if (g.state === 'fight' && !alive(g).length) { g.state = 'wiped'; g.stateT = 3; g.bullets = []; g.hazards = []; g.minions = []; fx(g, 'wiped'); }
  } else {
    g.stateT -= dt;
    moveHeroes(g, dt);
    moveShots(g, dt);
    if (g.stateT <= 0) {
      if (g.state === 'morph') {
        g.formIdx++;
        g.boss = newBoss(g, g.heroes.length);
        g.shots = [];
        for (const h of g.heroes) if (h.ko) { h.ko = false; h.hp = 8; h.inv = 2; fx(g, 'revive', h.id); }
        g.state = 'intro'; fx(g, 'intro', g.boss.key);
      } else if (g.state === 'dying') {
        g.won = true;
        emit(room, api);
        return api.end();
      } else if (g.state === 'wiped') {
        emit(room, api);
        return api.end();
      }
    }
  }
  emit(room, api);
}

function snapshot(room) {
  const g = room.g, b = g.boss, ph = room.phase;
  return {
    n: ph.n, st: g.state, sT: r1(g.stateT), form: g.formIdx,
    boss: { key: b.key, x: r1(b.x), y: r1(b.y), hp: Math.ceil(b.hp), max: b.max, st: b.state, vis: b.vis, fl: b.flash > 0, lb: b.label, it: r1(b.state === 'intro' ? b.t : 0), dash: !!(b.act && b.act.p === 'charge' && b.act.phase === 1) },
    p: g.heroes.map(h => ({ id: h.id, x: r1(h.x), y: r1(h.y), hp: h.hp, ko: h.ko, inv: h.inv > 0, sh: h.shield > 0, f: h.face, mv: h.moving, sw: h.swing > 0, cd: Math.round(h.spCd / CLASSES[h.cls].spCd * 100), ac: h.atkCd > 0 })),
    b: g.bullets.map(x => [x.id, x.kind, Math.round(x.x), Math.round(x.y), Math.round(x.vx), Math.round(x.vy), x.back ? 1 : 0]),
    s: g.shots.map(x => [x.id, x.kind, Math.round(x.x), Math.round(x.y), Math.round(x.vx), Math.round(x.vy)]),
    z: g.hazards.map(z => ({ k: z.k, x: Math.round(z.x), y: Math.round(z.y), r: Math.round(z.r || 0), t: r1(z.t || 0), m: r1(z.max || 0), a: z.a !== undefined ? Math.round(z.a * 100) / 100 : undefined, on: z.k === 'beam' && z.t <= 0, ga: z.ga !== undefined ? Math.round(z.ga * 100) / 100 : undefined, gw: z.gw })),
    m: g.minions.map(m => [m.id, m.k, Math.round(m.x), Math.round(m.y), m.face || 1]),
    f: g.summons.map(s => [Math.round(s.x), Math.round(s.y)]),
    fx: g.fx,
  };
}

function emit(room, api) {
  if (api.emit) api.emit('boss', snapshot(room));
}

// ---------- Fin du combat ----------
function rewards(room, api) {
  const g = room.g, total = g.heroes.reduce((s, h) => s + h.dmg, 0) || 1;
  const bonus = Math.max(250, 500 - g.continues * 100);
  return g.heroes.map(h => {
    const share = Math.round(h.dmg / total * 300), help = h.revives * 40;
    return { id: h.id, name: api.name(h.id), cls: h.cls, dmg: Math.round(h.dmg), bonus, share, help, pts: bonus + share + help };
  });
}

function endingPhase(room, api) {
  const g = room.g, rows = rewards(room, api);
  rows.forEach(r => api.addScore(r.id, r.pts));
  api.setPhase({
    kind: 'bossEnding', step: 'ending', title: 'Victoire !', expected: [],
    lines: rows.map(r => ({ main: `${CLASSES[r.cls].icon} ${r.name}`, sub: `${r.dmg} dégâts`, pts: r.pts })),
    data: { startAt: Date.now() + 300, heroes: g.heroes.map(h => ({ id: h.id, cls: h.cls, color: h.color, name: api.name(h.id) })), rows, forms: g.forms.map(k => ({ key: k, name: BOSSES[k].name, title: BOSSES[k].title })), continues: g.continues },
  });
}

module.exports = {
  id: 'boss', name: 'Boss Fight', minPlayers: 1,
  category: 'Action', categories: ['Action', 'Coopératif'],
  desc: 'Tous contre un ! Choisissez votre classe et affrontez dans un donjon pixel un boss aux 3 métamorphoses. (coopératif, jouable en solo)',
  CLASSES, BOSSES,

  start(room, api) {
    room.g = { picks: {}, forms: shuffle(BOSS_IDS).slice(0, 3), formIdx: 0, continues: 0, loop: null };
    pickPhase(room, api);
  },

  // Choix de classe : modifiable tant que le combat n'a pas commencé ; tout le monde voit les choix.
  playerAction(room, pid, v) {
    const ph = room.phase;
    if (!ph || ph.step !== 'pick' || !v || !CLASSES[v.pick]) return { status: 'ignored' };
    room.g.picks[pid] = v.pick;
    return { status: 'ok' };
  },

  // Commandes de la manette (sans rediffusion de l'état : la boucle de jeu s'en charge)
  input(room, pid, v) {
    const g = room.g, ph = room.phase;
    if (!g || !g.heroes || !ph || ph.step !== 'fight' || !v || typeof v !== 'object') return;
    const h = g.heroes.find(e => e.id === pid);
    if (!h) return;
    const num = x => { const n = Number(x); return Number.isFinite(n) ? clamp(n, -1, 1) : 0; };
    h.input = { dx: num(v.dx), dy: num(v.dy), atk: !!v.atk, sp: Number.isFinite(Number(v.sp)) ? Number(v.sp) : h.input.sp, at: Date.now() };
    if (h.spSeen === null || h.input.sp < h.spSeen) h.spSeen = h.input.sp; // téléphone rechargé : on se recale
  },

  validate() { return undefined; },

  hostAction(room, action, api) {
    const ph = room.phase;
    if (action === 'continue' && ph && ph.step === 'over') { room.g.continues++; fightPhase(room, api); }
  },

  onEnd(room, ph, api) {
    const g = room.g;
    if (ph.step === 'pick') {
      // Les retardataires reçoivent une classe au hasard (en privilégiant celles qui manquent)
      for (const id of api.ids()) if (!g.picks[id]) {
        const used = Object.values(g.picks), free = CLASS_IDS.filter(c => !used.includes(c));
        g.picks[id] = pick(free.length ? free : CLASS_IDS);
      }
      return fightPhase(room, api);
    }
    if (ph.step === 'fight') {
      clearInterval(g.loop);
      if (g.state === 'wiped') {
        return api.setPhase({ kind: 'bossOver', step: 'over', title: 'GAME OVER', expected: [], data: { boss: BOSSES[g.boss.key].name, form: g.formIdx, continues: g.continues } });
      }
      return endingPhase(room, api); // victoire (ou passage forcé par l'hôte)
    }
    api.finish();
  },

  _sim: { step, snapshot, W, H, MAX_HP },
};
