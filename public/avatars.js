(function(){
// Poney façon My Little Pony : Friendship is Magic (profil 3/4, grands yeux, contours teintés, ombrages).
const C={
  races:['Poney terrestre','Licorne','Pégase','Alicorne'],
  silhouettes:['Pouliche','Jument','Étalon','Princesse'],
  coats:['Uni','Chaussettes','Ventre clair','Museau clair','Pommelé','Taches de rousseur','Liste blanche'],
  manes:['Lisse à frange','Ébouriffée','Nuage bouclé','Brushing élégant','Queue de cheval','Crête punk','Très longue','Chignon','Couettes','Tresse','Courte sportive'],
  tails:['Lisse','Ébouriffée','Nuage bouclé','Spirale élégante','Attachée','Pompon','Très longue','Tressée','En panache'],
  streaks:['Unie','Une mèche','Bicolore','Pointes colorées','Arc-en-ciel'],
  eyes:['Classique','Grands cils','Malicieux','Rêveur','Étoilés','Amoureux','Rieurs','Déterminés','Pétillants'],
  marks:['Aucune','Étoile magique','Trois pommes','Ballons','Trois diamants','Papillons','Éclair arc-en-ciel','Soleil','Lune','Cœurs','Note de musique','Fleur','Flocon'],
  hats:['Aucun','Nœud','Couronne','Tiare de princesse','Chapeau de cowboy','Chapeau de sorcière','Fleur','Casquette','Haut-de-forme','Chapeau de fête','Bonnet à pompon','Casque audio'],
  glasses:['Aucunes','Rondes','Lunettes de soleil','Lunettes d\'aviateur','Cœurs','Étoiles','Monocle'],
  necks:['Aucun','Nœud papillon','Collier royal','Foulard','Collier de perles','Cloche','Cravate','Écharpe d\'hiver'],
  clothes:['Aucun','Cape magique','Gilet','Pull douillet','Tenue de vol','Robe de gala','Armure royale'],
  effects:['Aucun','Paillettes','Aura magique','Cœurs','Étoiles','Arc-en-ciel','Bulles','Notes de musique','Petit nuage']
};
const PAL={
  body:['#f9b8d8','#c9a6e8','#9ed8f5','#fff3a6','#b8e8a0','#ffcf8f','#f6f4f8','#e9d7c3','#a8a3b8','#ffa3b5','#8fe3d4','#e7c3f6','#5d5a73','#d4b07a','#2f3a7a','#c97a4a'],
  mane:['#ec4f97','#2f2a7a','#7cc4f2','#ffe25a','#ff8a3d','#e8e3f0','#6a3f9c','#f46b6b','#3d3d4f','#9be36b','#c8166b','#ffb3d9','#5fbf9f','#b5732f','#ef4b4b','#4aa8f0'],
  eye:['#6a3f9c','#d14d8c','#3d7bd9','#2fa36b','#c97a1f','#7a3326','#18a7b5','#555064','#e0452b','#8f6ae0'],
  accent:['#ffd43b','#ff6fa8','#8f6ae0','#5fbcf2','#ef4b4b','#4cc38a','#ffffff','#2d2a3e','#ff9a3c','#b5732f']
};
const MANE_TAIL=[0,1,2,3,4,1,6,5,4,7,5];
const esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
const isHex=function(v){return typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);};
function rgb(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
function mix(h,t,k){var a=rgb(h),b=rgb(t);return'#'+a.map(function(v,i){return Math.round(v+(b[i]-v)*k).toString(16).padStart(2,'0');}).join('');}
function dark(h,k){return mix(h,'#2a1838',k==null?.42:k);}
function light(h,k){return mix(h,'#ffffff',k==null?.45:k);}
function def(){return{type:'pony',version:2,name:'Mon poney',race:1,silhouette:1,coat:0,coatColor:'#ffffff',bodyColor:'#c9a6e8',mane:0,maneColor:'#2f2a7a',maneColor2:'#ec4f97',streak:1,tail:0,eyes:0,eyeColor:'#6a3f9c',mark:1,markColor:'#ec4f97',hat:0,glasses:0,neck:0,clothes:0,accessoryColor:'#ffd43b',effect:0};}
function norm(a){
  if(!a||typeof a!=='object'||a.type!=='pony')return a;
  var d=def();
  if(a.version!==2){ // ancien format : on garde couleurs et race
    var h=Number(a.horn)>0,w=Number(a.wings)>0;
    d.race=h&&w?3:h?1:w?2:0;
    ['name','bodyColor','maneColor','eyeColor','markColor','accessoryColor'].forEach(function(k){if(a[k]!==undefined)d[k]=a[k];});
    return d;
  }
  Object.keys(d).forEach(function(k){if(a[k]!==undefined)d[k]=a[k];});
  return d;
}
function n(v,m){v=Number(v)||0;return Math.max(0,Math.min(m-1,v))|0;}
var uid=0;
function P(d,attr){return'<path d="'+d+'" '+(attr||'')+'/>';}
function circ(c,attr){return'<circle cx="'+c[0]+'" cy="'+c[1]+'" r="'+c[2]+'" '+(attr||'')+'/>';}
function ell(e,attr){return'<ellipse cx="'+e[0]+'" cy="'+e[1]+'" rx="'+e[2]+'" ry="'+e[3]+'" transform="rotate('+(e[4]||0)+' '+e[0]+' '+e[1]+')" '+(attr||'')+'/>';}
// Une forme de cheveux = liste de chemins (string), cercles {c:[x,y,r]} ou ellipses {e:[x,y,rx,ry,rot]}
function shapes(list,attr){return list.map(function(x){return typeof x==='string'?P(x,attr):x.c?circ(x.c,attr):ell(x.e,attr);}).join('');}
function curls(list,col){return list.filter(function(x){return x.c;}).map(function(x){var c=x.c,r=c[2]*.45;return'<path d="M'+(c[0]-r)+' '+c[1]+'a'+r+' '+r+' 0 1 1 '+r+' '+r+'" fill="none" stroke="'+col+'" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>';}).join('');}
function braid(pts,rx,ry){return pts.map(function(p,i){return{e:[p[0],p[1],rx,ry,p[2]||(i%2?25:-25)]};});}

// ---------- Crinières (repère de la tête) : back = derrière la tête, front = frange ----------
var MANES=[
 {back:['M110 32C146 30 166 56 164 92C162 122 170 146 182 166L170 160L172 172C150 166 136 148 132 124C128 100 126 66 110 32Z'],
  front:['M52 74C48 46 70 26 100 26C124 26 142 40 146 60C138 54 128 52 118 54C110 56 104 58 98 66C92 60 82 60 74 64C68 70 68 80 72 88C62 86 54 80 52 74Z'],
  strands:['M64 64C70 46 90 36 114 38','M84 58C96 46 116 44 132 50','M138 54C154 80 150 116 164 146','M126 50C144 74 140 112 152 140'],shine:['M70 44C84 34 104 32 120 36','M142 62C150 82 148 100 150 112']},
 {back:['M110 32L150 24L142 40L172 40L152 56L180 66L156 74L178 94L154 96L170 120L146 114L154 138L134 120C128 96 124 64 110 32Z'],
  front:['M54 72L38 58L60 54L46 36L70 40L64 18L88 32L94 12L108 30L124 16L126 36L148 30L140 50L150 58C138 54 126 54 116 58L112 48L104 60L94 52L88 66L78 58L72 72L64 64Z'],
  strands:['M64 52L84 44','M98 38L116 34','M140 46L162 60','M146 80L166 96','M140 102L158 120'],shine:['M74 30L90 38','M110 24L120 32']},
 {back:[{c:[140,50,17]},{c:[154,72,17]},{c:[146,94,16]},{c:[160,112,16]},{c:[146,130,15]},{c:[164,138,13]},{c:[132,112,13]}],
  front:[{c:[134,42,14]},{c:[118,28,16]},{c:[98,24,16]},{c:[78,30,16]},{c:[62,44,15]},{c:[54,62,12]},{c:[72,54,11]},{c:[94,44,12]},{c:[116,46,11]}],
  strands:[],shine:['M84 20C92 16 102 16 108 20','M60 34C64 30 70 28 74 28']},
 {back:['M112 30C150 30 170 60 162 92C156 112 162 128 178 136C194 144 198 164 184 172C170 180 156 168 160 156C164 148 174 152 172 158C158 150 140 138 134 118C128 96 126 62 112 30Z'],
  front:['M48 72C40 44 64 22 98 24C128 26 148 42 146 64C132 50 112 46 96 50C80 54 70 60 66 70C64 76 68 82 74 80C70 90 56 90 50 82C48 78 48 75 48 72Z'],
  strands:['M68 44C88 34 116 34 136 46','M60 62C66 50 80 42 96 40','M140 56C156 80 150 106 160 126','M58 76a6 6 0 1 1 8 4'],shine:['M66 36C80 28 100 26 116 30','M152 70C158 84 156 98 152 108']},
 {back:['M110 30C134 30 148 50 146 74C146 84 142 90 138 94L142 100C162 110 172 134 168 162C166 176 160 186 150 194C152 174 146 152 138 140C130 128 128 112 130 100L132 92C126 70 122 50 110 30Z'],
  front:['M56 66C56 42 82 28 106 28C128 28 144 42 146 60C134 52 120 48 106 50C94 52 86 56 80 62C74 58 64 58 56 66Z'],
  strands:['M70 46C88 36 110 34 130 42','M150 116C160 136 158 160 152 180','M140 112C148 132 146 152 140 170'],shine:['M74 36C88 30 104 30 116 32'],
  band:[134,96,10,7,-30]},
 {back:['M128 36L158 28L148 46L172 48L152 62L170 76L148 80L160 98L138 94C134 74 132 54 128 36Z'],
  front:['M62 52L54 32L74 38L74 14L92 30L100 6L112 28L128 12L130 34L146 26L142 46C128 40 112 38 98 40C84 42 72 46 62 52Z'],
  strands:['M80 40L86 26','M104 36L106 20','M124 38L130 26','M146 56L160 52'],shine:['M88 22L92 30']},
 {back:['M110 30C150 30 172 62 168 100C164 140 178 172 200 200L184 196L190 210C156 198 138 164 132 128C128 98 126 62 110 30Z'],
  front:['M52 72C46 46 68 26 98 26C126 26 146 42 148 66C140 58 128 54 116 56C104 58 96 62 90 70C84 64 74 64 66 70C62 74 58 76 52 72Z','M132 58C146 82 146 114 138 144C132 166 134 186 144 204C124 198 116 172 120 148C124 120 126 90 120 64Z'],
  strands:['M66 50C82 38 104 34 128 40','M140 60C158 96 152 140 176 182','M134 76C140 104 136 134 130 160'],shine:['M70 38C86 30 104 28 120 32','M156 76C162 96 160 116 160 130']},
 {back:['M114 32C136 34 148 50 146 72C146 84 140 94 132 100C128 76 124 52 114 32Z'],
  front:['M58 62C62 40 84 28 108 28C126 28 140 38 144 52C130 46 112 44 98 46C82 48 68 54 58 62Z',{c:[124,18,15]},{c:[112,14,8]}],
  strands:['M66 52C80 40 102 36 124 40','M116 14a8 8 0 1 1 10 10'],shine:['M72 42C84 34 98 32 110 32'],
  band:[118,30,9,5,-15]},
 {back:['M128 52C150 60 162 84 158 112C156 128 160 140 168 152C148 152 138 134 140 112C142 92 136 72 128 52Z'],
  front:['M56 66C56 42 82 28 106 28C128 28 144 42 146 60C134 52 120 48 106 50C94 52 86 56 80 62C74 58 64 58 56 66Z','M122 62C140 76 144 100 140 126C138 140 142 152 150 162C130 162 122 146 124 128C126 108 122 90 114 76Z'],
  strands:['M70 46C88 36 110 34 130 42','M134 84C138 100 136 116 134 130','M150 90C154 104 152 118 152 130'],shine:['M74 36C88 30 104 30 116 32'],
  band:[134,78,8,5,30],band2:[130,74,8,5,40]},
 {back:[{e:[132,54,10,9]}].concat(braid([[138,70],[144,86],[148,102],[152,118],[156,134],[160,150],[164,164]],10,9),['M160 170C168 176 174 188 170 198C164 190 158 186 152 184C156 180 158 176 160 170Z']),
  front:['M52 74C48 46 70 26 100 26C124 26 142 40 146 60C134 52 122 50 110 52C96 54 84 60 74 70C66 74 58 76 52 74Z'],
  strands:['M66 56C80 42 102 36 124 40'],shine:['M70 42C84 34 104 32 120 36']},
 {back:['M112 36C134 36 146 50 146 70C152 76 150 88 142 92C138 82 132 76 126 76C124 62 120 48 112 36Z'],
  front:['M60 60C64 40 86 28 108 30C128 32 142 44 142 60C136 52 126 46 114 46C108 40 96 40 90 48C82 44 70 48 66 56C64 56 62 58 60 60Z'],
  strands:['M76 46C82 40 90 38 98 40','M118 40C126 42 132 46 136 52'],shine:['M78 36C88 32 100 32 108 34']}
];
// ---------- Queues (repère du corps) ----------
var TAILS=[
 {s:['M196 136C222 136 236 164 232 196C230 214 222 226 210 236L208 222L198 232C206 210 206 186 200 170C196 160 192 154 188 150Z'],strands:['M204 146C220 164 224 192 214 220','M198 156C208 176 210 200 204 220'],shine:['M212 142C226 158 230 178 228 196']},
 {s:['M194 136L222 128L214 144L238 150L218 160L236 176L214 178L228 200L206 194L210 222L196 206L192 228C196 200 196 176 190 156Z'],strands:['M200 150L220 156','M202 176L220 186','M198 200L206 212'],shine:['M206 136L216 140']},
 {s:[{c:[200,170,11]},{c:[200,196,11]},{c:[206,146,13]},{c:[220,164,14]},{c:[214,188,14]},{c:[224,208,13]},{c:[206,216,12]}],strands:[],shine:['M200 138C206 136 212 138 214 142']},
 {s:['M194 136C224 136 238 166 230 196C224 218 202 228 190 216C180 206 188 192 200 194C208 196 208 206 200 206C214 206 220 188 214 172C208 158 198 152 188 150Z'],strands:['M200 146C218 156 226 176 222 196','M194 208a6 6 0 1 1 8 -4'],shine:['M214 144C226 156 232 172 230 186']},
 {s:['M194 138C204 136 212 140 214 148L216 154C232 168 236 196 226 224C222 234 214 238 206 240C212 222 210 200 204 186C198 174 200 160 206 156L204 150C200 150 194 152 188 150Z'],strands:['M214 168C222 186 222 208 214 228','M208 172C212 190 212 208 208 222'],shine:['M222 170C228 182 230 196 228 206'],band:[209,152,9,6,-60]},
 {s:[{c:[212,152,16]},{c:[226,164,13]},{c:[214,172,13]},{c:[200,146,10]}],strands:[],shine:['M206 140C212 138 218 140 222 144']},
 {s:['M196 136C222 140 234 170 232 204C232 222 238 232 248 240L224 240L228 232L212 240C216 214 208 186 200 168C196 158 192 154 188 150Z'],strands:['M204 148C220 170 224 204 222 232','M200 160C210 184 212 210 216 236'],shine:['M214 146C228 166 232 190 230 212']},
 {s:[{e:[198,148,9,8]}].concat(braid([[204,160],[208,174],[212,188],[214,202],[216,216]],10,9),['M214 224C222 230 226 238 222 244C216 240 210 238 204 238C208 234 212 230 214 224Z']),strands:[],shine:[]},
 {s:['M188 152C192 120 214 94 238 104C254 112 250 138 232 140C222 140 220 128 228 126C222 118 208 126 204 146C202 154 196 158 190 158Z'],strands:['M196 146C200 126 214 110 232 112','M238 120a6 6 0 1 1 -6 10'],shine:['M210 104C220 100 232 100 240 106']}
];

function cutieMark(i,c1,c2,x,y){
  var s='<g transform="translate('+x+' '+y+') scale(.9)">';
  var st=' stroke="'+dark(c1,.35)+'" stroke-width="1.4" stroke-linejoin="round"';
  switch(i){
    case 1:s+='<path d="M0-15L4-4L15-3L6 4L9 15L0 8L-9 15L-6 4L-15-3L-4-4Z" fill="'+c1+'"'+st+'/><g fill="#fff"><path d="M-12-14l1.5 3 3 .5-2.3 2 .6 3.2-2.8-1.6-2.8 1.6.6-3.2-2.3-2 3-.5Z"/><circle cx="13" cy="-12" r="1.6"/><circle cx="12" cy="11" r="1.4"/></g>';break;
    case 2:[[-8,-4],[8,-4],[0,8]].forEach(function(p){s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="7" fill="'+c1+'"'+st+'/><path d="M'+p[0]+' '+(p[1]-6)+'q1-4 4-5" stroke="#6b4a2a" stroke-width="1.6" fill="none"/><path d="M'+(p[0]+1)+' '+(p[1]-7)+'q4-3 6 0q-3 2-6 0Z" fill="#4cc38a"/>';});break;
    case 3:[[-8,-8,c1],[7,-10,c2],[0,2,light(c1,.2)]].forEach(function(p){s+='<path d="M'+p[0]+' '+(p[1]+8)+'q-1 6 -3 12" stroke="#777" stroke-width="1" fill="none"/><ellipse cx="'+p[0]+'" cy="'+p[1]+'" rx="6" ry="8" fill="'+p[2]+'"'+st+'/>';});break;
    case 4:[[-9,-6],[9,-6],[0,8]].forEach(function(p){s+='<path d="M'+(p[0]-6)+' '+(p[1]-3)+'L'+(p[0]-3)+' '+(p[1]-7)+'H'+(p[0]+3)+'L'+(p[0]+6)+' '+(p[1]-3)+'L'+p[0]+' '+(p[1]+7)+'Z" fill="'+c1+'"'+st+'/><path d="M'+(p[0]-6)+' '+(p[1]-3)+'H'+(p[0]+6)+'" stroke="#fff" stroke-width="1"/>';});break;
    case 5:[[-6,-4,1],[8,6,.75]].forEach(function(p){s+='<g transform="translate('+p[0]+' '+p[1]+') scale('+p[2]+')"><path d="M0 0C-4-10-14-12-12-2C-11 3-4 3 0 0C-4 4-10 10-5 12C-1 13 0 6 0 0C0 6 1 13 5 12C10 10 4 4 0 0C4 3 11 3 12-2C14-12 4-10 0 0Z" fill="'+c1+'"'+st+'/><path d="M0-2V6" stroke="'+dark(c1)+'" stroke-width="1.6"/></g>';});break;
    case 6:s+='<path d="M-14-6C-8-18 8-18 14-6" stroke="'+c2+'" stroke-width="3" fill="none"/><ellipse cx="-11" cy="-5" rx="7" ry="5" fill="#fff"'+st+'/><path d="M2-8L-6 4L1 3L-4 16L9-1L2 0L7-8Z" fill="'+c1+'" stroke="'+dark(c1,.35)+'" stroke-width="1.2" stroke-linejoin="round"/>';break;
    case 7:s+='<g stroke="'+c1+'" stroke-width="3" stroke-linecap="round">'+[0,45,90,135,180,225,270,315].map(function(r){return'<path d="M0-11V-16" transform="rotate('+r+')"/>';}).join('')+'</g><circle r="9" fill="'+c1+'"'+st+'/><circle r="5" fill="'+c2+'"/>';break;
    case 8:s+='<path d="M4-14A14 14 0 1 0 14 6A11 11 0 1 1 4-14Z" fill="'+c1+'"'+st+'/><path d="M8-6l1.4 3 3 .4-2.2 2 .6 3-2.8-1.5-2.8 1.5.6-3-2.2-2 3-.4Z" fill="'+c2+'"/>';break;
    case 9:[[-6,-4,1,c1],[8,6,.7,c2]].forEach(function(p){s+='<path transform="translate('+p[0]+' '+p[1]+') scale('+p[2]+')" d="M0 10C-14 0-14-12-6-12C-2-12 0-8 0-6C0-8 2-12 6-12C14-12 14 0 0 10Z" fill="'+p[3]+'"'+st+'/>';});break;
    case 10:s+='<path d="M-4 8V-12L10-15V5" stroke="'+dark(c1,.25)+'" stroke-width="2.6" fill="none"/><ellipse cx="-8" cy="8" rx="6" ry="4.6" fill="'+c1+'"'+st+'/><ellipse cx="6" cy="5" rx="6" ry="4.6" fill="'+c2+'"'+st+'/>';break;
    case 11:s+=[0,72,144,216,288].map(function(r){return'<ellipse cx="0" cy="-8" rx="5.5" ry="8" fill="'+c1+'"'+st+' transform="rotate('+r+')"/>';}).join('')+'<circle r="4.5" fill="'+c2+'"/>';break;
    case 12:s+='<g stroke="'+c1+'" stroke-width="3" stroke-linecap="round" fill="none">'+[0,60,120].map(function(r){return'<path transform="rotate('+r+')" d="M0-14V14M-4-10L0-6L4-10M-4 10L0 6L4 10"/>';}).join('')+'</g>';break;
  }
  return s+'</g>';
}
function star(x,y,r,attr){var p=[];for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;p.push((x+Math.cos(a)*rr).toFixed(1)+' '+(y+Math.sin(a)*rr).toFixed(1));}return'<path d="M'+p.join('L')+'Z" '+attr+'/>';}
function heart(x,y,r,attr){return'<path transform="translate('+x+' '+y+') scale('+(r/10)+')" d="M0 9C-12 0-12-10-5-10C-2-10 0-7 0-5C0-7 2-10 5-10C12-10 12 0 0 9Z" '+attr+'/>';}

function eyeSvg(cx,cy,rx,ry,ec,style,far,stroke,id,lidColor){
  var g='<g>';
  if(style===6){ // yeux rieurs fermés
    g+='<path d="M'+(cx-rx)+' '+(cy+ry*.15)+'Q'+cx+' '+(cy-ry*.75)+' '+(cx+rx)+' '+(cy+ry*.15)+'" fill="none" stroke="'+stroke+'" stroke-width="'+(far?2.6:3.4)+'" stroke-linecap="round"/>';
    if(!far)g+='<path d="M'+(cx+rx*.8)+' '+(cy-ry*.1)+'q7-1 10-6M'+(cx+rx*.95)+' '+(cy+ry*.12)+'q8 0 11-3" stroke="'+stroke+'" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    return g+'</g>';
  }
  var lid=style===2?0.32:style===3?0.42:style===7?0.16:0;
  var clip='e'+id+(far?'f':'n');
  g+='<clipPath id="'+clip+'"><ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'"/></clipPath>';
  g+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="#fff" stroke="'+stroke+'" stroke-width="2.4"/>';
  var ix=cx-rx*0.18, iy=cy+ry*0.08, irx=rx*(style===8?0.84:0.78), iry=ry*(style===8?0.86:0.8);
  g+='<g clip-path="url(#'+clip+')"><ellipse cx="'+ix+'" cy="'+iy+'" rx="'+irx+'" ry="'+iry+'" fill="url(#ir'+id+')"/>';
  if(style===4)g+=star(ix,iy+1,irx*.62,'fill="#120a1c"')+star(ix,iy+1,irx*.28,'fill="'+light(ec,.6)+'"');
  else if(style===5)g+=heart(ix,iy+2,irx*.62,'fill="#120a1c"');
  else g+='<ellipse cx="'+ix+'" cy="'+(iy+1)+'" rx="'+(irx*(style===7?0.36:0.48))+'" ry="'+(iry*(style===7?0.45:0.55))+'" fill="#120a1c"/>';
  g+='<ellipse cx="'+(ix+irx*0.35)+'" cy="'+(iy-iry*0.42)+'" rx="'+(irx*0.3)+'" ry="'+(iry*0.24)+'" fill="#fff"/>';
  g+='<circle cx="'+(ix-irx*0.35)+'" cy="'+(iy+iry*0.42)+'" r="'+(irx*0.13)+'" fill="#fff" opacity=".9"/>';
  if(style===8)g+=star(ix-irx*.3,iy-iry*.3,irx*.22,'fill="#fff"')+'<circle cx="'+(ix+irx*.4)+'" cy="'+(iy+iry*.25)+'" r="'+(irx*.1)+'" fill="#fff"/>';
  if(lid)g+='<rect x="'+(cx-rx-2)+'" y="'+(cy-ry-2)+'" width="'+(rx*2+4)+'" height="'+(ry*2*lid+2)+'" fill="'+lidColor+'"/><path d="M'+(cx-rx-2)+' '+(cy-ry+ry*2*lid)+'H'+(cx+rx+2)+'" stroke="'+stroke+'" stroke-width="2.4"/>';
  g+='</g>';
  var top=cy-ry+ry*2*lid;
  if(!lid)g+='<path d="M'+(cx-rx*1.02)+' '+(cy-ry*0.15)+'A'+rx+' '+ry+' 0 0 1 '+(cx+rx*1.02)+' '+(cy-ry*0.15)+'" fill="none" stroke="'+stroke+'" stroke-width="3.6" stroke-linecap="round"/>';
  if(style===7)g+='<path d="M'+(cx-rx*1.1)+' '+(cy-ry*1.05)+'L'+(cx+rx*1.0)+' '+(cy-ry*0.72)+'" stroke="'+stroke+'" stroke-width="'+(far?2.4:3.6)+'" stroke-linecap="round"/>';
  if(!far&&style!==3&&style!==7){
    var L=style===1?1.35:1;
    g+='<g stroke="'+stroke+'" stroke-width="2.6" stroke-linecap="round" fill="none"><path d="M'+(cx+rx*0.82)+' '+(top+ry*0.28)+'q'+(7*L)+' -2 '+(10*L)+' -7"/><path d="M'+(cx+rx*0.95)+' '+(top+ry*0.55)+'q'+(8*L)+' 0 '+(11*L)+' -4"/>'+(style===1?'<path d="M'+(cx+rx*0.55)+' '+(top+ry*0.08)+'q'+(5*L)+' -4 '+(6*L)+' -10"/>':'')+'</g>';
  }
  if(style===3&&!far)g+='<path d="M'+(cx+rx*0.85)+' '+(top+ry*0.2)+'q7 1 10-4" stroke="'+stroke+'" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
  return g+'</g>';
}

function legPath(x1,y1,x2,G,w){
  return'M'+(x1-w/2)+' '+y1+'L'+(x2-w/2-1)+' '+(G-10)+'Q'+(x2-w/2-2)+' '+G+' '+x2+' '+G+'Q'+(x2+w/2+2)+' '+G+' '+(x2+w/2+1)+' '+(G-10)+'L'+(x1+w/2)+' '+y1+'Z';
}

var HEAD='M58 60C66 40 92 32 114 40C136 48 142 74 134 96C128 112 114 121 98 123C86 125 72 125 61 121C50 117 43 111 43 102C43 95 47 91 52 87C53 77 54 68 58 60Z';
var BODY='M100 112C96 132 90 150 94 166C98 183 121 189 150 187C176 187 201 181 202 155C203 132 184 124 162 126C147 127 137 118 133 98Z';

function pony(a,size,mood,focus){
  a=norm(a)||def();
  var body=isHex(a.bodyColor)?a.bodyColor:'#c9a6e8';
  var mc=isHex(a.maneColor)?a.maneColor:'#2f2a7a';
  var mc2=isHex(a.maneColor2)?a.maneColor2:'#ec4f97';
  var ec=isHex(a.eyeColor)?a.eyeColor:'#6a3f9c';
  var mk=isHex(a.markColor)?a.markColor:'#ec4f97';
  var ac=isHex(a.accessoryColor)?a.accessoryColor:'#ffd43b';
  var cc=isHex(a.coatColor)?a.coatColor:'#ffffff';
  var race=n(a.race,4),sil=n(a.silhouette,4),coat=n(a.coat,7),mane=n(a.mane,MANES.length),tail=n(a.tail,TAILS.length),streak=n(a.streak,5),eyes=n(a.eyes,9),mi=n(a.mark,13),hat=n(a.hat,12),gl=n(a.glasses,7),nk=n(a.neck,8),cl=n(a.clothes,7),ef=n(a.effect,9);
  var id='p'+(++uid);
  var line=dark(body), farBody=mix(body,line,.2), shade=mix(body,line,.16), hi=light(body,.55), mline=dark(mc), hornOn=race===1||race===3, wingsOn=race===2||race===3;
  var coatC=mix(body,cc,.75);
  var sw='stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
  // silhouette : [longueur des pattes, échelle du corps, échelle de la tête, épaisseur des pattes]
  var S=[[.68,.9,1.14,13],[1,1,1,14],[1.04,1.1,1.02,17],[1.34,1.02,.96,13]][sil];
  var G=228, legLen=62, up=legLen*S[0]-legLen;
  var bs=S[1], hs=S[2], LW=S[3];
  var bx=function(x){return 150+(x-150)*bs;}, byy=function(y){return 160+(y-160)*bs;};
  var bodyT='translate(150 160) scale('+bs+') translate(-150 -160)';
  var neckX=bx(118), neckY=byy(112);
  var headT='translate('+neckX+' '+neckY+') scale('+hs+') translate(-118 -112) translate(6 10)';

  var hairFill=streak===4?'url(#rb'+id+')':'url(#hr'+id+')';
  var hairStroke=streak===4?'#7a4a9c':mline;
  var hairAttr='fill="'+hairFill+'" stroke="'+hairStroke+'" '+sw;
  var hairGrad=streak===2?'<stop offset=".5" stop-color="'+mc+'"/><stop offset=".5" stop-color="'+mc2+'"/>':streak===3?'<stop offset=".45" stop-color="'+mc+'"/><stop offset="1" stop-color="'+mc2+'"/>':'<stop offset="0" stop-color="'+light(mc,.18)+'"/><stop offset="1" stop-color="'+mc+'"/>';
  var defs='<defs>'+
    '<linearGradient id="rb'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef4b4b"/><stop offset=".2" stop-color="#ff9a3c"/><stop offset=".4" stop-color="#ffe25a"/><stop offset=".6" stop-color="#5fd35f"/><stop offset=".8" stop-color="#4aa8f0"/><stop offset="1" stop-color="#8f6ae0"/></linearGradient>'+
    '<linearGradient id="hr'+id+'" x1="0" y1="0" x2="'+(streak===3?0:1)+'" y2="1">'+hairGrad+'</linearGradient>'+
    '<linearGradient id="ir'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+dark(ec,.35)+'"/><stop offset=".55" stop-color="'+ec+'"/><stop offset="1" stop-color="'+light(ec,.45)+'"/></linearGradient>'+
    '<radialGradient id="ch'+id+'"><stop offset="0" stop-color="#ff7fa8" stop-opacity=".55"/><stop offset="1" stop-color="#ff7fa8" stop-opacity="0"/></radialGradient>'+
    '<clipPath id="cb'+id+'"><path d="'+BODY+'"/></clipPath>'+
    '<clipPath id="chd'+id+'"><path d="'+HEAD+'"/></clipPath>'+
  '</defs>';
  // Dessine une forme de cheveux : remplissage, mèche, contour des boucles, reflets
  function hair(list,strands,shine,streakLine,key){
    var o=shapes(list,hairAttr);
    if(streak===1&&streakLine){
      var cid='h'+id+key;
      o+='<clipPath id="'+cid+'">'+shapes(list,'')+'</clipPath><path d="'+streakLine+'" clip-path="url(#'+cid+')" fill="none" stroke="'+mc2+'" stroke-width="9" stroke-linecap="round"/>';
    }
    o+=curls(list,hairStroke);
    o+=(strands||[]).map(function(d){return'<path d="'+d+'" fill="none" stroke="'+hairStroke+'" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>';}).join('');
    o+=(shine||[]).map(function(d){return'<path d="'+d+'" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>';}).join('');
    return o;
  }
  function band(b,col){return b?ell(b,'fill="'+col+'" stroke="'+dark(col)+'" stroke-width="2"'):'';}
  var M=MANES[mane], T=TAILS[tail];

  var s='';
  // ----- effets d'arrière-plan -----
  if(ef===2)s+='<ellipse cx="120" cy="130" rx="112" ry="104" fill="'+ac+'" opacity=".16"/><ellipse cx="120" cy="130" rx="96" ry="88" fill="none" stroke="'+ac+'" stroke-width="3" opacity=".4"/>';
  if(ef===5)s+=['#ef4b4b','#ff9a3c','#ffe25a','#5fd35f','#4aa8f0','#8f6ae0'].map(function(c,i){return'<path d="M'+(4+i*7)+' 236A'+(116-i*7)+' '+(130-i*7)+' 0 0 1 '+(236-i*7)+' 236" fill="none" stroke="'+c+'" stroke-width="7" opacity=".55"/>';}).join('');
  // ombre au sol
  s+='<ellipse cx="148" cy="'+(G+1)+'" rx="'+(72*bs)+'" ry="7" fill="#2a1838" opacity=".14"/>';

  // ----- pattes lointaines (ancrées au sol) -----
  var fF=[bx(126),bx(130)], fB=[bx(180),bx(188)];
  var legTop=function(y){return byy(y)-up;};
  s+='<path d="'+legPath(fF[0],legTop(166),fF[1],G-3,LW)+'" fill="'+farBody+'" stroke="'+line+'" '+sw+'/>';
  s+='<path d="'+legPath(fB[0],legTop(166),fB[1],G-3,LW)+'" fill="'+farBody+'" stroke="'+line+'" '+sw+'/>';
  if(coat===1)[[fF[1]],[fB[1]]].forEach(function(p){s+='<path d="'+legPath(p[0],G-26,p[0],G-3,LW+1)+'" fill="'+mix(coatC,line,.15)+'" stroke="'+line+'" '+sw+'/>';});

  // ----- partie haute (corps + tête), remontée selon la longueur des pattes -----
  s+='<g transform="translate(0 '+(-up)+')">';
  s+='<g transform="'+bodyT+'">';
  if(wingsOn)s+='<path d="M140 132C150 104 172 86 196 84C192 92 186 96 180 98C190 100 196 104 198 108C190 110 182 110 176 108C184 114 188 118 188 122C178 124 168 122 160 118C156 126 150 132 140 132Z" fill="'+farBody+'" stroke="'+line+'" '+sw+'/>';
  s+=hair(T.s,T.strands,T.shine,'M196 140C214 156 222 182 214 214','t')+band(T.band,mc2);
  s+='</g>';
  // crinière arrière
  s+='<g transform="'+headT+'">'+hair(M.back,M.strands.slice(2),M.shine.slice(1),'M126 40C146 64 150 104 164 140','b')+band(M.band2,mc2)+'</g>';
  s+='</g>';

  // pattes proches (ancrées au sol) — dessinées avant le corps, le haut est caché dessous
  var nF=[bx(104),bx(106)], nB=[bx(170),bx(172)];
  s+='<path d="'+legPath(nF[0],legTop(150),nF[1],G,LW+1)+'" fill="'+body+'" stroke="'+line+'" '+sw+'/>';
  s+='<path d="'+legPath(nB[0],legTop(170),nB[1],G,LW+1)+'" fill="'+body+'" stroke="'+line+'" '+sw+'/>';
  if(coat===1)[nF[1],nB[1]].forEach(function(x){s+='<path d="'+legPath(x,G-28,x,G,LW+2)+'" fill="'+coatC+'" stroke="'+line+'" '+sw+'/>';});

  s+='<g transform="translate(0 '+(-up)+')">';
  s+='<g transform="'+bodyT+'">';
  // corps + cuisse, avec ombrage et reflet
  s+='<path d="'+BODY+'" fill="'+body+'" stroke="'+line+'" '+sw+'/>';
  s+='<g clip-path="url(#cb'+id+')">'+
     '<path d="M84 176C120 196 184 196 214 164L214 210L84 210Z" fill="'+shade+'"/>'+
     '<ellipse cx="114" cy="124" rx="20" ry="12" fill="'+shade+'" opacity=".7"/>'+
     (coat===2?'<path d="M90 168C120 186 176 188 210 166L210 210L90 210Z" fill="'+coatC+'"/>':'')+
     (coat===4?[[130,142,7],[148,136,6],[118,160,6],[160,152,5],[176,140,6],[140,166,5]].map(function(p){return'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+p[2]+'" fill="'+mix(body,cc,.55)+'"/>';}).join(''):'')+
     '</g>';
  s+='<path d="M152 184C146 170 150 154 164 146" fill="none" stroke="'+line+'" stroke-width="2" stroke-linecap="round" opacity=".7"/>';
  s+='<path d="M132 132C152 126 178 126 192 138" fill="none" stroke="'+hi+'" stroke-width="4" stroke-linecap="round" opacity=".8"/>';
  if(mi)s+=cutieMark(mi,mk,mc2,168,164);
  // tenues
  if(cl===1)s+='<path d="M104 126C120 118 148 120 168 128C186 136 200 150 204 168C180 172 150 170 126 160C114 150 106 138 104 126Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><path d="M140 140l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1Z" fill="#fff" opacity=".85"/>';
  if(cl===2)s+='<path d="M100 130C120 124 140 126 150 130L148 172C130 176 110 174 98 166C94 154 96 140 100 130Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><g fill="'+dark(ac,.3)+'"><circle cx="112" cy="146" r="2.2"/><circle cx="112" cy="158" r="2.2"/></g>';
  if(cl===3)s+='<path d="M98 128C118 120 148 124 160 130L160 176C136 182 112 180 96 168C92 154 94 140 98 128Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><path d="M102 166C120 174 142 176 160 170" stroke="'+dark(ac,.25)+'" stroke-width="3" fill="none" stroke-dasharray="3 3"/><path d="M98 140C110 136 124 136 136 140M98 152C112 148 128 148 144 152" stroke="'+light(ac,.4)+'" stroke-width="3" fill="none"/>';
  if(cl===4)s+='<path d="M98 128C120 120 160 124 190 134C202 142 204 160 200 176C180 186 140 188 110 182C96 176 92 160 94 146Z" fill="#3a6fd8" stroke="#1f3e86" '+sw+'/><path d="M104 150C130 156 160 154 196 146L198 158C164 166 132 166 102 160Z" fill="#ffd43b" stroke="#1f3e86" stroke-width="2"/>';
  if(cl===5)s+='<path d="M98 130C118 122 150 124 170 132L172 156C150 160 120 160 98 154Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><path d="M96 152C120 160 160 160 206 150C214 166 214 186 204 198C190 192 176 200 162 194C148 202 134 194 120 200C108 194 96 198 88 190C88 176 90 162 96 152Z" fill="'+light(ac,.25)+'" stroke="'+dark(ac)+'" '+sw+'/><path d="M110 164L106 192M130 166L128 196M150 166L150 196M172 164L176 194M192 160L198 188" stroke="'+dark(ac,.15)+'" stroke-width="1.6" opacity=".6"/><g fill="#fff" opacity=".9"><circle cx="118" cy="140" r="2"/><circle cx="134" cy="138" r="2"/><circle cx="150" cy="140" r="2"/></g>';
  if(cl===6)s+='<path d="M96 126C116 116 150 120 168 130L168 168C140 176 112 174 94 164C90 150 92 138 96 126Z" fill="#ffd43b" stroke="#a87a00" '+sw+'/><path d="M100 138C120 132 146 134 166 140" stroke="#fff3a6" stroke-width="3" fill="none"/><path d="M128 144l5 10 11 1-8 7 2 11-10-6-10 6 2-11-8-7 11-1Z" fill="'+ac+'" stroke="#a87a00" stroke-width="1.6"/><path d="M96 162C118 172 146 172 168 164" stroke="#a87a00" stroke-width="2" fill="none"/>';
  if(wingsOn)s+='<path d="M126 140C136 120 160 112 186 118C180 124 174 127 166 128C178 130 186 134 188 140C180 144 170 144 160 142C168 146 174 150 174 156C162 160 148 158 138 152C132 150 128 146 126 140Z" fill="'+body+'" stroke="'+line+'" '+sw+'/><path d="M140 140C150 134 162 133 172 134M138 148C148 146 158 147 166 150M146 128C156 124 166 122 176 122" fill="none" stroke="'+line+'" stroke-width="1.6" stroke-linecap="round" opacity=".6"/><path d="M134 136C140 128 150 124 160 122" stroke="'+hi+'" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>';
  s+='</g>';

  // ----- tête -----
  s+='<g transform="'+headT+'">';
  // accessoires du cou
  if(nk===1)s+='<path d="M100 120L88 112L90 132Z M100 120L112 112L110 132Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><circle cx="100" cy="122" r="4.5" fill="'+ac+'" stroke="'+dark(ac)+'" stroke-width="2"/>';
  if(nk===2)s+='<path d="M98 112C104 134 124 144 138 126L134 114C126 128 112 128 106 108Z" fill="#ffd43b" stroke="#b8860b" '+sw+'/><path d="M112 134L118 146L124 133Z" fill="'+ac+'" stroke="'+dark(ac)+'" stroke-width="2"/>';
  if(nk===3)s+='<path d="M98 114C108 132 126 134 136 116L136 128C126 144 108 142 98 128Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><path d="M104 132L96 156L110 150L112 136Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/>';
  if(nk===4)s+='<g fill="#fff" stroke="#c9bfd8" stroke-width="1.2">'+[[100,120],[104,126],[110,130],[117,132],[124,130],[130,125],[134,118]].map(function(p){return'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3.4"/>';}).join('')+'</g>';
  if(nk===5)s+='<path d="M98 116C108 130 124 132 136 118" stroke="'+ac+'" stroke-width="5" fill="none"/><path d="M110 128C110 120 122 120 122 128L124 136H108Z" fill="#ffd43b" stroke="#b8860b" '+sw+'/><circle cx="116" cy="137" r="2.4" fill="#b8860b"/>';
  if(nk===6)s+='<path d="M100 118C110 126 124 126 134 118" stroke="#fff" stroke-width="5" fill="none"/><path d="M112 124L120 124L118 130L124 156L116 164L108 156L114 130Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/>';
  if(nk===7)s+='<path d="M96 112C106 132 126 136 140 114L142 128C128 148 106 146 94 128Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><path d="M100 128L92 166L108 168L110 136Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><path d="M98 120C110 132 126 134 138 122M96 146L106 147M94 156L106 158" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/><path d="M92 166l-2 6M98 167l-1 6M104 168l0 6" stroke="'+dark(ac)+'" stroke-width="2"/>';
  // oreille lointaine
  s+='<path d="M100 46L104 18Q114 28 114 46Z" fill="'+farBody+'" stroke="'+line+'" '+sw+'/>';
  // tête avec ombrage
  s+='<path d="'+HEAD+'" fill="'+body+'" stroke="'+line+'" '+sw+'/>';
  s+='<g clip-path="url(#chd'+id+')">'+
     '<ellipse cx="118" cy="122" rx="34" ry="12" fill="'+shade+'"/>'+
     (coat===3?'<ellipse cx="50" cy="106" rx="20" ry="17" fill="'+coatC+'"/>':'')+
     (coat===6?'<path d="M58 62C62 70 58 84 48 100L42 104L42 96C50 84 52 72 52 62Z" fill="'+coatC+'"/>':'')+
     '<ellipse cx="64" cy="70" rx="10" ry="5" fill="'+hi+'" opacity=".55" transform="rotate(-30 64 70)"/>'+
     '</g>';
  s+='<ellipse cx="94" cy="106" rx="9" ry="5" fill="url(#ch'+id+')"/>';
  if(coat===5)s+='<g fill="'+dark(body,.25)+'" opacity=".7"><circle cx="88" cy="108" r="1.6"/><circle cx="94" cy="111" r="1.6"/><circle cx="99" cy="107" r="1.6"/><circle cx="92" cy="104" r="1.4"/></g>';
  // museau
  s+='<path d="M50 99q2 1 3-1" fill="none" stroke="'+line+'" stroke-width="2" stroke-linecap="round"/>';
  s+=(mood==='grimace'?'<path d="M58 113q6-4 12 0" fill="none" stroke="'+line+'" stroke-width="2.4" stroke-linecap="round"/>':'<path d="M56 110q7 7 16 2" fill="none" stroke="'+line+'" stroke-width="2.4" stroke-linecap="round"/>');
  // yeux (l'humeur peut changer le regard classique)
  var es=(eyes<2&&mood==='sleepy')?3:(eyes<2&&mood==='smug')?2:eyes;
  s+=eyeSvg(55,80,7.5,17,ec,es,true,line,id,body);
  s+=eyeSvg(84,82,16,23,ec,es,false,line,id,body);
  // oreille proche
  s+='<path d="M110 50L122 16Q134 32 132 58Z" fill="'+body+'" stroke="'+line+'" '+sw+'/><path d="M116 46L122 26Q128 36 127 52Z" fill="'+mix(body,'#ff9fc0',.35)+'"/>';
  // corne
  if(hornOn)s+='<path d="M72 50L58 10L84 44Z" fill="'+body+'" stroke="'+line+'" '+sw+'/><path d="M64 26L74 22M67 34L78 30M70 42L81 38" stroke="'+line+'" stroke-width="1.6" stroke-linecap="round" opacity=".7"/><path d="M62 18L70 40" stroke="'+hi+'" stroke-width="2" stroke-linecap="round"/>';
  // frange
  s+=hair(M.front,M.strands.slice(0,2),M.shine.slice(0,1),'M60 64C76 44 100 36 124 40','f')+band(M.band,mc2);
  // chapeaux
  if(hat===1)s+='<g fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'><path d="M112 34L96 22L98 46Z"/><path d="M112 34L128 22L126 46Z"/><circle cx="112" cy="34" r="5"/></g>';
  if(hat===2)s+='<path d="M76 34L80 10L90 24L100 6L108 24L120 12L118 36C104 30 90 30 76 34Z" fill="#ffd43b" stroke="#b8860b" '+sw+'/><circle cx="100" cy="24" r="3.5" fill="'+ac+'"/>';
  if(hat===3)s+='<path d="M80 40C88 28 112 26 124 36L114 34L104 18L94 34Z" fill="#ffd43b" stroke="#b8860b" '+sw+'/><path d="M104 22L108 32L100 32Z" fill="'+ac+'" stroke="'+dark(ac)+'" stroke-width="1.5"/>';
  if(hat===4)s+='<path d="M48 40C70 46 120 46 146 30C150 40 140 50 122 50C96 54 64 52 48 40Z" fill="#b5732f" stroke="#6b3f17" '+sw+'/><path d="M70 42C68 24 76 8 98 8C122 8 128 24 124 42C106 46 88 46 70 42Z" fill="#c98a43" stroke="#6b3f17" '+sw+'/><path d="M72 36C90 40 108 40 124 36" stroke="'+ac+'" stroke-width="4"/>';
  if(hat===5)s+='<path d="M54 44C78 52 124 52 150 38C146 50 128 58 102 58C78 58 60 54 54 44Z" fill="#6a3f9c" stroke="#2d1847" '+sw+'/><path d="M72 46L104 -14L128 44C108 50 90 50 72 46Z" fill="#7d4fb5" stroke="#2d1847" '+sw+'/><path d="M98 20l2 5 5 .6-3.8 3.2 1.2 5-4.4-2.6-4.4 2.6 1.2-5-3.8-3.2 5-.6Z" fill="'+ac+'"/>';
  if(hat===6)s+='<g transform="translate(118 34)">'+[0,72,144,216,288].map(function(r){return'<ellipse cy="-7" rx="5" ry="8" fill="'+ac+'" stroke="'+dark(ac)+'" stroke-width="1.6" transform="rotate('+r+')"/>';}).join('')+'<circle r="4.5" fill="#ffd43b" stroke="#b8860b" stroke-width="1.5"/></g>';
  if(hat===7)s+='<path d="M64 46C62 24 80 14 102 16C124 18 132 32 130 46C110 50 84 50 64 46Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><path d="M66 44C52 44 40 48 34 54C50 56 64 52 74 48Z" fill="'+dark(ac,.2)+'" stroke="'+dark(ac)+'" '+sw+'/><circle cx="100" cy="16" r="3.5" fill="'+dark(ac,.2)+'"/>';
  if(hat===8)s+='<path d="M58 40C80 46 120 46 142 36C140 46 124 50 100 50C80 50 64 48 58 40Z" fill="#2d2a3e" stroke="#120a1c" '+sw+'/><path d="M78 42L80 -4C94 -8 112 -8 124 -4L122 42C108 46 92 46 78 42Z" fill="#3a3650" stroke="#120a1c" '+sw+'/><path d="M79 30C94 34 108 34 122 30L122 38C108 42 92 42 79 38Z" fill="'+ac+'"/><path d="M86 0L86 26" stroke="#fff" stroke-width="2.4" opacity=".25" stroke-linecap="round"/>';
  if(hat===9)s+='<path d="M84 40L106 -6L126 38C112 44 96 44 84 40Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><path d="M92 26L118 20M98 12L112 9" stroke="#fff" stroke-width="4" opacity=".8"/><circle cx="106" cy="-6" r="6" fill="'+mc2+'" stroke="'+dark(mc2)+'" stroke-width="2"/><path d="M84 40C96 46 114 46 126 38" stroke="'+dark(ac)+'" stroke-width="2" fill="none"/>';
  if(hat===10)s+='<path d="M60 52C56 26 78 10 102 12C126 14 140 30 138 50C112 44 84 44 60 52Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><path d="M60 52C84 42 114 42 138 50L138 58C112 52 84 52 60 60Z" fill="'+light(ac,.5)+'" stroke="'+dark(ac)+'" '+sw+'/><path d="M74 34C88 26 108 24 124 30M70 44C88 36 112 34 132 40" stroke="'+dark(ac,.2)+'" stroke-width="2" fill="none" opacity=".6"/>'+circ([100,10,9],'fill="#fff" stroke="'+dark(ac)+'" stroke-width="2"');
  if(hat===11)s+='<path d="M74 52C70 20 90 8 110 10C132 12 144 30 140 60" fill="none" stroke="#2d2a3e" stroke-width="6" stroke-linecap="round"/><ellipse cx="140" cy="66" rx="10" ry="14" fill="'+ac+'" stroke="#2d2a3e" stroke-width="3"/><ellipse cx="142" cy="66" rx="5" ry="8" fill="'+dark(ac,.3)+'"/><ellipse cx="72" cy="58" rx="7" ry="11" fill="'+ac+'" stroke="#2d2a3e" stroke-width="3"/>';
  // lunettes
  if(gl===1)s+='<g fill="rgba(255,255,255,.18)" stroke="'+dark(ac,.3)+'" stroke-width="3"><circle cx="84" cy="83" r="21"/><circle cx="53" cy="81" r="11"/><path d="M64 81L63 81M105 80L122 74"/></g>';
  if(gl===2)s+='<path d="M64 68C76 64 96 64 106 68C106 88 98 100 84 100C70 100 64 88 64 68Z" fill="#2d2a3e" stroke="#120a1c" '+sw+'/><path d="M44 70C50 68 58 68 62 70C62 84 58 92 52 92C46 92 44 84 44 70Z" fill="#2d2a3e" stroke="#120a1c" '+sw+'/><path d="M106 70L124 66M62 71L64 71" stroke="#120a1c" stroke-width="3"/><path d="M72 74L82 74" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>';
  if(gl===3)s+='<path d="M64 46C74 36 114 36 132 48" stroke="#5a4a3a" stroke-width="5" fill="none"/><g fill="'+light(ac,.3)+'" stroke="#5a4a3a" stroke-width="3"><ellipse cx="78" cy="44" rx="10" ry="8" fill-opacity=".8"/><ellipse cx="100" cy="40" rx="10" ry="8" fill-opacity=".8"/></g>';
  if(gl===4)s+=heart(85,84,22,'fill="#ff6fa8" fill-opacity=".75" stroke="#c8166b" stroke-width="1.3"')+heart(52,82,11,'fill="#ff6fa8" fill-opacity=".75" stroke="#c8166b" stroke-width="2.4"')+'<path d="M106 76L124 70M62 80L64 80" stroke="#c8166b" stroke-width="3"/>';
  if(gl===5)s+=star(85,84,24,'fill="#ffe25a" fill-opacity=".7" stroke="#c99a00" stroke-width="3" stroke-linejoin="round"')+star(52,82,13,'fill="#ffe25a" fill-opacity=".7" stroke="#c99a00" stroke-width="2.4" stroke-linejoin="round"')+'<path d="M108 76L124 70" stroke="#c99a00" stroke-width="3"/>';
  if(gl===6)s+='<circle cx="84" cy="83" r="20" fill="rgba(255,255,255,.2)" stroke="#c99a00" stroke-width="3.5"/><path d="M98 98C106 112 108 124 104 136" stroke="#c99a00" stroke-width="1.6" fill="none"/>';
  s+='</g>';
  s+='</g>';

  // ----- effets de premier plan -----
  if(ef===1)s+='<g fill="#fff" stroke="'+ac+'" stroke-width="1.2">'+[[30,40,1],[210,60,.8],[24,150,.7],[220,110,1.1],[160,30,.6],[60,200,.7]].map(function(p){return'<path transform="translate('+p[0]+' '+p[1]+') scale('+p[2]+')" d="M0-10Q1-1 10 0Q1 1 0 10Q-1 1-10 0Q-1-1 0-10Z"/>';}).join('')+'</g>';
  if(ef===2&&hornOn)s+='<g transform="translate(0 '+(-up)+')"><g transform="'+headT+'"><path d="M58 10L72 50L84 44Z" fill="'+ac+'" opacity=".45"/><circle cx="58" cy="10" r="9" fill="'+ac+'" opacity=".5"/></g></g>';
  if(ef===3)s+=[[30,46,1],[208,70,.8],[34,150,.7],[214,116,.9]].map(function(p){return heart(p[0],p[1],10*p[2],'fill="#ff6fa8" stroke="#c8166b" stroke-width="1.5"');}).join('');
  if(ef===4)s+=[[28,44,10],[212,66,9],[30,150,7],[216,118,10]].map(function(p){return star(p[0],p[1],p[2],'fill="#ffe25a" stroke="#c99a00" stroke-width="1.5" stroke-linejoin="round"');}).join('');
  if(ef===6)s+=[[26,60,10],[40,30,6],[214,70,12],[222,40,7],[20,140,8],[226,130,6]].map(function(p){return'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+p[2]+'" fill="'+light(ac,.6)+'" fill-opacity=".35" stroke="'+ac+'" stroke-width="1.6"/><path d="M'+(p[0]-p[2]*.5)+' '+(p[1]-p[2]*.2)+'q'+(p[2]*.2)+' '+(-p[2]*.4)+' '+(p[2]*.5)+' '+(-p[2]*.4)+'" stroke="#fff" stroke-width="1.6" fill="none"/>';}).join('');
  if(ef===7)s+=[[28,50,1],[214,64,.9],[26,140,.8]].map(function(p,i){return'<g transform="translate('+p[0]+' '+p[1]+') scale('+p[2]+') rotate('+(i%2?12:-12)+')" fill="'+ac+'" stroke="'+dark(ac)+'" stroke-width="1.4"><path d="M-2 6V-14L10-17V3" fill="none" stroke-width="3"/><ellipse cx="-6" cy="6" rx="5" ry="4"/><ellipse cx="6" cy="3" rx="5" ry="4"/></g>';}).join('');
  if(ef===8)s+='<g transform="translate(150 '+(24-up)+')"><path d="M40 -6C40 -16 52 -22 60 -16C64 -26 82 -26 86 -14C96 -16 102 -6 96 2C92 6 86 6 82 6H48C42 6 40 2 40 -6Z" fill="#fff" stroke="#9aa8c4" stroke-width="2.4"/><path d="M50 10l-3 7M64 10l-3 7M78 10l-3 7" stroke="#4aa8f0" stroke-width="2.4" stroke-linecap="round"/></g>';

  var vb;
  if(focus==='head')vb=(12+(hs-1)*20)+' '+(-34-up+(hs-1)*-40)+' '+(176*hs)+' '+(176*hs);
  else if(focus==='body')vb='72 '+(92-up)+' 150 150';
  else if(focus==='rear')vb='120 '+(108-up)+' 136 136';
  else vb='-6 '+(-16-Math.max(0,up))+' '+(252+Math.max(0,up))+' '+(268+Math.max(0,up));
  return '<span class="avatar-art mood-'+esc(mood||'happy')+'" style="--avatar-size:'+size+'px" aria-label="'+esc(a.name||'Poney')+'"><svg viewBox="'+vb+'" role="img" aria-hidden="true">'+defs+s+'</svg></span>';
}
window.PONY_CATALOG=C;window.PONY_PALETTES=PAL;window.PONY_MANE_TAIL=MANE_TAIL;window.defaultPony=def;window.normalizePony=norm;
window.renderAvatar=function(a,size,mood,focus){return pony((a&&typeof a==='object'&&a.type==='pony')?a:def(),size||64,mood||'happy',focus);};
window.avatarData=function(){return [];};
})();
