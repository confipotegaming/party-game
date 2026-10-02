// ===== MOTEUR GÉNÉRIQUE : salles, joueurs, phases, scores, chrono =====
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const APP_VERSION = '0.1.8';
const MIN_PLAYERS = 2; // mettez 1 pour tester seul
const PORT = process.env.PORT || 3000;

// Pour ajouter un jeu : créez games/monjeu.js et ajoutez-le ici.
const games = {};
for (const id of [
  'funny', 'finislaphrase', 'estimation', 'leplusprobable', 'quiadit', 'deuxverites',
  'emojis', 'filmresume', 'quisuisje', 'motatrous', 'express', 'quatreimages',
  'intrus', 'survive', 'choixgroupe', 'classement', 'motinterdit', 'dessin',
]) games[id] = require('./games/' + id);

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));

const rooms = {};

const AVATARS = [
  {id:'chef-renarde',name:'Chef Renarde',animal:'Renard',accessory:'toque'},
  {id:'skateur-renard',name:'Renard skateur',animal:'Renard',accessory:'bonnet'},
  {id:'lapin-lunettes',name:'Lapin lunettes',animal:'Lapin',accessory:'lunettes'},
  {id:'renard-jardinier',name:'Renard jardinier',animal:'Renard',accessory:'salopette'},
  {id:'ours-cafe',name:'Ours café',animal:'Ours',accessory:'casque'},
  {id:'dragon-casque',name:'Dragon casqué',animal:'Dragon',accessory:'casque'},
  {id:'chat-fauteuil',name:'Chat en fauteuil',animal:'Chat',accessory:'fauteuil'},
  {id:'roux-lunettes',name:'Humain·e roux·se',animal:'Humain',accessory:'lunettes'},
  {id:'chien-hoodie',name:'Chien hoodie',animal:'Chien',accessory:'hoodie'},
  {id:'tigre-casquette',name:'Tigre casquette',animal:'Tigre',accessory:'casquette'},
  {id:'licorne-pastel',name:'Licorne pastel',animal:'Licorne',accessory:'paillettes'},
  {id:'pirate-perroquet',name:'Pirate perroquet',animal:'Humain',accessory:'perroquet'},
  {id:'dancer-bat',name:'Chauve-souris danseuse',animal:'Chauve-souris',accessory:'bonnet'},
  {id:'koala-livre',name:'Koala lecteur·rice',animal:'Koala',accessory:'livre'},
  {id:'lapin-gouter',name:'Lapin goûter',animal:'Lapin',accessory:'gâteau'}
];
const avatarById = id => AVATARS.find(a => a.id === id) || AVATARS[0];
const newCode = () => {
  const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let c;
  do { c = Array.from({ length: 4 }, () => L[Math.random() * L.length | 0]).join(''); } while (rooms[c]);
  return c;
};

// ----- Phases -----
function setPhase(room, ph) {
  clearTimeout(room.timer);
  room.phase = {
    n: ++room.pn, answers: {}, rawAnswers: {}, expected: [], done: false, ...(ph.kind === 'draw' ? { drawing: [], drawSeq: 0 } : {}), ...ph,
    endsAt: ph.duration ? Date.now() + ph.duration * 1000 : null,
  };
  if (ph.duration) room.timer = setTimeout(() => endPhase(room), ph.duration * 1000);
  broadcast(room);
}

function endPhase(room) {
  const ph = room.phase;
  if (!room.game || !ph || ph.done) return;
  ph.done = true;
  clearTimeout(room.timer);
  try {
    room.game.onEnd(room, ph, apiFor(room));
  } catch (err) {
    console.error('[game:onEnd]', room.game && room.game.id, err);
    setPhase(room, { kind: 'error', step: 'error', title: 'Une erreur est survenue', prompt: 'La partie peut être reprise depuis le menu.', error: String(err && err.message || err) });
  }
}

function apiFor(room) {
  return {
    setPhase: (ph) => setPhase(room, ph),
    ids: () => Object.values(room.players).filter(p => p.connected).map(p => p.id),
    name: (id) => (room.players[id] || {}).name || '?',
    addScore: (id, n) => { if (room.players[id]) room.players[id].score += n; },
    finish: () => setPhase(room, { kind: 'scores' }),
  };
}

