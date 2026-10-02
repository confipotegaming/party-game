// ===== MOTEUR GÉNÉRIQUE : salles, joueurs, phases, scores, chrono =====
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const APP_VERSION = '0.1.24';
const MIN_PLAYERS = 2; // mettez 1 pour tester seul
const PORT = process.env.PORT || 3000;

// Pour ajouter un jeu : créez games/monjeu.js et ajoutez-le ici.
const games = {};
for (const id of [
  'funny', 'finislaphrase', 'estimation', 'leplusprobable', 'quiadit', 'deuxverites',
  'emojis', 'filmresume', 'quisuisje', 'motatrous', 'express', 'quatreimages',
  'intrus', 'survive', 'choixgroupe', 'classement', 'motinterdit', 'dessin', 'cerveau', 'sondage', 'academie', 'wario', 'boss', 'pixelflou',
]) games[id] = require('./games/' + id);
// Mode plateau : tirage des mini-jeux à la roue. Le jeu du boss en est exclu (voir games/_board.js).
const board = require('./games/_board');
const SPIN_MS = 6500;      // durée de l'animation de la roue
const SPIN_REVEAL_S = 6;   // affichage du jeu tiré avant son lancement
const RESULTS_S = 25;      // écran du plateau entre deux mini-jeux

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));
// Un jeu peut exposer sa propre API (ex. back-office de ses questions) sous /api/games/<id>.
for (const g of Object.values(games)) if (g.router) app.use('/api/games/' + g.id, g.router);

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
const avatarById = avatar => {
  if (avatar && typeof avatar === 'object' && avatar.type === 'pony') {
    const safe = { type:'pony', version:2, name:'Mon poney', race:1, silhouette:1, coat:0, coatColor:'#ffffff',
      bodyColor:'#c9a6e8', mane:0, maneColor:'#2f2a7a', maneColor2:'#ec4f97', streak:1, tail:0,
      eyes:0, eyeColor:'#6a3f9c', mark:1, markColor:'#ec4f97', hat:0, glasses:0, neck:0,
      clothes:0, accessoryColor:'#ffd43b', effect:0 };
    if (avatar.version !== 2) { // ancien format : couleurs + race seulement
      safe.race = avatar.horn > 0 && avatar.wings > 0 ? 3 : avatar.horn > 0 ? 1 : avatar.wings > 0 ? 2 : 0;
      for (const k of ['name','bodyColor','maneColor','eyeColor','markColor','accessoryColor']) if (avatar[k] !== undefined) safe[k] = avatar[k];
    } else for (const k of Object.keys(safe)) if (k !== 'type' && k !== 'version' && avatar[k] !== undefined) safe[k] = avatar[k];
    const hex = (v, d) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : d;
    for (const k of ['bodyColor','coatColor','maneColor','maneColor2','eyeColor','markColor','accessoryColor']) safe[k] = hex(safe[k], '#c9a6e8');
    for (const k of ['race','silhouette','coat','mane','streak','tail','eyes','mark','hat','glasses','neck','clothes','effect']) safe[k] = Math.max(0, Math.min(20, Number(safe[k]) | 0));
    safe.name = String(safe.name || 'Mon poney').slice(0, 24);
    return safe;
  }
  return AVATARS.find(a => a.id === avatar) ? avatar : AVATARS[0].id;
};
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
    n: ++room.pn, answers: {}, rawAnswers: {}, expected: [], done: false, ...(ph.kind === 'draw' ? { drawing: [], drawOps: [], drawSeq: 0 } : {}), ...ph,
    endsAt: ph.duration ? Date.now() + ph.duration * 1000 : null,
  };
  if (ph.duration) room.timer = setTimeout(() => endPhase(room), ph.duration * 1000);
  broadcast(room);
}

