// ===== MOTEUR GÉNÉRIQUE : salles, joueurs, phases, scores, chrono =====
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const APP_VERSION = '0.1.5';
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
{id:'fox-chef',name:'Renard chef',animal:'renard',accessory:'chef'},{id:'cat-hoodie',name:'Chat hoodie',animal:'chat',accessory:'headphones'},{id:'bunny-glasses',name:'Lapin lunettes',animal:'lapin',accessory:'glasses'},{id:'fox-freckles',name:'Renard roux',animal:'renard',accessory:'cap'},{id:'ram-dark',name:'Bélier solaire',animal:'belier',accessory:'drink'},{id:'dragon-blue',name:'Dragon bleu',animal:'dragon',accessory:'scarf'},{id:'bunny-wheel',name:'Lapin fauteuil',animal:'lapin',accessory:'wheelchair'},{id:'poodle-prosthetic',name:'Caniche prothèse',animal:'caniche',accessory:'prosthetic'},{id:'cat-vitiligo',name:'Chat vitiligo',animal:'chat',accessory:'vitiligo'},{id:'wolf-cane',name:'Loup canne',animal:'loup',accessory:'cane'},{id:'deer-hearing',name:'Biche appareil auditif',animal:'cerf',accessory:'hearing'},{id:'tiger-neutral',name:'Tigre street',animal:'tigre',accessory:'sunglasses'},{id:'frog-curls',name:'Grenouille boucles',animal:'grenouille',accessory:'backpack'},{id:'panda-dress',name:'Panda pastel',animal:'panda',accessory:'heartbag'},{id:'otter-camera',name:'Loutre photo',animal:'loutre',accessory:'camera'},{id:'bunny-red',name:'Lapin roux',animal:'lapin',accessory:'flower'},{id:'bear-cap',name:'Ours cool',animal:'ours',accessory:'cap'},{id:'koala-book',name:'Koala lecteur',animal:'koala',accessory:'book'},{id:'penguin-overall',name:'Pingouin jardinier',animal:'pingouin',accessory:'plant'},{id:'unicorn-magic',name:'Licorne magique',animal:'licorne',accessory:'wand'}
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
    n: ++room.pn, answers: {}, expected: [], done: false, ...ph,
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
  room.game.onEnd(room, ph, apiFor(room));
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
function view(room) {
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
      round: p.round, rounds: p.rounds, lines: p.lines, endsAt: p.endsAt, data: p.data,
      options: p.options && p.options.map(({ id, text }) => ({ id, text })),
      answered: Object.keys(p.answers), expected: p.expected,
    },
  };
}

function broadcast(room) {
  const v = view(room);
  if (room.host) io.to(room.host).emit('state', v);
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
    room.game.start(room, apiFor(room));
  });

  socket.on('host:skip', () => { const { room } = ctx(); if (room && socket.data.isHost) endPhase(room); });
  socket.on('host:lobby', () => { const { room } = ctx(); if (room && socket.data.isHost) toLobby(room); });

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
    ph.answers[pid] = v;
    reply('ok');
    broadcast(room);
    if (ph.expected.every(id => id in ph.answers)) endPhase(room);
  });

  // Dessin : le dessinateur envoie des segments, relayés à l'écran de l'hôte
  socket.on('draw', (d) => {
    const { room, pid } = ctx();
    const ph = room && room.phase;
    if (!ph || ph.kind !== 'draw' || ph.drawer !== pid || ph.done || !d) return;
    const out = { n: ph.n };
    if (d.clear) out.clear = true;
    else if (Array.isArray(d.segs))
      out.segs = d.segs.slice(0, 200).filter(a => Array.isArray(a) && a.length === 4 && a.every(x => typeof x === 'number'));
    else return;
    io.to(room.host).emit('draw', out);
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