function toLobby(room) {
  clearTimeout(room.timer);
  room.game = null;
  room.gameCategory = null;
  room.g = null;
  setPhase(room, { kind: 'lobby', category: null });
}

// ----- Diffusion de l'état -----
function view(room, forHost = false) {
  const p = room.phase;
  return {
    code: room.code,
    now: Date.now(),
    game: room.game && room.game.id,
    avatars: AVATARS,
    version: APP_VERSION,
    games: Object.values(games).map(({ id, name, desc, category, categories }) => ({
      id, name, desc, category: category || 'Général', categories: categories || [category || 'Général'],
    })),
    min: MIN_PLAYERS,
    players: Object.values(room.players).map(({ id, name, score, connected, avatar }) => ({ id, name, score, connected, avatar: avatarById(avatar).id })),
    phase: p && {
      n: p.n, kind: p.kind, step: p.step, title: p.title, prompt: p.prompt, unit: p.unit, category: p.category || (room.game && room.game.category) || 'Général',
      ...(p.kind === 'draw' ? { drawingCount: (p.drawing || []).length } : {}),
      round: p.round, rounds: p.rounds, lines: p.lines, endsAt: p.endsAt, data: p.data,
      options: p.options && p.options.map(({ id, text }) => ({ id, text })),
      answered: Object.keys(p.answers), expected: p.expected, error: p.error,
      ...(forHost ? { answers: Object.entries(p.answers).map(([id, value]) => ({ id, name: (room.players[id] || {}).name || '?', value: publicAnswer(p, (p.rawAnswers || {})[id], value) })) } : {}),
    },
  };
}

function publicAnswer(ph, raw, value) {
  if (!ph) return null;
  value = raw === undefined ? value : raw;
  if (ph.kind === 'vote') { const o = (ph.options || []).find(x => x.id === value); return o ? o.text : value; }
  if (ph.kind === 'rank' && Array.isArray(value)) return value;
  if (typeof value === 'string') return value.slice(0, 240);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value && typeof value === 'object') return value;
  return String(value ?? '');
}

function broadcast(room) {
  const v = view(room, false);
  if (room.host) io.to(room.host).emit('state', view(room, true));
  for (const pl of Object.values(room.players)) {
    if (!pl.sid) continue;
    const mine = ((room.phase && room.phase.options) || []).filter(o => o.by === pl.id).map(o => o.id);
    const priv = ((room.phase && room.phase.private) || {})[pl.id]; // infos secrètes (mot à dessiner…)
    io.to(pl.sid).emit('state', { ...v, me: { id: pl.id, mine, priv } });
  }
}