function endPhase(room) {
  const ph = room.phase;
  if (!ph || ph.done) return;
  if (ph.board) { ph.done = true; clearTimeout(room.timer); return boardOnEnd(room, ph); }
  if (!room.game) return;
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
    end: () => endPhase(room), // termine la phase en cours avant la fin du chrono
    // En mode plateau, la fin d'un mini-jeu renvoie au plateau au lieu du classement final.
    finish: () => (room.board && room.game ? boardAfterGame(room) : setPhase(room, { kind: 'scores' })),
    // Jeux en temps réel : diffusion d'un évènement à toute la salle (hôte + joueurs), sans l'état complet
    emit: (event, data) => io.to(room.code).emit(event, data),
    alive: () => rooms[room.code] === room, // faux une fois la salle fermée (l'hôte est parti)
  };
}

// ----- Mode plateau : la roue enchaîne les mini-jeux, le meilleur total de points l'emporte -----
const connectedCount = (room) => Object.values(room.players).filter(p => p.connected).length;
// Historique des mini-jeux joués dans la soirée (plateau ou non) : le tirage évite de les ressortir trop vite.
function remember(room, id) {
  room.playHistory = [...(room.playHistory || []), id].slice(-60);
}
// Pendant le plateau, le score affiché des joueurs est leur total de points de plateau.
function syncBoardScores(room) {
  for (const p of Object.values(room.players)) p.score = room.board.points[p.id] || 0;
}
function boardStandings(room) {
  const b = room.board;
  return Object.keys(b.points).filter(id => room.players[id]).map(id => ({
    id, name: room.players[id].name, points: b.points[id], wins: b.wins[id] || 0,
  })).sort((a, b2) => b2.points - a.points || b2.wins - a.wins);
}
function boardData(room) {
  const b = room.board;
  return {
    turn: b.turn, turns: b.turns, standings: boardStandings(room), log: b.log,
    maxPoints: board.PLACE_POINTS[0] * (b.turns + 1), // la dernière manche compte double
  };
}

function boardStart(room, opts) {
  const turns = board.TURN_CHOICES.includes(Number(opts && opts.turns)) ? Number(opts.turns) : board.clampTurns(opts && opts.turns);
  room.board = { turn: 0, turns, points: {}, wins: {}, played: [], failed: [], log: [], next: null };
  for (const p of Object.values(room.players)) if (p.connected) { room.board.points[p.id] = 0; room.board.wins[p.id] = 0; }
  syncBoardScores(room);
  boardSpin(room);
}

function boardSpin(room) {
  const b = room.board;
  room.game = null;
  room.g = null;
  const pool = board.eligible(games, connectedCount(room), MIN_PLAYERS, b.failed);
  if (!pool.length) return boardFinal(room);
  const chosen = board.pickNext(pool, { session: b.played, history: room.playHistory || [] });
  const w = board.wheel(pool, chosen);
  b.next = chosen.id;
  const final = b.turn + 1 >= b.turns;
  setPhase(room, {
    kind: 'boardSpin', board: true, step: 'spin', category: 'Plateau',
    title: final ? 'Dernier tour : points doublés !' : 'La roue des mini-jeux',
    round: b.turn + 1, rounds: b.turns, duration: SPIN_MS / 1000 + SPIN_REVEAL_S,
    data: { ...boardData(room), ...w, chosen: { ...board.segment(chosen), desc: chosen.desc }, spinAt: Date.now() + 600, spinMs: SPIN_MS, final },
  });
}

function boardPlay(room) {
  const b = room.board, game = games[b.next];
  if (!game) return boardSpin(room);
  for (const p of Object.values(room.players)) p.score = 0; // chaque mini-jeu repart de zéro
  room.game = game;
  room.gameCategory = game.category || 'Général';
  b.played.push(game.id);
  remember(room, game.id);
  const api = apiFor(room);
  try {
    game.start(room, api);
    // Le Grand Sondage demande un thème : sur le plateau, on part sur un thème au hasard.
    if (room.phase && room.phase.kind === 'surveySetup' && game.hostAction) game.hostAction(room, 'start:', api);
  } catch (err) {
    console.error('[board:start]', game.id, err);
    room.phase = { kind: 'error' };
  }
  if (room.game === game && room.phase && room.phase.kind === 'error') { // jeu injouable : on retire la roue
    b.failed.push(game.id);
    b.played.pop();
    syncBoardScores(room);
    boardSpin(room);
  }
}

