// Musiques génératives locales : chaque jeu possède une identité musicale distincte.
(function(){
  let ctx=null,master=null,musicGain=null,sfxGain=null,timer=null,currentTheme=null,enabled=false,lastPhase=null,lastGame=null;
  const G=261.63;
  const gameThemes={
    funny:{bpm:124,notes:[G,329.63,392,523.25,392,329.63],wave:'square'},
    finislaphrase:{bpm:116,notes:[G,392,523.25,659.25,523.25],wave:'triangle'},
    estimation:{bpm:104,notes:[G,293.66,369.99,440,369.99],wave:'sine'},
    leplusprobable:{bpm:128,notes:[293.66,349.23,440,523.25,440],wave:'triangle'},
    quiadit:{bpm:110,notes:[392,466.16,523.25,466.16],wave:'sine'},
    deuxverites:{bpm:96,notes:[329.63,392,493.88,392],wave:'triangle'},
    emojis:{bpm:132,notes:[261.63,329.63,415.3,523.25,659.25],wave:'square'},
    filmresume:{bpm:88,notes:[220,277.18,329.63,415.3],wave:'sine'},
    quisuisje:{bpm:100,notes:[261.63,311.13,392,466.16],wave:'triangle'},
    motatrous:{bpm:118,notes:[293.66,349.23,392,493.88],wave:'square'},
    express:{bpm:148,notes:[392,523.25,659.25,783.99],wave:'square'},
    quatreimages:{bpm:122,notes:[261.63,311.13,369.99,440,523.25],wave:'triangle'},
    intrus:{bpm:130,notes:[329.63,415.3,493.88,659.25],wave:'sawtooth'},
    survive:{bpm:108,notes:[220,246.94,293.66,369.99],wave:'sawtooth'},
    choixgroupe:{bpm:102,notes:[261.63,349.23,440,523.25],wave:'triangle'},
    classement:{bpm:114,notes:[293.66,392,493.88,587.33],wave:'triangle'},
    motinterdit:{bpm:126,notes:[277.18,349.23,440,554.37],wave:'square'},
    dessin:{bpm:92,notes:[261.63,329.63,392,493.88],wave:'sine'}
  };
  const themes={lobby:{bpm:100,notes:[261.63,329.63,392,523.25],wave:'triangle'},victory:{bpm:132,notes:[392,523.25,659.25,783.99,1046.5],wave:'triangle'},calm:{bpm:86,notes:[261.63,293.66,329.63,392],wave:'sine'},tense:{bpm:126,notes:[220,261.63,311.13,261.63],wave:'sawtooth'}};
  const ensure=()=>{if(ctx)return;ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=.2;master.connect(ctx.destination);musicGain=ctx.createGain();musicGain.gain.value=.15;musicGain.connect(master);sfxGain=ctx.createGain();sfxGain.gain.value=.38;sfxGain.connect(master)};
  const tone=(f,d=.12,type='sine',gain=.08,dest=sfxGain,when=0)=>{if(!ctx)return;const now=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(gain,now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+d);o.connect(g);g.connect(dest);o.start(now);o.stop(now+d+.03)};
  const stop=()=>{if(timer)clearInterval(timer);timer=null;currentTheme=null};
  const play=name=>{if(!enabled)return;ensure();if(ctx.state==='suspended')ctx.resume();if(currentTheme===name&&timer)return;stop();currentTheme=name;const t=themes[name]||gameThemes[name]||themes.lobby;let i=0;const beat=60000/t.bpm;const tick=()=>{if(!enabled)return;const f=t.notes[i++%t.notes.length];tone(f,Math.min(.25,beat/1000*.7),t.wave,.032,musicGain);if(i%4===1)tone(f/2,.18,'sine',.014,musicGain,.01)};tick();timer=setInterval(tick,beat)};
  const themeFor=state=>{if(!state?.phase)return'lobby';if(state.phase.kind==='scores')return'victory';if(state.phase.kind==='reveal')return'calm';if(state.game)return state.game; if(state.phase.endsAt&&state.phase.kind!=='lobby')return'tense';return'lobby'};
  window.partyAudio={enable(){ensure();enabled=true;ctx.resume();play('lobby');this.updateButton()},disable(){enabled=false;stop();this.updateButton()},toggle(){enabled?this.disable():this.enable()},update(state){if(!enabled)return;const theme=themeFor(state);play(theme);const phase=state?.phase?.n;if(phase&&phase!==lastPhase){lastPhase=phase;const f=theme==='victory'?523.25:659.25;tone(f,.1,'triangle',.1);tone(f*1.25,.14,'triangle',.07,sfxGain,.08)}if(state?.game!==lastGame){lastGame=state?.game;tone(392,.07,'triangle',.05)}},answer(){if(!enabled)return;tone(523.25,.08,'triangle',.09);tone(659.25,.12,'triangle',.07,sfxGain,.07)},error(){if(!enabled)return;tone(220,.16,'sawtooth',.07)},click(){if(!enabled)return;tone(392,.05,'triangle',.045)},updateButton(){document.querySelectorAll('[data-audio-toggle]').forEach(b=>{b.textContent=enabled?'🔊 Son activé':'🔇 Activer le son';b.classList.toggle('audio-on',enabled)})}};
})();