// ----- Sockets -----
io.on('connection', (socket) => {
  const ctx = () => {
    const room = rooms[socket.data.code];
    return room ? { room, pid: socket.data.pid } : {};
  };

  socket.on('host:create', () => {
    const room = { code: newCode(), host: socket.id, players: {}, game: null, g: null, phase: null, timer: null, pn: 0 };
    rooms[room.code] = room;
    socket.data.code = room.code;
    socket.data.isHost = true;
    socket.join(room.code);
    setPhase(room, { kind: 'lobby', category: null });
  });

  socket.on('host:start', (gameId) => {
    const { room } = ctx();
    if (!room || !socket.data.isHost || !games[gameId]) return;
    if (Object.values(room.players).filter(p => p.connected).length < MIN_PLAYERS) return;
    Object.values(room.players).forEach(p => (p.score = 0));
    room.game = games[gameId];
    room.gameCategory = room.game.category || 'Général';
    try {
      room.game.start(room, apiFor(room));
    } catch (err) {
      console.error('[game:start]', gameId, err);
      setPhase(room, { kind: 'error', step: 'error', title: 'Impossible de lancer ce jeu', prompt: 'Une erreur technique a été détectée.', error: String(err && err.message || err) });
    }
  });

  socket.on('host:skip', () => { const { room } = ctx(); if (room && socket.data.isHost) endPhase(room); });
  socket.on('host:lobby', () => { const { room } = ctx(); if (room && socket.data.isHost) toLobby(room); });
  socket.on('host:sync-draw', () => {
    const { room } = ctx();
    const ph = room && room.phase;
    if (!room || !socket.data.isHost || !ph || ph.kind !== 'draw') return;
    socket.emit('draw', { n: ph.n, full: true, segs: ph.drawing || [] });
  });

  socket.on('join', ({ code, name, pid, avatar }, ack) => {
    code = String(code || '').toUpperCase().trim();
    name = String(name || '').trim().slice(0, 14);
    const room = rooms[code];
    if (!room) return ack && ack({ error: 'Code introuvable.' });
    let pl = pid && room.players[pid];
    if (!pl) {
      if (!name) return ack && ack({ error: 'Choisissez un pseudo.' });
      if (room.game) return ack && ack({ error: 'La partie a déjà commencé.' });
      if (Object.values(room.players).some(p => p.name.toLowerCase() === name.toLowerCase()))
        return ack && ack({ error: 'Ce pseudo est déjà pris.' });
      pid = Math.random().toString(36).slice(2, 10);
      pl = room.players[pid] = { id: pid, name, score: 0, avatar: avatarById(avatar).id, sid: null, connected: true };
    }
    if (avatar) pl.avatar = avatarById(avatar).id;
    pl.sid = socket.id;
    pl.connected = true;
    socket.data.code = code;
    socket.data.pid = pl.id;
    socket.join(code);
    ack && ack({ ok: true, pid: pl.id, name: pl.name });
    broadcast(room);
  });

  // ack : 'ok' (accepté), 'invalid' (refusé, le joueur peut réessayer), 'ignored'
  socket.on('answer', (value, ack) => {
    const reply = (r) => typeof ack === 'function' && ack(r);
    const { room, pid } = ctx();
    const ph = room && room.phase;
    if (!ph || ph.done || !room.game || !ph.expected.includes(pid) || pid in ph.answers) return reply('ignored');
    const v = room.game.validate(ph, pid, value);
    if (v === undefined) return reply('invalid');
    ph.rawAnswers[pid] = value;
    ph.answers[pid] = v;
    reply('ok');
    broadcast(room);
    if (ph.expected.every(id => id in ph.answers)) endPhase(room);
  });

  // Dessin : le dessinateur envoie des segments, relayés à l'écran de l'hôte
  socket.on('draw', (d, ack) => {
    const { room, pid } = ctx();
    const ph = room && room.phase;
    if (!room || !ph || ph.kind !== 'draw' || ph.drawer !== pid || ph.done || !d) return;
    const out = { n: ph.n, seq: ++ph.drawSeq };
    if (d.clear) {
      ph.drawing = [];
      out.clear = true;
    } else if (Array.isArray(d.segs)) {
      // Keep only finite normalized coordinates. This prevents malformed packets
      // from breaking the host canvas and makes the stream deterministic.
      out.segs = d.segs.slice(0, 250).filter(a => Array.isArray(a) && a.length === 4 && a.every(x => Number.isFinite(x) && x >= 0 && x <= 1));
      if (!out.segs.length) return;
      ph.drawing.push(...out.segs);
      if (ph.drawing.length > 16000) ph.drawing.splice(0, ph.drawing.length - 16000);
    } else return;
    // Direct, low-latency stream to the host. The complete snapshot remains on the
    // phase so a reconnect or a late packet can always be repaired with sync-draw.
    io.to(room.host).emit('draw', out);
    if (typeof ack === 'function') ack({ ok: true, seq: out.seq });
  });

  socket.on('disconnect', () => {
    const { room, pid } = ctx();
    if (!room) return;
    if (socket.data.isHost) {
      clearTimeout(room.timer);
      io.to(room.code).emit('closed');
      delete rooms[room.code];
    } else if (room.players[pid]) {
      room.players[pid].connected = false;
      if (!room.game) delete room.players[pid]; // au lobby, on retire le joueur
      broadcast(room);
    }
  });
});

server.listen(PORT, () => console.log(`Jeu lancé : http://localhost:${PORT}`));