// Fin d'un mini-jeu : classement du mini-jeu → points de plateau. `aborted` : l'hôte a passé le jeu.
function boardAfterGame(room, aborted = false) {
  const b = room.board, game = room.game;
  clearTimeout(room.timer);
  room.game = null;
  room.g = null;
  if (aborted) { syncBoardScores(room); return boardSpin(room); }
  const final = b.turn + 1 >= b.turns, multiplier = final ? 2 : 1;
  const scores = {};
  for (const id of Object.keys(b.points)) { const p = room.players[id]; if (p && p.connected) scores[id] = p.score; }
  const rows = board.placements(scores, multiplier).map(r => ({ ...r, name: room.players[r.id].name }));
  for (const r of rows) { b.points[r.id] += r.gain; if (r.place === 1 && r.gain) b.wins[r.id]++; }
  b.turn++;
  b.log.push({ ...board.segment(game), winners: rows.filter(r => r.place === 1 && r.gain).map(r => r.name) });
  syncBoardScores(room);
  setPhase(room, {
    kind: 'boardResults', board: true, step: 'results', category: 'Plateau',
    title: b.turn >= b.turns ? 'Fin du dernier tour !' : 'Le plateau', round: b.turn, rounds: b.turns, duration: RESULTS_S,
    data: { ...boardData(room), game: board.segment(game), rows, multiplier, last: b.turn >= b.turns },
  });
}

function boardFinal(room) {
  const b = room.board;
  room.game = null;
  room.g = null;
  b.done = true;
  syncBoardScores(room);
  // Égalité de points : départage au nombre de mini-jeux gagnés.
  setPhase(room, { kind: 'scores', board: true, step: 'final', data: boardData(room) });
}

function boardOnEnd(room, ph) {
  if (!room.board) return;
  if (ph.step === 'spin') return boardPlay(room);
  if (ph.step === 'results') return room.board.turn >= room.board.turns ? boardFinal(room) : boardSpin(room);
}

