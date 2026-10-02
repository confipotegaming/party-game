// Musiques génératives locales : chaque mini-jeu a son propre morceau (style, tempo, accords, mélodie),
// joué par un petit séquenceur Web Audio (batterie, basse, nappes, arpèges, mélodie).
// Le classement final déclenche une fanfare de victoire façon RPG, suivie d'une boucle triomphale.
(function(){
  let ctx=null,master=null,musicGain=null,sfxGain=null,noiseBuf=null,enabled=false,lastPhase=null,lastGame=null;
  let seq=null,schedTimer=null,currentTheme=null,energy=1;

  // ---------- Volumes (plus fort qu'avant, un compresseur évite la saturation) ----------
  const MASTER=1.0,MUSIC=0.5,SFX=1.6;

  // ---------- Notes & accords ----------
  const PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  const noteToMidi=s=>{const r=/^([A-G])([#b]?)(-?\d)$/.exec(s);if(!r)return null;return 12*(+r[3]+1)+PC[r[1]]+(r[2]==='#'?1:r[2]==='b'?-1:0)};
  const QUAL={'':[0,4,7],m:[0,3,7],'7':[0,4,7,10],maj7:[0,4,7,11],m7:[0,3,7,10],dim:[0,3,6],sus:[0,5,7],'6':[0,4,7,9],m6:[0,3,7,9],add9:[0,4,7,14],m9:[0,3,7,10,14],aug:[0,4,8]};
  const parseChord=s=>{const r=/^([A-G])([#b]?)(.*)$/.exec(s);const pc=(PC[r[1]]+(r[2]==='#'?1:r[2]==='b'?-1:0)+12)%12;return{pc,iv:QUAL[r[3]]||QUAL['']}};
  // Mélodie : « C5:2 E5:2 r:4 » (durée en doubles-croches, 16 = une mesure)
  const parseLead=s=>{const out=[];let pos=0;for(const tok of s.trim().split(/\s+/)){const[n,d]=tok.split(':');const len=+(d||2);if(n!=='r')out.push({pos,m:noteToMidi(n),len});pos+=len}return{events:out,length:pos}};

  // ---------- Styles : motifs de batterie / basse / accompagnement sur 16 pas ----------
  // kick/snare/clap/hat/perc/tom : x = coup, g = coup léger, o = charleston ouverte
  // basse : R fondamentale, O octave, 5 quinte, 3 tierce, 7 septième, 6 sixte, - prolonge, . silence
  // arp : indices dans les notes de l'accord, chop : accords piqués, pad : nappe tenue
  const STYLES={
    house:{kick:'x...x...x...x...',clap:'....x.......x...',hat:'..o...o...o...o.',perc:'x.xxx.xxx.xxx.xx',percType:'shaker',bass:'..R-..R-..R-..O-',bassType:'saw',pad:'strings',arp:'0.1.2.3.2.1.0.1.',arpType:'pluck',lead:'pluck',delay:.3,fill:'snare'},
    funk:{kick:'x.....x.x.....x.',snare:'....x..g.g..x..g',hat:'xgxgxgxgxgxgxgxg',bass:'R..R.7.O..R5.3.R',bassType:'slap',chop:'..x...x...x.x...',chopType:'clav',lead:'square',swing:.08,delay:.18,fill:'snare'},
    pop:{kick:'x.....x.x.......',snare:'....x.......x...',clap:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',bass:'R.R.R.R.R.R.5.O.',bassType:'square',pad:'strings',chop:'..x...x...x...x.',chopType:'piano',lead:'square',delay:.2,fill:'snare'},
    quiz:{kick:'x.......x.......',snare:'....x.......x...',perc:'x.x.x.x.x.x.x.x.',percType:'tick',bass:'R...5...R...5...',bassType:'pizz',pad:'strings',arp:'0.2.1.2.0.2.1.2.',arpType:'mallet',lead:'mallet',delay:.25,fill:'snare'},
    disco:{kick:'x...x...x...x...',snare:'....x.......x...',hat:'x.o.x.o.x.o.x.o.',bass:'R.O.R.O.R.O.R.O.',bassType:'saw',pad:'strings',chop:'.x..x..x.x..x...',chopType:'piano',lead:'saw',delay:.22,fill:'snare'},
    noir:{kick:'x.......x.......',snare:'..g...x...g...x.',hat:'x...x.x.x...x.x.',bass:'R...3...5...6...',bassType:'upright',pad:'rhodes',lead:'vibe',swing:.2,delay:.3,fill:'snare'},
    tango:{kick:'x..x..x.x.......',bass:'R..R5.5.R..R5.5.',bassType:'pizz',chop:'x...x...x...x...',chopType:'accordion',perc:'..x.x.....x.x...',percType:'castanet',lead:'reed',delay:.15,fill:'snare',snare:'................'},
    chip:{kick:'x...x...x...x...',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',bass:'R.O.R.O.R.O.R.O.',bassType:'chip',arp:'0123012301230123',arpType:'chip',lead:'chip',delay:.15,fill:'snare'},
    epic:{kick:'x.......x.x.....',snare:'........x.......',tom:'x..x..x...x.x...',bass:'R.RR.RR.R.RR.RR.',bassType:'saw',pad:'strings',lead:'brass',delay:.3,fill:'tom',crash:true},
    mystic:{kick:'x.........x.....',snare:'....g.......g...',perc:'..x...x...x...x.',percType:'shaker',bass:'R-------5-------',bassType:'sub',pad:'strings',arp:'0.2.4.2.1.2.4.2.',arpType:'musicbox',lead:'bell',delay:.35,fill:'snare'},
    bouncy:{kick:'x...x...x...x...',snare:'....x.......x...',hat:'x.xxx.xxx.xxx.xx',perc:'..x..x....x..x..',percType:'tick',bass:'R.R.5.R.R.R.5.O.',bassType:'pizz',chop:'..x...x...x...x.',chopType:'piano',lead:'pluck',delay:.2,fill:'snare'},
    rush:{kick:'x.........x.....',snare:'....x.......x..g',hat:'xxxxxxxxxxxxxxxx',bass:'R.R.O.R.R.R.5.O.',bassType:'saw',arp:'0.1.2.3.0.1.2.3.',arpType:'pluck',pad:'strings',lead:'saw',delay:.15,fill:'snare',crash:true},
    tropical:{kick:'x...x...x...x...',clap:'....x.......x...',perc:'x.xxx.xxx.xxx.xx',percType:'shaker',bass:'R..R..R.R..R..R.',bassType:'sub',chop:'..x...x...x...x.',chopType:'pluck',arp:'..1...2...1...3.',arpType:'mallet',lead:'mallet',delay:.3,fill:'snare'},
    tension:{kick:'x.....x...x.....',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',bass:'RRRORRRORRRORRRO',bassType:'saw',chop:'x..x..x.........',chopType:'brass',pad:'strings',lead:'saw',delay:.2,fill:'snare',crash:true},
    tribal:{kick:'x.....x...x.....',tom:'x.x..x.x..x.x..x',perc:'x.xxx.xxx.xxx.xx',percType:'shaker',clap:'....x.......x...',bass:'R-----R---R-----',bassType:'sub',pad:'strings',lead:'flute',delay:.35,fill:'tom'},
    ska:{kick:'x.......x.......',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',chop:'..x...x...x...x.',chopType:'organ',bass:'R.3.5.O.R.3.5.3.',bassType:'upright',lead:'brass',swing:.1,delay:.18,fill:'snare'},
    spy:{kick:'x.....x.x.......',snare:'....x.......x...',hat:'x.xxx.xxx.xxx.xx',bass:'R..R..O.R..R..5.',bassType:'square',pad:'organ',lead:'twang',delay:.35,fill:'snare'},
    lofi:{kick:'x.....x...x.....',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',bass:'R-----5---R-----',bassType:'sub',pad:'rhodes',lead:'soft',swing:.18,delay:.3,fill:'snare'},
    gospel:{kick:'x..x..x.x..x....',clap:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',bass:'R.R.R.R.5.5.O.O.',bassType:'square',pad:'organ',chop:'..x...x...x...x.',chopType:'piano',lead:'square',delay:.2,fill:'snare'},
    classical:{kick:'x.......x.......',snare:'....g.......g...',bass:'R.5.R.5.R.5.R.5.',bassType:'pizz',pad:'strings',arp:'0121012101210121',arpType:'clav',lead:'flute',delay:.25,fill:'snare'},
    wario:{kick:'x...x...x...x...',snare:'....x.......x...',hat:'xxxxxxxxxxxxxxxx',perc:'..x...x...x...x.',percType:'tick',bass:'R.O.5.O.R.O.5.O.',bassType:'slap',chop:'..x...x...x...x.',chopType:'organ',lead:'square',delay:.15,fill:'snare',crash:true},
    gameshow:{kick:'x...x...x...x...',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',bass:'R.O.5.O.R.O.5.O.',bassType:'upright',chop:'x.....x...x.....',chopType:'brass',pad:'strings',lead:'brass',swing:.12,delay:.2,fill:'snare',crash:true},
    march:{kick:'x...x...x...x...',snare:'x.xxx.x.x.xxx.x.',tom:'x.......x.......',bass:'R...5...R...5...',bassType:'upright',pad:'brass',arp:'0.1.2.3.2.1.2.3.',arpType:'pluck',lead:'brass',delay:.2,fill:'snare',crash:true}
  };

  // ---------- Morceaux : un par mini-jeu, deux parties A/B de 4 mesures ----------
  const T=(bpm,style,A,Aled,B,Bled,extra)=>Object.assign({bpm,style,A:{ch:A,lead:Aled},B:{ch:B,lead:Bled}},extra||{});
  const THEMES={
    lobby:T(118,'house','Am7 Fmaj7 C G','E5:3 A5:3 G5:2 E5:4 r:4 C5:2 E5:2 F5:2 A5:6 r:4 G5:3 E5:3 C5:2 D5:2 E5:2 G5:4 D5:8 B4:4 r:4',
      'F G Em Am','A5:2 A5:2 G5:2 F5:2 A5:4 C6:4 B5:4 G5:4 D5:4 r:4 E5:2 G5:2 B5:4 A5:2 G5:2 E5:4 A5:12 r:4'),
    funny:T(112,'funk','Em7 A7 Em7 A7','r:2 E5:1 G5:1 r:2 A5:2 r:1 G5:1 E5:2 D5:2 E5:2 r:2 C#5:1 E5:1 r:2 G5:2 r:2 F#5:2 E5:4 r:2 E5:1 G5:1 r:2 B5:2 r:1 A5:1 G5:2 A5:2 B5:2 C#6:2 B5:2 A5:2 G5:2 E5:4 r:4',
      'Cmaj7 B7 Em7 A7','G5:4 E5:2 C5:2 B4:2 C5:2 E5:4 D#5:4 F#5:4 A5:4 B5:4 G5:2 B5:2 D6:4 B5:2 A5:2 G5:4 E5:2 r:2 E5:2 C#5:2 A4:8'),
    finislaphrase:T(122,'pop','G D Em C','B4:2 D5:2 G5:4 F#5:2 G5:2 A5:4 F#5:4 D5:4 A4:4 r:4 G5:2 F#5:2 E5:2 G5:2 B5:4 A5:2 G5:2 E5:4 G5:4 E5:2 D5:6',
      'Em C G D','E5:2 E5:2 G5:2 B5:2 B5:4 A5:4 G5:2 E5:2 C5:4 E5:4 G5:4 D6:4 B5:2 G5:2 A5:2 B5:2 G5:4 A5:6 F#5:2 D5:4 r:4'),
    estimation:T(100,'quiz','Dm Bb C A7','D5:2 F5:2 A5:2 F5:2 D6:4 C6:2 A5:2 Bb5:4 F5:2 D5:2 F5:4 Bb5:4 C6:2 G5:2 E5:2 G5:2 C6:2 D6:2 E6:4 C#6:4 A5:4 E5:4 G5:4',
      'Gm Dm Bb A','G5:2 Bb5:2 D6:6 C6:2 Bb5:4 A5:2 F5:2 D5:4 F5:2 A5:2 D6:4 D6:2 C6:2 Bb5:2 A5:2 Bb5:4 F5:4 E5:4 A5:4 C#6:6 r:2'),
    leplusprobable:T(124,'disco','F#m D A E','C#6:2 r:1 C#6:1 A5:2 F#5:2 A5:2 C#6:2 E6:4 D6:4 A5:2 F#5:2 A5:4 D6:4 C#6:2 r:1 C#6:1 E6:2 C#6:2 A5:4 B5:4 G#5:6 E5:2 B5:4 r:4',
      'Bm C#m D E','D6:2 C#6:2 B5:4 F#5:4 B5:4 E6:2 D#6:2 C#6:4 G#5:4 C#6:4 F#6:4 E6:2 D6:2 A5:4 D6:4 E6:4 D6:2 C#6:2 B5:4 G#5:4'),
    quiadit:T(96,'noir','Cm Fm G7 Cm','G5:3 Eb5:1 C5:4 r:2 D5:2 Eb5:2 G5:2 Ab5:3 F5:1 C5:4 r:4 Ab5:2 G5:2 F5:2 D5:2 B4:4 D5:2 F5:2 Ab5:4 G5:8 r:4 Eb5:2 D5:2',
      'Abmaj7 Fm7 Ddim G7','C6:4 G5:2 Eb5:2 C5:4 Eb5:4 Ab5:4 F5:2 C5:2 Eb5:4 r:4 F5:2 Ab5:2 D5:4 F5:4 Ab5:4 B5:4 G5:2 F5:2 D5:4 B4:4'),
    deuxverites:T(104,'tango','Am E7 E7 Am','E5:3 F5:1 E5:2 D#5:2 E5:4 A5:4 G#5:3 A5:1 B5:2 D6:2 B5:4 G#5:4 F5:2 E5:2 D5:2 B4:2 G#4:4 B4:4 A4:4 C5:2 E5:2 A5:6 r:2',
      'Dm Am E7 Am','F5:3 E5:1 D5:2 F5:2 A5:6 r:2 E5:3 D5:1 C5:2 E5:2 A5:6 r:2 G#5:2 B5:2 D6:2 B5:2 G#5:2 E5:2 D5:4 C5:4 B4:2 C5:2 A4:6 r:2'),
    emojis:T(140,'chip','C Am F G','C6:2 G5:2 E5:2 G5:2 C6:2 E6:2 G6:4 E6:2 C6:2 A5:2 C6:2 E6:4 r:4 F6:2 E6:2 C6:2 A5:2 C6:2 F6:2 A6:4 G6:2 F6:2 D6:2 B5:2 G5:4 r:4',
      'F G Am G','A5:1 C6:1 F6:2 A5:1 C6:1 F6:2 E6:4 C6:4 B5:1 D6:1 G6:2 B5:1 D6:1 G6:2 F6:4 D6:4 C6:2 E6:2 A6:4 G6:2 E6:2 C6:4 D6:4 B5:4 G5:2 A5:2 B5:4'),
    filmresume:T(90,'epic','Dm Bb F C','D5:4 A5:6 G5:2 F5:4 F5:4 D5:4 Bb4:8 C5:4 F5:6 G5:2 A5:4 G5:8 E5:4 C5:4',
      'Gm Bb C A','G5:4 Bb5:6 A5:2 G5:4 F5:4 D6:8 C6:4 C6:6 Bb5:2 G5:4 E5:4 A5:8 C#6:4 E6:4'),
    quisuisje:T(104,'mystic','Em C Am B7','B5:2 G5:2 E5:2 G5:2 B5:4 C6:2 B5:2 G5:2 E5:2 C5:2 E5:2 G5:6 r:2 A5:2 C6:2 E6:4 D6:2 C6:2 A5:4 B5:2 A5:2 F#5:2 D#5:2 B4:6 r:2',
      'Am D G B7','E6:4 C6:2 A5:2 E5:4 A5:4 F#5:2 A5:2 D6:4 C6:2 A5:2 F#5:4 G5:2 B5:2 D6:4 B5:2 G5:2 D5:4 D#6:4 B5:2 A5:2 F#5:4 D#5:4'),
    motatrous:T(116,'bouncy','F Dm Bb C','A5:1 r:1 A5:1 r:1 C6:2 A5:2 F5:2 G5:2 A5:4 F5:1 r:1 F5:1 r:1 A5:2 F5:2 D5:4 r:4 D6:1 r:1 D6:1 r:1 C6:2 Bb5:2 F5:2 G5:2 A5:4 G5:2 E5:2 C5:2 E5:2 G5:4 r:4',
      'Bb C Dm C','F5:2 Bb5:2 D6:4 C6:2 Bb5:2 F5:4 E5:2 G5:2 C6:4 Bb5:2 G5:2 E5:4 F5:2 A5:2 D6:4 C6:2 A5:2 F5:4 G5:4 C6:4 E6:4 r:4'),
    express:T(160,'rush','Em C D B','E5:1 G5:1 B5:1 E6:1 r:2 B5:2 E6:2 D6:2 B5:4 E5:1 G5:1 C6:1 E6:1 r:2 C6:2 E6:2 D6:2 C6:4 F#5:1 A5:1 D6:1 F#6:1 r:2 D6:2 F#6:2 E6:2 D6:4 D#6:4 B5:4 F#5:4 D#5:4',
      'Am C D B','A5:2 A5:2 C6:2 E6:2 D6:2 C6:2 A5:4 G5:2 G5:2 C6:2 E6:2 G6:4 E6:4 F#6:2 E6:2 D6:2 A5:2 F#5:4 A5:4 B5:2 D#6:2 F#6:4 D#6:4 B5:4'),
    quatreimages:T(108,'tropical','Bb Gm Eb F','D6:2 r:1 D6:1 F6:2 D6:2 Bb5:2 C6:2 D6:4 Bb5:2 r:1 Bb5:1 D6:2 Bb5:2 G5:4 r:4 G5:2 Bb5:2 Eb6:2 D6:2 Eb6:2 F6:2 G6:4 F6:4 C6:4 A5:4 r:4',
      'Eb F Gm F','Bb5:3 G5:3 Eb5:2 F5:2 G5:2 Bb5:4 A5:3 F5:3 C5:2 D5:2 F5:2 A5:4 Bb5:3 G5:3 D6:2 C6:2 Bb5:2 G5:4 A5:4 C6:4 F6:8'),
    intrus:T(128,'tension','Am Am F E','A5:2 r:2 C6:2 B5:2 A5:2 G#5:2 A5:4 E6:2 r:2 D6:2 C6:2 B5:2 C6:2 A5:4 F5:2 A5:2 C6:2 F6:2 E6:4 C6:4 B5:2 G#5:2 E5:2 G#5:2 B5:4 E6:4',
      'Dm E Am G','D6:4 F6:4 E6:2 D6:2 A5:4 G#5:4 B5:4 D6:2 B5:2 G#5:4 C6:4 E6:4 A6:4 E6:4 D6:4 B5:2 G5:2 D6:8'),
    survive:T(110,'tribal','Dm C Bb C','D5:2 F5:2 G5:2 A5:6 G5:2 F5:2 E5:2 G5:2 C6:4 A5:2 G5:2 E5:4 F5:2 D5:2 F5:2 G5:2 A5:4 Bb5:4 C6:4 A5:2 G5:2 E5:8',
      'Bb C Dm A','D6:6 C6:2 Bb5:4 F5:4 E6:6 D6:2 C6:4 G5:4 F6:4 E6:2 D6:2 A5:4 D6:4 C#6:8 A5:4 E5:4'),
    choixgroupe:T(116,'gospel','D A Bm G','F#5:2 A5:2 D6:4 C#6:2 D6:2 A5:4 E5:2 A5:2 C#6:4 B5:2 A5:2 E5:4 D5:2 F#5:2 B5:4 A5:2 F#5:2 D5:4 B4:2 D5:2 G5:4 A5:4 B5:4',
      'G A F#m A','D6:3 B5:3 G5:2 A5:2 B5:2 D6:4 C#6:3 A5:3 E5:2 F#5:2 G5:2 A5:4 A5:3 F#5:3 C#5:2 E5:2 F#5:2 A5:4 E6:4 C#6:4 A5:4 r:4'),
    classement:T(140,'ska','G Em C D','D5:2 G5:2 B5:2 D6:2 r:2 B5:2 D6:4 E6:2 D6:2 B5:2 G5:2 r:2 E5:2 G5:4 C6:2 E6:2 G6:4 E6:2 C6:2 G5:4 F#5:2 A5:2 D6:2 F#6:2 E6:4 D6:4',
      'C D G D','G5:4 E5:2 G5:2 C6:4 B5:2 A5:2 F#5:4 D5:2 F#5:2 A5:4 G5:2 F#5:2 G5:2 B5:2 D6:2 G6:2 F#6:2 D6:2 B5:4 A5:4 D6:4 F#6:4 r:4'),
    motinterdit:T(132,'spy','Em C Em B7','E5:2 F#5:1 F#5:1 G5:2 G5:2 F#5:2 F#5:2 E5:4 E5:2 F#5:1 F#5:1 G5:2 G5:2 C6:2 B5:2 G5:4 B5:2 r:2 B5:2 A#5:2 B5:2 E6:2 B5:4 A5:2 F#5:2 D#5:2 F#5:2 B4:8',
      'Am Em C B7','E6:4 C6:4 A5:2 B5:2 C6:4 B5:4 G5:4 E5:2 F#5:2 G5:4 G5:2 C6:2 E6:4 D#6:2 E6:2 G6:4 F#6:4 D#6:4 B5:4 A5:4'),
    dessin:T(86,'lofi','Fmaj7 Dm7 Gm7 C7','A5:3 C6:3 E6:4 r:2 C6:2 A5:2 F5:3 A5:3 C6:4 r:2 A5:2 F5:2 Bb5:3 D6:3 F6:4 D6:2 Bb5:2 A5:2 G5:6 E5:2 r:8',
      'Bbmaj7 Am7 Gm7 C7','D6:4 F6:4 A6:4 r:4 C6:4 E6:4 G6:4 r:4 Bb5:2 A5:2 G5:2 F5:2 D5:4 F5:4 E5:4 G5:4 Bb5:4 C6:4'),
    cerveau:T(150,'chip','A F#m D E','C#6:1 E6:1 A6:2 E6:1 C#6:1 A5:2 B5:2 C#6:2 E6:4 A5:1 C#6:1 F#6:2 C#6:1 A5:1 F#5:2 G#5:2 A5:2 C#6:4 F#6:2 E6:2 D6:2 A5:2 D6:2 E6:2 F#6:4 G#6:4 E6:2 B5:2 G#5:2 B5:2 E6:4',
      'D E C#m E','A5:2 D6:2 F#6:2 A6:2 F#6:2 D6:2 A5:4 B5:2 E6:2 G#6:2 B6:2 G#6:2 E6:2 B5:4 C#6:2 E6:2 G#6:4 E6:2 C#6:2 G#5:4 B5:4 G#5:4 E5:4 r:4'),
    sondage:T(126,'gameshow','Eb Cm Ab Bb','G5:2 Bb5:2 Eb6:2 r:2 Eb6:2 D6:2 Eb6:4 Eb6:2 C6:2 G5:2 r:2 G5:2 Ab5:2 G5:4 Ab5:2 C6:2 Eb6:2 r:2 F6:2 Eb6:2 C6:4 D6:4 Bb5:2 F5:2 D6:4 F6:4',
      'Ab Bb Gm Bb','Eb6:3 C6:3 Ab5:2 Bb5:2 C6:2 Eb6:4 F6:3 D6:3 Bb5:2 C6:2 D6:2 F6:4 G6:3 D6:3 Bb5:2 C6:2 D6:2 G6:4 F6:4 D6:4 Bb5:4 r:4'),
    academie:T(112,'classical','G C D G','D5:2 G5:2 B5:2 D6:2 C6:2 B5:2 A5:2 G5:2 E5:2 G5:2 C6:2 E6:2 D6:2 C6:2 B5:2 A5:2 F#5:2 A5:2 D6:2 F#6:2 E6:2 D6:2 C6:2 A5:2 B5:4 G5:4 D5:4 r:4',
      'Em Am D7 D','G5:4 B5:4 E6:4 D6:2 B5:2 C6:4 A5:4 E5:4 G5:2 A5:2 F#5:2 A5:2 C6:2 D6:2 E6:2 D6:2 C6:2 A5:2 F#5:8 A5:4 r:4'),
    wario:T(156,'wario','C Eb F G','G5:1 G5:1 C6:2 G5:2 E6:2 D6:2 C6:2 Bb5:4 G5:1 G5:1 Eb6:2 G5:2 Bb5:2 G5:2 Eb5:2 F5:4 A5:1 A5:1 F6:2 C6:2 A5:2 C6:2 D6:2 Eb6:4 D6:2 B5:2 G5:2 D5:2 G5:4 r:4',
      'Ab Bb C C','C6:2 Eb6:2 Ab6:4 G6:2 Eb6:2 C6:4 D6:2 F6:2 Bb6:4 Ab6:2 F6:2 D6:4 E6:2 G6:2 C7:4 Bb6:2 G6:2 E6:4 C6:2 r:2 C6:2 r:2 C5:4 r:4'),
    // Boucle triomphale jouée juste après la fanfare de victoire
    victoryLoop:T(138,'march','C Ab Bb C','G5:2 C6:2 E6:4 D6:2 C6:2 G5:4 Ab5:2 C6:2 Eb6:4 D6:2 C6:2 Ab5:4 Bb5:2 D6:2 F6:4 Eb6:2 D6:2 Bb5:4 C6:4 E6:4 G6:8',
      'F Em Dm G','A5:4 C6:2 F6:2 E6:4 C6:4 G5:4 B5:2 E6:2 D6:4 B5:4 F5:4 A5:2 D6:2 C6:4 A5:4 B5:4 D6:4 G6:4 F6:4',{form:['A','B','A','B']})
  };
  // Alias : variantes d'un même jeu
  THEMES.finisphrase=THEMES.finislaphrase;THEMES.reponseexpress=THEMES.express;THEMES.survivrais=THEMES.survive;

  // Prépare un morceau : liste de mesures (accord, notes de mélodie, couches actives)
  const compiled={};
  const compile=name=>{
    if(compiled[name])return compiled[name];
    const th=THEMES[name];const st=STYLES[th.style];
    const form=th.form||['A','B','a','B'];const bars=[];const seen={};
    form.forEach(tag=>{
      const key=tag.toUpperCase(),sec=th[key],ch=sec.ch.split(/\s+/).map(parseChord),lead=parseLead(sec.lead);
      const breakdown=tag!==key;seen[key]=(seen[key]||0)+1;
      ch.forEach((c,i)=>{
        const notes=lead.events.filter(e=>e.pos>=i*16&&e.pos<(i+1)*16).map(e=>({...e,pos:e.pos-i*16}));
        bars.push({chord:c,notes,lead:!breakdown,breakdown,double:seen[key]>1&&!breakdown,first:i===0,last:i===ch.length-1});
      });
    });
    return compiled[name]={name,bpm:th.bpm,st,bars};
  };

  // ---------- Moteur audio ----------
  const ensure=()=>{
    if(ctx)return;
    ctx=new(window.AudioContext||window.webkitAudioContext)();
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=8;comp.ratio.value=4;comp.attack.value=.004;comp.release.value=.2;
    const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-2;limiter.knee.value=0;limiter.ratio.value=20;limiter.attack.value=.001;limiter.release.value=.1;
    master=ctx.createGain();master.gain.value=MASTER;master.connect(comp);comp.connect(limiter);limiter.connect(ctx.destination);
    musicGain=ctx.createGain();musicGain.gain.value=MUSIC;musicGain.connect(master);
    sfxGain=ctx.createGain();sfxGain.gain.value=SFX;sfxGain.connect(master);
    noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  };
  // Bus d'un morceau : permet un fondu propre lors d'un changement de musique
  const makeBus=(delayTime)=>{
    const out=ctx.createGain();out.gain.value=1;out.connect(musicGain);
    const drums=ctx.createGain();drums.gain.value=1;drums.connect(out);
    const lead=ctx.createGain();lead.gain.value=1;lead.connect(out);
    const delay=ctx.createDelay(1.5);delay.delayTime.value=delayTime;const fb=ctx.createGain();fb.gain.value=.32;const send=ctx.createGain();send.gain.value=.28;
    const damp=ctx.createBiquadFilter();damp.type='lowpass';damp.frequency.value=3200;
    send.connect(delay);delay.connect(damp);damp.connect(fb);fb.connect(delay);damp.connect(out);
    return{out,drums,lead,send,inst:out};
  };
  const env=(g,t,a,peak,dec,sus,rel,end)=>{g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(peak*sus,t+a,dec);g.gain.setValueAtTime(peak*sus,end);g.gain.setTargetAtTime(.0001,end,rel)};
  const osc=(type,f,t,stop,dest,detune=0)=>{const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);o.detune.value=detune;o.connect(dest);o.start(t);o.stop(stop);return o};
  const filt=(type,f,q,dest)=>{const b=ctx.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q||.7;b.connect(dest);return b};
  const noise=(t,dur,dest)=>{const s=ctx.createBufferSource();s.buffer=noiseBuf;s.connect(dest);s.start(t,Math.random()*.5);s.stop(t+dur);return s};

  // --- Batterie ---
  const DRUM={
    kick(d,t,v){const g=ctx.createGain();g.connect(d);g.gain.setValueAtTime(v*1.1,t);g.gain.exponentialRampToValueAtTime(.001,t+.4);const o=osc('sine',160,t,t+.42,g);o.frequency.exponentialRampToValueAtTime(42,t+.13);const c=ctx.createGain();c.connect(d);c.gain.setValueAtTime(v*.35,t);c.gain.exponentialRampToValueAtTime(.001,t+.02);osc('triangle',900,t,t+.03,c)},
    snare(d,t,v){const g=ctx.createGain();g.connect(d);g.gain.setValueAtTime(v*.55,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);noise(t,.22,filt('highpass',1400,.7,g));const b=ctx.createGain();b.connect(d);b.gain.setValueAtTime(v*.4,t);b.gain.exponentialRampToValueAtTime(.001,t+.1);const o=osc('triangle',220,t,t+.12,b);o.frequency.exponentialRampToValueAtTime(160,t+.1)},
    clap(d,t,v){const g=ctx.createGain();g.connect(d);[0,.012,.024].forEach(o=>{g.gain.setValueAtTime(v*.6,t+o);g.gain.exponentialRampToValueAtTime(.05,t+o+.01)});g.gain.exponentialRampToValueAtTime(.001,t+.18);noise(t,.2,filt('bandpass',1500,1.2,g))},
    hat(d,t,v,open){const g=ctx.createGain();g.connect(d);const len=open?.22:.045;g.gain.setValueAtTime(v*.32,t);g.gain.exponentialRampToValueAtTime(.001,t+len);noise(t,len+.02,filt('highpass',7500,.7,g))},
    tom(d,t,v){const g=ctx.createGain();g.connect(d);g.gain.setValueAtTime(v*.8,t);g.gain.exponentialRampToValueAtTime(.001,t+.35);const o=osc('sine',140,t,t+.37,g);o.frequency.exponentialRampToValueAtTime(70,t+.3)},
    crash(d,t,v){const g=ctx.createGain();g.connect(d);g.gain.setValueAtTime(v*.28,t);g.gain.exponentialRampToValueAtTime(.001,t+1.4);noise(t,1.45,filt('highpass',5000,.5,g))},
    shaker(d,t,v){const g=ctx.createGain();g.connect(d);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v*.16,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.07);noise(t,.08,filt('highpass',9000,.7,g))},
    tick(d,t,v){const g=ctx.createGain();g.connect(d);g.gain.setValueAtTime(v*.22,t);g.gain.exponentialRampToValueAtTime(.001,t+.03);osc('square',2400,t,t+.035,filt('bandpass',2400,4,g))},
    castanet(d,t,v){const g=ctx.createGain();g.connect(d);g.gain.setValueAtTime(v*.3,t);g.gain.exponentialRampToValueAtTime(.001,t+.04);noise(t,.05,filt('bandpass',3200,3,g))}
  };

  // --- Instruments mélodiques ---
  const voice=(type,dest,m,t,dur,v,sendDest)=>{
    const f=mtof(m),g=ctx.createGain();g.connect(dest);if(sendDest){const s=ctx.createGain();s.gain.value=1;g.connect(s);s.connect(sendDest)}
    const end=t+dur,stop=end+.6;
    switch(type){
      case'square':case'chip':{env(g,t,.005,v*.5,.12,.7,.04,end);const lp=filt('lowpass',type==='chip'?6000:3200,.8,g);const o=osc('square',f,t,stop,lp);if(dur>.25){const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=5.5;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*.012,t+.25);lfo.connect(lg);lg.connect(o.frequency);lfo.start(t);lfo.stop(stop)}break}
      case'saw':{env(g,t,.008,v*.45,.15,.65,.06,end);const lp=filt('lowpass',3000,1.5,g);osc('sawtooth',f,t,stop,lp,-7);osc('sawtooth',f,t,stop,lp,7);break}
      case'pluck':case'twang':{env(g,t,.003,v*.6,.18,.25,.08,end);const lp=filt('lowpass',600,2,g);lp.frequency.setValueAtTime(5000,t);lp.frequency.exponentialRampToValueAtTime(700,t+.25);const o=osc('sawtooth',f,t,stop,lp);if(type==='twang'){const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=6;lg.gain.value=f*.01;lfo.connect(lg);lg.connect(o.frequency);lfo.start(t);lfo.stop(stop)}break}
      case'mallet':{g.gain.setValueAtTime(v*.8,t);g.gain.exponentialRampToValueAtTime(.001,t+Math.max(.35,Math.min(dur,.9)));osc('sine',f,t,stop,g);const h=ctx.createGain();h.connect(g);h.gain.setValueAtTime(.4,t);h.gain.exponentialRampToValueAtTime(.001,t+.08);osc('sine',f*4,t,t+.1,h);break}
      case'bell':case'vibe':case'musicbox':{const dec=type==='musicbox'?.6:1.2;g.gain.setValueAtTime(v*.6,t);g.gain.exponentialRampToValueAtTime(.001,t+dec);osc('sine',f,t,t+dec+.05,g);const h=ctx.createGain();h.connect(g);h.gain.setValueAtTime(type==='vibe'?.25:.35,t);h.gain.exponentialRampToValueAtTime(.001,t+dec*.4);osc('sine',f*(type==='vibe'?4:2.76),t,t+dec,h);if(type==='vibe'){const trem=ctx.createOscillator(),tg=ctx.createGain();trem.frequency.value=5;tg.gain.value=v*.15;trem.connect(tg);tg.connect(g.gain);trem.start(t);trem.stop(t+dec)}break}
      case'brass':{env(g,t,.03,v*.5,.2,.75,.07,end);const lp=filt('lowpass',800,1.2,g);lp.frequency.setValueAtTime(700,t);lp.frequency.linearRampToValueAtTime(3200,t+.06);lp.frequency.setTargetAtTime(1900,t+.06,.2);osc('sawtooth',f,t,stop,lp,-6);osc('sawtooth',f,t,stop,lp,6);osc('square',f/2,t,stop,lp);break}
      case'flute':case'soft':{env(g,t,type==='flute'?.04:.02,v*.7,.2,.8,.06,end);const o=osc(type==='flute'?'sine':'triangle',f,t,stop,g);const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=5;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*.01,t+.3);lfo.connect(lg);lg.connect(o.frequency);lfo.start(t);lfo.stop(stop);if(type==='flute'){const b=ctx.createGain();b.gain.value=v*.05;b.connect(g);noise(t,dur,filt('bandpass',f*2,2,b))}break}
      case'reed':case'accordion':{env(g,t,.02,v*.4,.15,.8,.05,end);const bp=filt('lowpass',2200,1,g);osc('square',f,t,stop,bp,-5);osc('sawtooth',f,t,stop,bp,5);break}
      case'organ':{env(g,t,.01,v*.35,.1,.9,.04,end);osc('sine',f,t,stop,g);osc('sine',f*2,t,stop,g);const h=ctx.createGain();h.gain.value=.5;h.connect(g);osc('sine',f*3,t,stop,h);break}
      case'piano':case'clav':{g.gain.setValueAtTime(v*.5,t);g.gain.exponentialRampToValueAtTime(.001,t+Math.min(.5,dur+.1));const lp=filt('lowpass',type==='clav'?2600:1800,type==='clav'?4:1,g);osc(type==='clav'?'square':'triangle',f,t,t+.6,lp);osc('sine',f*2,t,t+.3,g);break}
      case'strings':{env(g,t,.12,v*.3,.3,.85,.15,end);const lp=filt('lowpass',1600,.7,g);osc('sawtooth',f,t,stop,lp,-9);osc('sawtooth',f,t,stop,lp,9);break}
      case'rhodes':{g.gain.setValueAtTime(v*.5,t);g.gain.setTargetAtTime(v*.18,t+.02,.5);g.gain.setValueAtTime(v*.18,end);g.gain.setTargetAtTime(.0001,end,.1);osc('sine',f,t,stop,g);const h=ctx.createGain();h.connect(g);h.gain.setValueAtTime(.3,t);h.gain.exponentialRampToValueAtTime(.001,t+.3);osc('sine',f*7,t,t+.3,h);break}
      // Basses
      case'sub':{env(g,t,.01,v*.8,.2,.8,.05,end);osc('sine',f,t,stop,g);const h=ctx.createGain();h.gain.value=.35;h.connect(g);osc('triangle',f*2,t,stop,h);break}
      case'slap':{env(g,t,.003,v*.7,.12,.45,.04,end);const lp=filt('lowpass',500,3,g);lp.frequency.setValueAtTime(2600,t);lp.frequency.exponentialRampToValueAtTime(500,t+.12);osc('sawtooth',f,t,stop,lp);osc('sine',f,t,stop,g);break}
      case'pizz':case'upright':{g.gain.setValueAtTime(v*.85,t);g.gain.exponentialRampToValueAtTime(.001,t+Math.max(.18,Math.min(dur+.05,type==='pizz'?.3:.6)));const lp=filt('lowpass',type==='pizz'?1400:900,1,g);osc('triangle',f,t,t+.7,lp);osc('sine',f,t,t+.7,g);break}
      default:{env(g,t,.005,v*.6,.15,.7,.04,end);const lp=filt('lowpass',900,2,g);lp.frequency.setValueAtTime(1200,t);lp.frequency.exponentialRampToValueAtTime(500,t+.2);osc('sawtooth',f,t,stop,lp)}
    }
  };
  const bassVoice=(type,dest,m,t,dur,v)=>{
    if(type==='saw'||type==='square'||type==='chip'){const f=mtof(m),g=ctx.createGain();g.connect(dest);env(g,t,.005,v*.55,.12,.65,.04,t+dur);const lp=filt('lowpass',500,2.5,g);lp.frequency.setValueAtTime(type==='chip'?4000:1600,t);lp.frequency.exponentialRampToValueAtTime(type==='chip'?2500:420,t+.18);osc(type==='saw'?'sawtooth':'square',f,t,t+dur+.4,lp);osc('sine',f,t,t+dur+.4,g);return}
    voice(type,dest,m,t,dur,v);
  };

  // ---------- Séquenceur (planification anticipée, stable même si l'onglet ralentit) ----------
  const chordTones=(c,base)=>{let r=base+c.pc;return c.iv.map(i=>r+i)};
  const padVoicing=c=>{let r=48+c.pc;if(r<53)r+=12;return c.iv.slice(0,4).map(i=>{let n=r+i;while(n>74)n-=12;return n})};
  const bassNote=(c,sym)=>{let r=36+c.pc;if(r<40)r+=12;const iv=c.iv;switch(sym){case'O':return r+12;case'5':return r+(iv[2]||7);case'3':return r+iv[1];case'7':return r+(iv[3]&&iv[3]<12?iv[3]:10);case'6':return r+9;default:return r}};
  const hit=(pat,i)=>pat?pat[i]:'.';

  const scheduleStep=(s,t)=>{
    const sd=s.stepDur,st=s.song.st,barIdx=Math.floor(s.step/16)%s.song.bars.length,i=s.step%16,bar=s.song.bars[barIdx],c=bar.chord,B=s.bus;
    const brk=bar.breakdown,fillZone=bar.last&&i>=12;
    // Batterie
    const k=hit(st.kick,i);if(k!=='.'&&!brk)DRUM.kick(B.drums,t,k==='g'?.5:1);
    let sn=hit(st.snare,i);if(fillZone&&st.fill==='snare'&&!brk)sn='x';
    if(sn!=='.'&&!brk)DRUM.snare(B.drums,t,sn==='g'?.35:fillZone?.6+.1*(i-12):1);
    if(hit(st.clap,i)!=='.'&&!brk)DRUM.clap(B.drums,t,1);
    const h=hit(st.hat,i);if(h!=='.')DRUM.hat(B.drums,t,(h==='g'?.45:1)*(brk?.6:1),h==='o');
    if(hit(st.perc,i)!=='.')DRUM[st.percType||'shaker'](B.drums,t,1);
    let tm=hit(st.tom,i);if(fillZone&&st.fill==='tom'&&!brk)tm='x';if(tm!=='.')DRUM.tom(B.drums,t,brk?.5:1);
    if(st.crash&&bar.first&&i===0&&!brk&&s.step>0)DRUM.crash(B.drums,t,1);
    // Basse
    const bs=hit(st.bass,i);
    if(bs!=='.'&&bs!=='-'){let len=1;while(i+len<16&&st.bass[i+len]==='-')len++;bassVoice(st.bassType||'sub',B.inst,bassNote(c,bs),t,len*sd*.92,brk?.6:.9)}
    // Nappe tenue (1 fois par mesure)
    if(st.pad&&i===0)padVoicing(c).forEach(n=>voice(st.pad,B.inst,n,t,16*sd*.98,brk?.5:.42));
    // Accords piqués
    if(st.chop&&hit(st.chop,i)!=='.'&&!brk)padVoicing(c).forEach(n=>voice(st.chopType||'piano',B.inst,n+12,t,sd*1.2,.35));
    // Arpège (renforcé pendant les ponts sans mélodie)
    const arpPat=st.arp||(brk?'0.1.2.1.0.1.2.1.':null);
    if(arpPat&&arpPat[i]!=='.'){const tones=chordTones(c,60);const idx=+arpPat[i],n=tones[idx%tones.length]+12*Math.floor(idx/tones.length);voice(st.arpType||'pluck',B.inst,n+(brk?12:0),t,sd*1.5,brk?.42:.26,B.send)}
    // Mélodie
    if(bar.lead)for(const n of bar.notes)if(n.pos===i){voice(st.lead,B.lead,n.m,t,n.len*sd*.92,.62,B.send);if(bar.double)voice(st.lead==='brass'?'brass':'square',B.lead,n.m-12,t,n.len*sd*.92,.22)}
  };
  const runScheduler=()=>{
    if(!seq||!ctx)return;
    while(seq.next<ctx.currentTime+.18){
      const swing=(seq.step%2===1)?(seq.song.st.swing||0)*seq.stepDur*2:0;
      if(seq.next>=ctx.currentTime-.05)scheduleStep(seq,seq.next+swing);
      seq.next+=seq.stepDur;seq.step++;
    }
  };
  const fadeOutBus=bus=>{if(!bus)return;const t=ctx.currentTime;bus.out.gain.cancelScheduledValues(t);bus.out.gain.setValueAtTime(bus.out.gain.value,t);bus.out.gain.linearRampToValueAtTime(0,t+.45);setTimeout(()=>{try{bus.out.disconnect()}catch(e){}},2500)};
  const startSong=(name,when)=>{
    const song=compile(name);const stepDur=60/song.bpm/4;
    seq={song,stepDur,step:0,next:when,bus:makeBus(stepDur*3)};applyEnergy(true);
    if(!schedTimer)schedTimer=setInterval(runScheduler,25);
    runScheduler();
  };
  const stop=()=>{if(seq)fadeOutBus(seq.bus);seq=null;currentTheme=null;if(schedTimer){clearInterval(schedTimer);schedTimer=null}};

  // ---------- Fanfare de victoire (façon fin de combat de RPG) ----------
  const playVictory=()=>{
    const bpm=138,b=60/bpm,t0=ctx.currentTime+.08,bus=makeBus(b*.75);
    const L=(n,beat,dur,v=.75)=>{const m=noteToMidi(n);voice('brass',bus.lead,m,t0+beat*b,dur*b,v,bus.send);voice('brass',bus.lead,m-12,t0+beat*b,dur*b,v*.45)};
    const C=(notes,beat,dur)=>notes.split(' ').forEach(n=>voice('brass',bus.inst,noteToMidi(n),t0+beat*b,dur*b,.32));
    const timp=(n,beat,v=1)=>{const t=t0+beat*b,g=ctx.createGain();g.connect(bus.drums);g.gain.setValueAtTime(v*.9,t);g.gain.exponentialRampToValueAtTime(.001,t+.9);const f=mtof(noteToMidi(n));const o=osc('sine',f*1.04,t,t+.95,g);o.frequency.exponentialRampToValueAtTime(f,t+.08);DRUM.kick(bus.drums,t,.5*v)};
    // Roulement de caisse claire d'ouverture
    for(let i=0;i<12;i++)DRUM.snare(bus.drums,t0+i*b/12,.25+.04*i);
    // Mélodie : triolet d'appel, puis montée héroïque et note tenue
    L('G5',0,.3);L('G5',1/3,.3);L('G5',2/3,.3);
    L('C6',1,1.4);C('C4 E4 G4',1,1.5);timp('C2',1);
    L('A5',2.5,.7);C('F4 A4 C5',2.5,.75);timp('F2',2.5,.8);
    L('B5',3.25,.7);C('G3 B3 D4 F4',3.25,1.75);timp('G2',3.25,.8);
    L('C6',4,.3);L('D6',4+1/3,.3);L('E6',4+2/3,.3);
    for(let i=0;i<6;i++)DRUM.snare(bus.drums,t0+(4+i/6)*b,.4+.08*i);
    L('G6',5,2.8,.85);C('C4 E4 G4 C5',5,2.9);timp('C2',5,1.1);DRUM.crash(bus.drums,t0+5*b,1.3);
    voice('strings',bus.inst,noteToMidi('C3'),t0+5*b,2.9*b,.6);
    // Puis la boucle triomphale prend le relais sur le même bus
    const loop=compile('victoryLoop');seq={song:loop,stepDur:60/loop.bpm/4,step:0,next:t0+8*b,bus};applyEnergy(true);
    if(!schedTimer)schedTimer=setInterval(runScheduler,25);
  };

  const applyEnergy=(instant)=>{if(!seq||!ctx)return;const t=ctx.currentTime,B=seq.bus,dg=energy<1?.4:1,lg=energy<1?.55:1;[[B.drums,dg],[B.lead,lg]].forEach(([n,v])=>{n.gain.cancelScheduledValues(t);if(instant)n.gain.setValueAtTime(v,t);else{n.gain.setValueAtTime(n.gain.value,t);n.gain.linearRampToValueAtTime(v,t+.6)}})};
  const play=name=>{
    if(!enabled)return;ensure();if(ctx.state==='suspended')ctx.resume();
    if(currentTheme===name&&seq)return;
    stop();currentTheme=name;
    if(name==='victory'){playVictory();return}
    startSong(THEMES[name]?name:'lobby',ctx.currentTime+.08);
  };
  const themeFor=state=>{const k=state?.phase?.kind;if(!k||k==='lobby')return'lobby';if(k==='scores')return'victory';if(state.game&&THEMES[state.game])return state.game;return'lobby'};
  const setEnergy=state=>{const k=state?.phase?.kind;const e=(k==='reveal'||k==='brainResults'||k==='academyResults'||k==='warioResults')?.5:1;if(e!==energy){energy=e;applyEnergy(false)}};

  // ---------- Effets sonores ----------
  const tone=(f,d=.12,type='sine',gain=.08,dest=sfxGain,when=0)=>{if(!ctx)return;const now=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(gain,now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+d);o.connect(g);g.connect(dest);o.start(now);o.stop(now+d+.03)};

  window.partyAudio={enable(){ensure();enabled=true;ctx.resume();play(currentTheme||'lobby');this.updateButton()},disable(){enabled=false;stop();this.updateButton()},toggle(){enabled?this.disable():this.enable()},
    update(state){if(!enabled)return;const theme=themeFor(state);play(theme);setEnergy(state);const phase=state?.phase?.n;if(phase&&phase!==lastPhase){lastPhase=phase;if(theme!=='victory'){tone(659.25,.1,'triangle',.1);tone(659.25*1.25,.14,'triangle',.07,sfxGain,.08)}}if(state?.game!==lastGame){lastGame=state?.game;tone(392,.07,'triangle',.05)}},
    answer(){if(!enabled)return;tone(523.25,.08,'triangle',.09);tone(659.25,.12,'triangle',.07,sfxGain,.07)},error(){if(!enabled)return;tone(220,.16,'sawtooth',.07)},click(){if(!enabled)return;tone(392,.05,'triangle',.045)},
    // Effets « Cerveau Turbo »
    good(m=1){if(!enabled)return;const b=523.25*Math.pow(2,Math.min(4,m-1)/6);tone(b,.07,'triangle',.09);tone(b*1.26,.07,'triangle',.08,sfxGain,.055);tone(b*1.5,.12,'triangle',.07,sfxGain,.11)},
    bad(){if(!enabled)return;tone(196,.13,'square',.055);tone(155.56,.2,'square',.045,sfxGain,.09)},
    combo(m=2){if(!enabled)return;[0,4,7,12].forEach((s,i)=>tone(523.25*Math.pow(2,(s+m)/12),.1,'square',.05,sfxGain,.05+i*.06))},
    tick(){if(!enabled)return;tone(880,.05,'square',.045)},
    go(){if(!enabled)return;tone(783.99,.08,'triangle',.1);tone(1046.5,.22,'triangle',.1,sfxGain,.08)},
    note(i=0){if(!enabled)return;tone([392,523.25,659.25,783.99,880,1046.5][i%6],.16,'sine',.09)},
    timeUp(){if(!enabled)return;[783.99,659.25,523.25,392].forEach((f,i)=>tone(f,.14,'triangle',.08,sfxGain,i*.11))},
    record(){if(!enabled)return;[523.25,659.25,783.99,1046.5,783.99,1046.5].forEach((f,i)=>tone(f,.16,'triangle',.08,sfxGain,i*.1))},
    updateButton(){document.querySelectorAll('[data-audio-toggle]').forEach(b=>{b.textContent=enabled?'🔊 Son activé':'🔇 Activer le son';b.classList.toggle('audio-on',enabled)})},
    // Pour les tests / le débogage
    _themes:THEMES,_compile:compile,_parseLead:parseLead};
})();
