// Max Paillettes : le présentateur du show. Une tête-télé en relief, veste à paillettes et micro.
// Son visage s'affiche sur l'écran et change selon l'ambiance (victoire, égalité, élimination…).
// API : Mascot.mount(el) → { set(mood), say(text, mood, ms) } ; Mascot.dock() ; Mascot.react(mood, text, ms).
(function () {
  const MOODS = {
    idle:      { eyes: 'normal', brows: 'cocky', mouth: 'smirk', pose: 'rest' },
    intro:     { eyes: 'wide',   brows: 'up',    mouth: 'open',  pose: 'point' },
    hype:      { eyes: 'wide',   brows: 'up',    mouth: 'grin',  pose: 'point' },
    win:       { eyes: 'happy',  brows: 'up',    mouth: 'grin',  pose: 'up' },
    crush:     { eyes: 'star',   brows: 'up',    mouth: 'open',  pose: 'up' },
    lose:      { eyes: 'flat',   brows: 'sad',   mouth: 'flat',  pose: 'rest' },
    tie:       { eyes: 'wide',   brows: 'up',    mouth: 'o',     pose: 'shrug' },
    encourage: { eyes: 'wink',   brows: 'cocky', mouth: 'grin',  pose: 'point' },
    comeback:  { eyes: 'star',   brows: 'angry', mouth: 'open',  pose: 'up' },
    record:    { eyes: 'star',   brows: 'up',    mouth: 'grin',  pose: 'up' },
    elim:      { eyes: 'x',      brows: 'sad',   mouth: 'o',     pose: 'facepalm' },
    finale:    { eyes: 'happy',  brows: 'up',    mouth: 'open',  pose: 'up' },
    suspense:  { eyes: 'normal', brows: 'angry', mouth: 'wobbly', pose: 'rest' },
  };
  let uid = 0;
  const svg = () => {
    const k = 'mx' + (++uid);
    return `<svg class="mx-svg" viewBox="0 0 220 270" aria-hidden="true">
  <defs>
    <linearGradient id="${k}-case" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d7cff"/><stop offset=".45" stop-color="#3a2fb8"/><stop offset="1" stop-color="#160f55"/></linearGradient>
    <radialGradient id="${k}-screen" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="#173a7a"/><stop offset=".7" stop-color="#0a1438"/><stop offset="1" stop-color="#050a1f"/></radialGradient>
    <linearGradient id="${k}-jacket" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4fc4"/><stop offset=".5" stop-color="#c3179a"/><stop offset="1" stop-color="#6c0b63"/></linearGradient>
    <linearGradient id="${k}-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a6"/><stop offset=".5" stop-color="#ffc61a"/><stop offset="1" stop-color="#c77800"/></linearGradient>
    <linearGradient id="${k}-chrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#9aa6c8"/><stop offset="1" stop-color="#3b4466"/></linearGradient>
    <pattern id="${k}-scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="rgba(255,255,255,.05)"/></pattern>
    <pattern id="${k}-sequin" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.3" fill="rgba(255,255,255,.45)"/><circle cx="7" cy="7" r="1" fill="rgba(255,230,120,.5)"/></pattern>
    <filter id="${k}-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <ellipse class="mx-shadow" cx="110" cy="258" rx="62" ry="9" fill="rgba(0,0,0,.45)"/>
  <g class="mx-body">
    <g transform="translate(58 176)"><g class="mx-arm mx-arm-l">
      <path d="M0 0 C-6 22 -6 40 -2 58" stroke="url(#${k}-jacket)" stroke-width="20" stroke-linecap="round" fill="none"/>
      <circle cx="-2" cy="64" r="11" fill="#fff" stroke="#c9d2f0" stroke-width="2"/>
    </g></g>
    <path d="M44 252 C40 205 56 172 110 166 C164 172 180 205 176 252 Z" fill="url(#${k}-jacket)"/>
    <path d="M44 252 C40 205 56 172 110 166 C164 172 180 205 176 252 Z" fill="url(#${k}-sequin)"/>
    <path d="M110 168 L88 172 L104 236 L110 252 L116 236 L132 172 Z" fill="#f4f7ff"/>
    <path d="M88 172 L74 182 L100 236 L104 236 Z M132 172 L146 182 L120 236 L116 236 Z" fill="#14092e"/>
    <circle cx="110" cy="206" r="3" fill="#14092e"/><circle cx="110" cy="222" r="3" fill="#14092e"/>
    <path d="M110 176 L92 166 L92 186 Z M110 176 L128 166 L128 186 Z" fill="url(#${k}-gold)"/><circle cx="110" cy="176" r="5" fill="#ffd60a"/>
    <rect x="98" y="150" width="24" height="20" rx="6" fill="#1b1350"/>
    <g transform="translate(162 176)"><g class="mx-arm mx-arm-r">
      <path d="M0 0 C6 22 6 40 2 58" stroke="url(#${k}-jacket)" stroke-width="20" stroke-linecap="round" fill="none"/>
      <g class="mx-mic"><rect x="-3" y="40" width="10" height="34" rx="4" fill="#1a1d2e"/><circle cx="2" cy="38" r="11" fill="url(#${k}-chrome)"/><path d="M-6 34 h16 M-7 39 h18 M-6 44 h16" stroke="rgba(30,30,60,.45)" stroke-width="1.4"/></g>
      <circle cx="2" cy="64" r="11" fill="#fff" stroke="#c9d2f0" stroke-width="2"/>
    </g></g>
  </g>
  <g class="mx-head">
    <g class="mx-antenna mx-antenna-l"><path d="M82 28 L62 4" stroke="#c9d2f0" stroke-width="3" stroke-linecap="round"/><circle cx="62" cy="4" r="5.5" fill="#ffd60a"/></g>
    <g class="mx-antenna mx-antenna-r"><path d="M138 28 L160 6" stroke="#c9d2f0" stroke-width="3" stroke-linecap="round"/><circle cx="160" cy="6" r="5.5" fill="#ff2fb3"/></g>
    <rect x="30" y="24" width="160" height="128" rx="30" fill="#0d0838"/>
    <rect x="30" y="20" width="160" height="126" rx="30" fill="url(#${k}-case)"/>
    <path d="M44 34 C70 24 150 24 176 34" stroke="rgba(255,255,255,.55)" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M84 22 C88 2 128 -2 144 14 C130 8 112 10 104 22 Z" fill="url(#${k}-gold)"/>
    <path d="M98 20 C104 6 126 4 136 12" stroke="rgba(255,255,255,.7)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <rect x="44" y="34" width="132" height="98" rx="20" fill="url(#${k}-screen)" stroke="#05081c" stroke-width="3"/>
    <rect x="44" y="34" width="132" height="98" rx="20" fill="url(#${k}-scan)"/>
    <g class="mx-face" filter="url(#${k}-glow)" stroke="#8ff6ff" fill="#8ff6ff" stroke-linecap="round" stroke-linejoin="round">
      <g class="mx-look">
        <g class="mx-eyes" data-e="normal"><g class="mx-blink"><ellipse cx="86" cy="80" rx="8" ry="11" stroke="none"/><ellipse cx="134" cy="80" rx="8" ry="11" stroke="none"/><circle cx="89" cy="76" r="2.6" fill="#fff" stroke="none"/><circle cx="137" cy="76" r="2.6" fill="#fff" stroke="none"/></g></g>
        <g class="mx-eyes" data-e="happy" fill="none" stroke-width="5"><path d="M74 84 Q86 66 98 84"/><path d="M122 84 Q134 66 146 84"/></g>
        <g class="mx-eyes" data-e="wide"><circle cx="86" cy="80" r="13" fill="none" stroke-width="4"/><circle cx="134" cy="80" r="13" fill="none" stroke-width="4"/><circle cx="86" cy="80" r="4.5" stroke="none"/><circle cx="134" cy="80" r="4.5" stroke="none"/></g>
        <g class="mx-eyes" data-e="star" fill="#ffd60a" stroke="#ffd60a"><path d="M86 66 l4 9 10 1 -8 6 3 10 -9 -6 -9 6 3 -10 -8 -6 10 -1z"/><path d="M134 66 l4 9 10 1 -8 6 3 10 -9 -6 -9 6 3 -10 -8 -6 10 -1z"/></g>
        <g class="mx-eyes" data-e="flat"><path d="M76 78 h20 v6 a10 6 0 0 1 -20 0z" stroke="none"/><path d="M124 78 h20 v6 a10 6 0 0 1 -20 0z" stroke="none"/><path d="M74 77 h24 M122 77 h24" stroke-width="3.5" fill="none"/></g>
        <g class="mx-eyes" data-e="wink"><ellipse cx="86" cy="80" rx="8" ry="11" stroke="none"/><circle cx="89" cy="76" r="2.6" fill="#fff" stroke="none"/><path d="M122 82 Q134 72 146 82" fill="none" stroke-width="5"/></g>
        <g class="mx-eyes" data-e="x" fill="none" stroke-width="5" stroke="#ff6b9d"><path d="M77 71 l18 18 M95 71 l-18 18"/><path d="M125 71 l18 18 M143 71 l-18 18"/></g>
      </g>
      <g class="mx-brows" fill="none" stroke-width="4.5">
        <g data-b="cocky"><path d="M74 62 h22"/><path d="M122 58 Q134 48 148 56"/></g>
        <g data-b="up"><path d="M74 58 Q86 48 98 56"/><path d="M122 56 Q134 48 146 58"/></g>
        <g data-b="sad"><path d="M76 58 L96 64"/><path d="M144 58 L124 64"/></g>
        <g data-b="angry"><path d="M76 60 L96 68"/><path d="M144 60 L124 68"/></g>
      </g>
      <g class="mx-mouth">
        <path data-m="smirk" d="M94 106 Q114 116 130 100" fill="none" stroke-width="5"/>
        <g data-m="grin"><path d="M86 100 Q110 128 134 100 Z" stroke-width="3"/><path d="M90 104 h40" stroke="#0a1438" stroke-width="3"/></g>
        <g data-m="open"><path d="M90 98 Q110 98 130 98 Q132 126 110 128 Q88 126 90 98 Z" stroke-width="3"/><path d="M98 118 Q110 110 122 118 Q116 124 110 124 Q104 124 98 118Z" fill="#ff5d9e" stroke="none"/></g>
        <ellipse data-m="o" cx="110" cy="110" rx="8" ry="10" fill="none" stroke-width="5"/>
        <path data-m="frown" d="M92 114 Q110 98 128 114" fill="none" stroke-width="5"/>
        <path data-m="flat" d="M94 110 h32" fill="none" stroke-width="5"/>
        <path data-m="wobbly" d="M90 110 q5 -6 10 0 t10 0 t10 0 t10 0" fill="none" stroke-width="4.5"/>
      </g>
      <path class="mx-tear" d="M84 94 q-5 8 0 12 q5 -4 0 -12z" fill="#7cc7ff" stroke="none"/>
    </g>
    <path d="M52 40 L80 40 L58 74 L50 74 Z" fill="rgba(255,255,255,.08)"/>
    <circle cx="176" cy="140" r="4" fill="#ff2f6d" class="mx-rec"/>
  </g>
</svg>`;
  };

  function mount(el, opts = {}) {
    el.classList.add('mx');
    if (opts.size) el.style.setProperty('--mx-size', opts.size + 'px');
    el.innerHTML = `<div class="mx-bubble" hidden></div><div class="mx-figure">${svg()}</div>`;
    const bubble = el.querySelector('.mx-bubble');
    let hideT = null, backT = null;
    const ctl = {
      el,
      set(mood) {
        const m = MOODS[mood] ? mood : 'idle', d = MOODS[m];
        el.dataset.mood = m; el.dataset.eyes = d.eyes; el.dataset.brows = d.brows; el.dataset.mouth = d.mouth; el.dataset.pose = d.pose;
        // relance l'animation d'entrée de l'humeur
        el.classList.remove('mx-bump'); void el.offsetWidth; el.classList.add('mx-bump');
        return ctl;
      },
      say(text, mood, ms = 4200) {
        if (mood) ctl.set(mood);
        clearTimeout(hideT); clearTimeout(backT);
        if (text) {
          bubble.textContent = text; bubble.hidden = false;
          bubble.classList.remove('mx-pop'); void bubble.offsetWidth; bubble.classList.add('mx-pop');
          hideT = setTimeout(() => { bubble.hidden = true; }, ms);
        }
        if (mood && mood !== 'idle' && !opts.sticky) backT = setTimeout(() => ctl.set('idle'), ms + 600);
        return ctl;
      },
      look(x, y) { el.style.setProperty('--look-x', x + 'px'); el.style.setProperty('--look-y', y + 'px'); },
    };
    ctl.set(opts.mood || 'idle');
    // regard qui balaie le public de temps en temps
    if (!opts.still) setInterval(() => { if (el.dataset.mood === 'idle' || el.dataset.mood === 'suspense') ctl.look(Math.round(Math.random() * 10 - 5), Math.round(Math.random() * 4 - 2)); }, 2300);
    return ctl;
  }

  let dockCtl = null;
  function dock(opts = {}) {
    if (dockCtl) return dockCtl;
    const el = document.createElement('div');
    el.className = 'mx-dock' + (opts.compact ? ' mx-dock-compact' : '');
    document.body.appendChild(el);
    dockCtl = mount(el, opts);
    return dockCtl;
  }
  // Le présentateur « sur scène » (lobby, finale) a la priorité sur celui du coin de l'écran.
  let stageCtl = null;
  const setStage = ctl => { stageCtl = ctl; };
  const react = (mood, text, ms) => {
    const target = stageCtl && stageCtl.el.isConnected ? stageCtl : dockCtl;
    if (target) target.say(text, mood, ms);
  };
  const hideDock = hidden => { if (dockCtl) dockCtl.el.classList.toggle('mx-away', !!hidden); };

  window.Mascot = { MOODS, mount, dock, react, hideDock, setStage, svg, get docked() { return dockCtl; } };
})();