function toLobby(room) {
  clearTimeout(room.timer);
  room.game = null;
  room.gameCategory = null;
  room.g = null;
  room.board = null;
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
    games: Object.values(games).map((g) => ({
      id: g.id, name: g.name, desc: g.desc, category: g.category || 'Général', categories: g.categories || [g.category || 'Général'],
      minPlayers: g.minPlayers || MIN_PLAYERS, difficulty: !!g.difficulty, icon: board.iconOf(g), wheel: !board.isBoss(g),
    })),
    options: room.options || {},
    min: MIN_PLAYERS,
    board: room.board ? { turn: room.board.turn, turns: room.board.turns, final: room.board.turn + 1 >= room.board.turns, done: !!room.board.done } : null,
    boardTurns: board.TURN_CHOICES,
    players: Object.values(room.players).map(({ id, name, score, connected, avatar }) => ({ id, name, score, connected, avatar: avatarById(avatar) })),
    phase: p && {
      n: p.n, kind: p.kind, step: p.step, title: p.title, prompt: p.prompt, unit: p.unit, category: p.category || (room.game && room.game.category) || 'Général',
      ...(p.kind === 'draw' ? { drawingCount: (p.drawing || []).length } : {}),
      round: p.round, rounds: p.rounds, lines: p.lines, endsAt: p.endsAt, data: p.data, difficulty: p.difficulty,
      options: p.options && p.options.map(({ id, text }) => ({ id, text })),
      answered: Object.keys(p.answers), expected: p.expected, error: p.error,
      ...(forHost && p.live ? { live: p.live } : {}),
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

  socket.on('host:start', (gameId, opts) => {
    const { room } = ctx();
    if (!room || !socket.data.isHost || !games[gameId]) return;
    if (Object.values(room.players).filter(p => p.connected).length < (games[gameId].minPlayers || MIN_PLAYERS)) return;
    // Options choisies au lobby (ex. difficulté des questions : 'mix', '1', '2' ou '3').
    const difficulty = String((opts && opts.difficulty) || 'mix');
    room.options = { difficulty: ['mix', '1', '2', '3'].includes(difficulty) ? difficulty : 'mix' };
    Object.values(room.players).forEach(p => (p.score = 0));
    room.board = null;
    remember(room, gameId);
    room.game = games[gameId];
    room.gameCategory = room.game.category || 'Général';
    try {
      room.game.start(room, apiFor(room));
    } catch (err) {
      console.error('[game:start]', gameId, err);
      setPhase(room, { kind: 'error', step: 'error', title: 'Impossible de lancer ce jeu', prompt: 'Une erreur technique a été détectée.', error: String(err && err.message || err) });
    }
  });

  // Mode plateau : la roue choisit les mini-jeux (jamais le boss) pendant `turns` tours.
  socket.on('host:board-start', (opts) => {
    const { room } = ctx();
    if (!room || !socket.data.isHost || room.game || room.board) return;
    if (connectedCount(room) < MIN_PLAYERS) return;
    const difficulty = String((opts && opts.difficulty) || 'mix');
    room.options = { difficulty: ['mix', '1', '2', '3'].includes(difficulty) ? difficulty : 'mix' };
    boardStart(room, opts);
  });
  socket.on('host:skip', () => { const { room } = ctx(); if (room && socket.data.isHost) endPhase(room); });
  socket.on('host:stop-game', () => {
    const { room } = ctx();
    if (!room || !socket.data.isHost || !room.game) return;
    if (room.board) boardAfterGame(room, true); // sur le plateau : on passe ce mini-jeu et la roue retourne
    else toLobby(room);
  });
  socket.on('host:lobby', () => { const { room } = ctx(); if (room && socket.data.isHost) toLobby(room); });
  // Action propre au jeu en cours (ex. « Rejouer »), si le jeu la gère.
  socket.on('host:action', (action) => {
    const { room } = ctx();
    if (!room || !socket.data.isHost || !room.game || !room.game.hostAction) return;
    if (room.board && action === 'replay') return; // sur le plateau, un mini-jeu ne se rejoue pas
    try { room.game.hostAction(room, String(action || ''), apiFor(room)); }
    catch (err) { console.error('[game:hostAction]', room.game.id, err); }
  });
  socket.on('host:sync-draw', () => {
    const { room } = ctx();
    const ph = room && room.phase;
    if (!room || !socket.data.isHost || !ph || ph.kind !== 'draw') return;
    socket.emit('draw', { n: ph.n, seq: ph.drawSeq || 0, full: true, ops: ph.drawOps || [] });
  });

  socket.on('join', ({ code, name, pid, avatar }, ack) => {
    code = String(code || '').toUpperCase().trim();
    name = String(name || '').trim().slice(0, 14);
    const room = rooms[code];
    if (!room) return ack && ack({ error: 'Code introuvable.' });
    let pl = pid && room.players[pid];
    if (!pl) {
      if (!name) return ack && ack({ error: 'Choisissez un pseudo.' });
      if (room.game || room.board) return ack && ack({ error: 'La partie a déjà commencé.' });
      if (Object.values(room.players).some(p => p.name.toLowerCase() === name.toLowerCase()))
        return ack && ack({ error: 'Ce pseudo est déjà pris.' });
      pid = Math.random().toString(36).slice(2, 10);
      pl = room.players[pid] = { id: pid, name, score: 0, avatar: avatarById(avatar), sid: null, connected: true };
    }
    if (avatar) pl.avatar = avatarById(avatar);
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

  // Action d'un joueur propre au jeu en cours (ex. une proposition au Grand Sondage, plusieurs par phase).
  // Le jeu valide tout côté serveur et renvoie le résultat dans l'ack ; l'état est ensuite rediffusé à tous.
  socket.on('player:action', (value, ack) => {
    const reply = (r) => typeof ack === 'function' && ack(r);
    const { room, pid } = ctx();
    if (!room || !pid || !room.game || !room.game.playerAction) return reply({ status: 'ignored' });
    try { reply(room.game.playerAction(room, pid, value, apiFor(room)) || { status: 'ignored' }); }
    catch (err) { console.error('[game:playerAction]', room.game.id, err); return reply({ status: 'error' }); }
    broadcast(room);
  });

  // Commandes en continu d'un joueur (jeux en temps réel, ex. manette du Boss Fight) : pas de rediffusion
  socket.on('input', (value) => {
    const { room, pid } = ctx();
    if (!room || !pid || !room.game || !room.game.input) return;
    try { room.game.input(room, pid, value, apiFor(room)); }
    catch (err) { console.error('[game:input]', room.game.id, err); }
  });

  // Progression en direct d'un joueur (jeux qui la gèrent), relayée seulement à l'écran de l'hôte
  socket.on('progress', (value) => {
    const { room, pid } = ctx();
    const ph = room && room.phase;
    if (!ph || ph.done || !room.game || !room.game.progress || !ph.expected.includes(pid) || pid in ph.answers) return;
    if (room.game.progress(ph, pid, value) && room.host) io.to(room.host).emit('state', view(room, true));
  });

  // Dessin : le dessinateur envoie des segments, relayés à l'écran de l'hôte
  socket.on('draw', (d, ack) => {
    const { room, pid } = ctx(); const ph = room && room.phase;
    if(!room||!ph||ph.kind!=='draw'||ph.drawer!==pid||ph.done||!d)return;
    const out={n:ph.n,seq:++ph.drawSeq};
    if(d.action==='clear'){ph.drawing=[];ph.drawOps=[];out.clear=true;io.to(room.host).emit('draw',out);}
    else if(d.action==='undo'){ph.drawOps.pop();ph.drawing=[];for(const op of ph.drawOps)if(op.action==='segments')ph.drawing.push(...(op.segs||[]));out.action='undo';out.ops=ph.drawOps.slice();io.to(room.host).emit('draw',out);}
    else if(d.action==='fill'&&Number.isFinite(d.x)&&Number.isFinite(d.y)&&typeof d.color==='string'){
      const op={action:'fill',x:Math.max(0,Math.min(1,d.x)),y:Math.max(0,Math.min(1,d.y)),color:d.color};
      ph.drawOps.push(op);out.action='fill';Object.assign(out,op);io.to(room.host).emit('draw',out);
    } else if(d.action==='segments'&&Array.isArray(d.segs)){
      const segs=d.segs.slice(0,250).filter(a=>Array.isArray(a)&&a.length===4&&a.every(x=>Number.isFinite(x)&&x>=0&&x<=1));
      if(!segs.length)return;
      const width=Math.max(1,Math.min(60,Number(d.width)||5)), color=typeof d.color==='string'?d.color:'#1d1a3b', tool=d.tool==='eraser'?'eraser':'pen';
      const op={action:'segments',segs,color,width,tool}; ph.drawOps.push(op); ph.drawing.push(...segs);
      if(ph.drawOps.length>1000)ph.drawOps.shift(); if(ph.drawing.length>16000)ph.drawing.splice(0,ph.drawing.length-16000);
      Object.assign(out,op);io.to(room.host).emit('draw',out);
    } else return;
    if(typeof ack==='function')ack({ok:true,seq:out.seq});
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
      if (!room.game && !room.board) delete room.players[pid]; // au lobby, on retire le joueur
      broadcast(room);
    }
  });
});

server.listen(PORT, () => console.log(`Jeu lancé : http://localhost:${PORT}`));
