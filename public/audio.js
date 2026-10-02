// Audio léger et sans fichiers externes : musique générative + effets.
// Le navigateur exige une interaction utilisateur avant de jouer du son.
(function () {
  let ctx = null, master = null, musicGain = null, sfxGain = null;
  let timer = null, currentTheme = null, enabled = false, lastPhase = null;
  const themes = {
    lobby: { bpm: 104, notes: [261.63, 329.63, 392.00, 329.63], wave: 'triangle' },
    funny: { bpm: 126, notes: [261.63, 329.63, 392.00, 523.25, 392.00, 329.63], wave: 'square' },
    tense: { bpm: 112, notes: [220.00, 261.63, 311.13, 261.63], wave: 'sawtooth' },
    calm: { bpm: 88, notes: [261.63, 293.66, 329.63, 392.00], wave: 'sine' },
    victory: { bpm: 132, notes: [392.00, 523.25, 659.25, 783.99], wave: 'triangle' }
  };
  const ensure = () => {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.14; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.35; sfxGain.connect(master);
  };
  const tone = (freq, duration=.12, type='sine', gain=.08, destination=sfxGain, when=0) => {
    if (!ctx) return;
    const now = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(gain, now + .015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.connect(g); g.connect(destination); o.start(now); o.stop(now + duration + .02);
  };
  const stopMusic = () => { if (timer) clearInterval(timer); timer = null; currentTheme = null; };
  const playMusic = name => {
    if (!enabled) return;
    ensure(); if (ctx.state === 'suspended') ctx.resume();
    if (currentTheme === name && timer) return;
    stopMusic(); currentTheme = name;
    const t = themes[name] || themes.lobby;
    let i = 0;
    const beat = 60000 / t.bpm;
    const tick = () => {
      if (!enabled || !ctx) return;
      const f = t.notes[i++ % t.notes.length];
      tone(f, Math.min(.24, beat / 1000 * .65), t.wave, .035, musicGain);
      if (i % 4 === 1) tone(f / 2, .18, 'sine', .018, musicGain, .01);
    };
    tick(); timer = setInterval(tick, beat);
  };
  const themeFor = state => {
    if (!state || !state.phase) return 'lobby';
    const k = state.phase.kind;
    if (k === 'scores') return 'victory';
    if (k === 'reveal') return 'calm';
    if (state.phase.endsAt && k !== 'lobby') return 'tense';
    return 'funny';
  };
  window.partyAudio = {
    enable() { ensure(); enabled = true; ctx.resume(); playMusic('lobby'); this.updateButton(); },
    disable() { enabled = false; stopMusic(); this.updateButton(); },
    toggle() { enabled ? this.disable() : this.enable(); },
    update(state) {
      if (!enabled) return;
      const theme = themeFor(state);
      playMusic(theme);
      const phase = state?.phase?.n;
      if (phase && phase !== lastPhase) {
        lastPhase = phase;
        tone(theme === 'victory' ? 523.25 : 659.25, .11, 'triangle', .10);
        tone(theme === 'victory' ? 659.25 : 783.99, .16, 'triangle', .08, sfxGain, .10);
      }
    },
    answer() { if (!enabled) return; tone(523.25, .09, 'triangle', .09); tone(659.25, .12, 'triangle', .07, sfxGain, .07); },
    error() { if (!enabled) return; tone(220, .16, 'sawtooth', .07); },
    click() { if (!enabled) return; tone(392, .06, 'triangle', .045); },
    updateButton() {
      document.querySelectorAll('[data-audio-toggle]').forEach(b => {
        b.textContent = enabled ? '🔊 Son activé' : '🔇 Activer le son';
        b.classList.toggle('audio-on', enabled);
      });
    }
  };
})();
