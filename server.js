// ===== MOTEUR GÉNÉRIQUE : salles, joueurs, phases, scores, chrono =====
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

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
  {id:'fox', name:'Renard', animal:'🦊', skin:'#f3c7a6', hair:'#6b3e2e', accent:'#f28c5b', tail:'fox'},
  {id:'cat', name:'Chat', animal:'🐱', skin:'#f1b98e', hair:'#2e294e', accent:'#ff91b5', tail:'cat'},
  {id:'bunny', name:'Lapin', animal:'🐰', skin:'#8d5524', hair:'#f5e1cf', accent:'#f3a8c6', tail:'bunny'},
  {id:'panda', name:'Panda', animal:'🐼', skin:'#6f432d', hair:'#191919', accent:'#7bd6c3', tail:'bear'},
  {id:'wolf', name:'Loup', animal:'🐺', skin:'#e0ad8c', hair:'#75869a', accent:'#7aa7ff', tail:'wolf'},
  {id:'deer', name:'Biche', animal:'🦌', skin:'#c98252', hair:'#4a2e22', accent:'#e9b44c', tail:'deer'},
  {id:'bear', name:'Ours', animal:'🐻', skin:'#5a3826', hair:'#241a18', accent:'#a88cf2', tail:'bear'},
  {id:'otter', name:'Loutre', animal:'🦦', skin:'#d99b73', hair:'#754c38', accent:'#56b7df', tail:'otter'},
  {id:'frog', name:'Grenouille', animal:'🐸', skin:'#f0c5a4', hair:'#3b5f3b', accent:'#74d66b', tail:'frog'},
  {id:'tiger', name:'Tigre', animal:'🐯', skin:'#d7a27b', hair:'#3a211b', accent:'#ffad42', tail:'tiger'},
  {id:'koala', name:'Koala', animal:'🐨', skin:'#b87958', hair:'#68727c', accent:'#9dc6ff', tail:'koala'},
  {id:'dalmatian', name:'Dalmatien', animal:'🐶', skin:'#f0c8ad', hair:'#3d3640', accent:'#ff7198', tail:'dog'},
  {id:'unicorn', name:'Licorne', animal:'🦄', skin:'#f4c9d8', hair:'#8b6de9', accent:'#64d8ff', tail:'unicorn'},
  {id:'redpanda', name:'Panda roux', animal:'🦊', skin:'#d49a70', hair:'#8d4930', accent:'#e98c55', tail:'redpanda'},
  {id:'seal', name:'Phoque', animal:'🦭', skin:'#b98f85', hair:'#536779', accent:'#73d5dd', tail:'seal'},
  {id:'penguin', name:'Pingouin', animal:'🐧', skin:'#9d6b55', hair:'#202a3b', accent:'#f5b544', tail:'bird'},
  {id:'pug', name:'Carlin', animal:'🐶', skin:'#e2b08b', hair:'#5a392c', accent:'#d9a98b', tail:'dog'},
  {id:'squirrel', name:'Écureuil', animal:'🐿️', skin:'#7a4b32', hair:'#3b261e', accent:'#d98255', tail:'squirrel'},
  {id:'hedgehog', name:'Hérisson', animal:'🦔', skin:'#c78e6c', hair:'#4b342a', accent:'#8f7bd9', tail:'hedgehog'},
  {id:'panda-wheel', name:'Panda fauteuil', animal:'🐼', skin:'#9a694e', hair:'#252525', accent:'#72c9bd', tail:'bear', accessory:'wheelchair'},
  {id:'fox-cane', name:'Renard canne', animal:'🦊', skin:'#d99a70', hair:'#4f3027', accent:'#ef8c5b', tail:'fox', accessory:'cane'},
  {id:'cat-prosthetic', name:'Chat prothèse', animal:'🐱', skin:'#9b654d', hair:'#2b2539', accent:'#e38bb0', tail:'cat', accessory:'prosthetic'},
  {id:'bunny-hearing', name:'Lapin appareil auditif', animal:'🐰', skin:'#f0c6aa', hair:'#744c66', accent:'#8ecdf2', tail:'bunny', accessory:'hearing'},
  {id:'deer-glasses', name:'Biche lunettes', animal:'🦌', skin:'#6e432f', hair:'#2f201c', accent:'#d9a94a', tail:'deer', accessory:'glasses'},
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
