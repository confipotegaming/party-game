(function(){
// Poney façon My Little Pony : Friendship is Magic (profil 3/4, grands yeux, contours teintés).
const C={
  races:['Poney terrestre','Licorne','Pégase','Alicorne'],
  manes:['Lisse à frange','Ébouriffée','Bouclée','Brushing élégant','Queue de cheval','Courte sportive'],
  tails:['Lisse','Ébouriffée','Bouclée','Brushing élégant','Attachée','Courte'],
  streaks:['Unie','Une mèche','Bicolore','Arc-en-ciel'],
  eyes:['Classique','Grands cils','Malicieux','Rêveur'],
  marks:['Aucune','Étoile magique','Trois pommes','Ballons','Trois diamants','Papillons','Éclair arc-en-ciel','Soleil','Lune','Cœurs','Note de musique','Fleur','Flocon'],
  hats:['Aucun','Nœud','Couronne','Tiare de princesse','Chapeau de cowboy','Chapeau de sorcière','Fleur','Casquette'],
  glasses:['Aucunes','Rondes','Lunettes de soleil','Lunettes d\'aviateur'],
  necks:['Aucun','Nœud papillon','Collier royal','Foulard','Collier de perles','Cloche'],
  clothes:['Aucun','Cape magique','Gilet','Pull douillet','Tenue de vol'],
  effects:['Aucun','Paillettes','Aura magique','Cœurs','Étoiles']
};
const PAL={
  body:['#f9b8d8','#c9a6e8','#9ed8f5','#fff3a6','#b8e8a0','#ffcf8f','#f6f4f8','#e9d7c3','#a8a3b8','#ffa3b5','#8fe3d4','#e7c3f6','#5d5a73','#d4b07a'],
  mane:['#ec4f97','#2f2a7a','#7cc4f2','#ffe25a','#ff8a3d','#e8e3f0','#6a3f9c','#f46b6b','#3d3d4f','#9be36b','#c8166b','#ffb3d9','#5fbf9f','#b5732f'],
  eye:['#6a3f9c','#d14d8c','#3d7bd9','#2fa36b','#c97a1f','#7a3326','#18a7b5','#555064'],
  accent:['#ffd43b','#ff6fa8','#8f6ae0','#5fbcf2','#ef4b4b','#4cc38a','#ffffff','#2d2a3e']
};
const esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
const isHex=function(v){return typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);};
function rgb(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
function mix(h,t,k){var a=rgb(h),b=rgb(t);return'#'+a.map(function(v,i){return Math.round(v+(b[i]-v)*k).toString(16).padStart(2,'0');}).join('');}
function dark(h,k){return mix(h,'#2a1838',k==null?.42:k);}
function light(h,k){return mix(h,'#ffffff',k==null?.45:k);}
function def(){return{type:'pony',version:2,name:'Mon poney',race:1,bodyColor:'#c9a6e8',mane:0,maneColor:'#2f2a7a',maneColor2:'#ec4f97',streak:1,tail:0,eyes:0,eyeColor:'#6a3f9c',mark:1,markColor:'#ec4f97',hat:0,glasses:0,neck:0,clothes:0,accessoryColor:'#ffd43b',effect:0};}
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

// ---------- Formes ----------
var HEAD='M58 60C66 40 92 32 114 40C136 48 142 74 134 96C128 112 114 121 98 123C86 125 72 125 61 121C50 117 43 111 43 102C43 95 47 91 52 87C53 77 54 68 58 60Z';
var BODY='M100 112C96 132 90 150 94 166C98 183 121 189 150 187C176 187 201 181 202 155C203 132 184 124 162 126C147 127 137 118 133 98Z';
var LEG_NEAR_F='M96 150L98 214Q97 225 106 225Q116 225 115 214L118 160Z';
var LEG_FAR_F='M117 168L120 210Q120 220 128 220Q137 220 136 210L135 170Z';
var LEG_NEAR_B='M158 150C178 146 192 158 186 180L180 214Q180 225 171 225Q162 225 162 214L162 190C152 182 148 160 158 150Z';
var LEG_FAR_B='M183 165L190 208Q191 218 183 219Q175 220 175 210L170 175Z';

var MANES=[ // [arrière (derrière la tête), avant (frange)]
 ['M112 36C142 36 156 60 152 92C150 116 156 134 170 146C146 150 130 136 126 112C122 94 124 70 112 36Z',
  'M56 66C56 40 84 26 110 30C130 33 142 48 142 66C134 54 122 50 110 50C98 50 92 56 88 64C84 58 76 56 68 60C62 62 58 66 56 66Z'],
 ['M110 34C146 30 162 60 154 82C166 92 162 112 150 118C164 128 160 146 146 148C134 146 128 132 126 114C122 92 124 66 110 34Z',
  'M54 70C48 52 58 34 76 30C84 22 104 20 116 30C128 28 142 40 140 60C132 50 122 50 116 56C112 48 100 46 92 56C86 50 74 52 70 62C64 60 58 64 54 70Z'],
 ['M112 36C140 34 156 54 150 76C162 84 160 100 150 104C160 112 156 128 146 130C154 140 148 154 136 152C126 148 124 132 126 118C122 96 124 70 112 36Z',
  'M54 72C46 60 52 46 62 44C62 32 76 26 86 32C94 22 110 24 114 34C126 30 138 40 136 52C142 58 140 68 132 70C130 60 120 58 114 62C110 54 98 54 94 62C88 56 78 58 76 66C70 62 60 64 54 72Z'],
 ['M114 36C150 40 160 70 150 96C144 112 150 128 162 136C144 140 130 128 128 110C126 92 128 66 114 36Z',
  'M52 74C44 54 56 34 80 30C100 26 120 30 132 40C142 48 144 60 140 70C128 56 112 52 96 54C82 56 74 62 70 72C66 66 58 68 52 74Z'],
 ['M114 38C134 34 148 44 148 60C162 56 176 66 172 84C170 104 158 120 150 134C152 116 154 100 146 86C140 76 132 72 126 74C124 60 120 48 114 38Z',
  'M56 66C56 42 82 28 108 30C128 32 142 44 142 60C130 52 116 50 102 54C90 58 82 62 76 70C72 64 62 64 56 66Z'],
 ['M112 36C134 36 146 50 146 70C152 76 150 88 142 92C138 82 132 76 126 76C124 62 120 48 112 36Z',
  'M60 60C64 40 86 28 108 30C128 32 142 44 142 60C136 52 126 46 114 46C108 40 96 40 90 48C82 44 70 48 66 56C64 56 62 58 60 60Z']
];
var TAILS=[
 'M196 138C218 140 230 162 226 188C222 206 214 218 200 228C206 210 208 192 202 176C198 164 192 156 188 150Z',
 'M196 138C220 134 234 154 226 172C236 182 232 202 220 206C224 218 210 230 198 226C206 212 204 196 198 184C194 168 190 158 188 150Z',
 'M196 138C218 136 230 152 224 168C234 176 232 192 220 194C228 204 220 218 208 216C210 228 194 232 188 222C200 214 200 200 196 190C194 172 192 160 188 150Z',
 'M196 138C222 142 232 168 224 194C218 212 204 222 188 226C200 212 206 196 202 180C198 166 192 156 188 150Z',
 'M194 140C214 128 232 138 230 160C228 180 222 200 214 218C212 200 210 182 204 168C200 160 194 154 188 150Z',
 'M196 138C214 140 224 154 220 172C216 184 208 192 198 196C202 184 202 172 198 162C196 156 192 152 188 150Z'
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

function eyeSvg(cx,cy,rx,ry,ec,style,far,stroke,id){
  var lid=style===2?0.32:style===3?0.42:0;
  var g='<g>';
  var clip='e'+id+(far?'f':'n');
  g+='<clipPath id="'+clip+'"><ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'"/></clipPath>';
  g+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="#fff" stroke="'+stroke+'" stroke-width="2.4"/>';
  var ix=cx-rx*0.18, iy=cy+ry*0.08, irx=rx*0.78, iry=ry*0.8;
  g+='<g clip-path="url(#'+clip+')"><ellipse cx="'+ix+'" cy="'+iy+'" rx="'+irx+'" ry="'+iry+'" fill="url(#ir'+id+')"/>';
  g+='<ellipse cx="'+ix+'" cy="'+(iy+1)+'" rx="'+(irx*0.48)+'" ry="'+(iry*0.55)+'" fill="#120a1c"/>';
  g+='<ellipse cx="'+(ix+irx*0.35)+'" cy="'+(iy-iry*0.42)+'" rx="'+(irx*0.3)+'" ry="'+(iry*0.24)+'" fill="#fff"/>';
  g+='<circle cx="'+(ix-irx*0.35)+'" cy="'+(iy+iry*0.42)+'" r="'+(irx*0.13)+'" fill="#fff" opacity=".9"/>';
  if(lid)g+='<rect x="'+(cx-rx-2)+'" y="'+(cy-ry-2)+'" width="'+(rx*2+4)+'" height="'+(ry*2*lid+2)+'" fill="url(#bd'+id+')"/><path d="M'+(cx-rx-2)+' '+(cy-ry+ry*2*lid)+'H'+(cx+rx+2)+'" stroke="'+stroke+'" stroke-width="2.4"/>';
  g+='</g>';
  // paupière supérieure épaisse
  var top=cy-ry+ry*2*lid;
  if(!lid)g+='<path d="M'+(cx-rx*1.02)+' '+(cy-ry*0.15)+'A'+rx+' '+ry+' 0 0 1 '+(cx+rx*1.02)+' '+(cy-ry*0.15)+'" fill="none" stroke="'+stroke+'" stroke-width="3.6" stroke-linecap="round"/>';
  // cils
  if(!far&&style!==3){
    var L=style===1?1.35:1;
    g+='<g stroke="'+stroke+'" stroke-width="2.6" stroke-linecap="round" fill="none"><path d="M'+(cx+rx*0.82)+' '+(top+ry*0.28)+'q'+(7*L)+' -2 '+(10*L)+' -7"/><path d="M'+(cx+rx*0.95)+' '+(top+ry*0.55)+'q'+(8*L)+' 0 '+(11*L)+' -4"/>'+(style===1?'<path d="M'+(cx+rx*0.55)+' '+(top+ry*0.08)+'q'+(5*L)+' -4 '+(6*L)+' -10"/>':'')+'</g>';
  }
  if(style===3&&!far)g+='<path d="M'+(cx+rx*0.85)+' '+(top+ry*0.2)+'q7 1 10-4" stroke="'+stroke+'" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
  return g+'</g>';
}

function pony(a,size,mood){
  a=norm(a)||def();
  var body=isHex(a.bodyColor)?a.bodyColor:'#c9a6e8';
  var mc=isHex(a.maneColor)?a.maneColor:'#2f2a7a';
  var mc2=isHex(a.maneColor2)?a.maneColor2:'#ec4f97';
  var ec=isHex(a.eyeColor)?a.eyeColor:'#6a3f9c';
  var mk=isHex(a.markColor)?a.markColor:'#ec4f97';
  var ac=isHex(a.accessoryColor)?a.accessoryColor:'#ffd43b';
  var race=n(a.race,4),mane=n(a.mane,6),tail=n(a.tail,6),streak=n(a.streak,4),eyes=n(a.eyes,4),mi=n(a.mark,13),hat=n(a.hat,8),gl=n(a.glasses,4),nk=n(a.neck,6),cl=n(a.clothes,5),ef=n(a.effect,5);
  var id='p'+(++uid);
  var line=dark(body), farBody=mix(body,line,.18), mline=dark(mc), hornOn=race===1||race===3, wingsOn=race===2||race===3;
  var sw='stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
  var hairFill=streak===3?'url(#rb'+id+')':'url(#hr'+id+')';
  var defs='<defs>'+
    '<linearGradient id="rb'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef4b4b"/><stop offset=".2" stop-color="#ff9a3c"/><stop offset=".4" stop-color="#ffe25a"/><stop offset=".6" stop-color="#5fd35f"/><stop offset=".8" stop-color="#4aa8f0"/><stop offset="1" stop-color="#8f6ae0"/></linearGradient>'+
    '<linearGradient id="hr'+id+'" x1="0" y1="0" x2="1" y2="1">'+(streak===2?'<stop offset=".5" stop-color="'+mc+'"/><stop offset=".5" stop-color="'+mc2+'"/>':'<stop offset="0" stop-color="'+light(mc,.12)+'"/><stop offset="1" stop-color="'+mc+'"/>')+'</linearGradient>'+
    '<linearGradient id="ir'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+dark(ec,.35)+'"/><stop offset=".55" stop-color="'+ec+'"/><stop offset="1" stop-color="'+light(ec,.45)+'"/></linearGradient>'+
    '<linearGradient id="bd'+id+'"><stop stop-color="'+body+'"/></linearGradient>'+
    '<radialGradient id="ch'+id+'"><stop offset="0" stop-color="#ff7fa8" stop-opacity=".55"/><stop offset="1" stop-color="#ff7fa8" stop-opacity="0"/></radialGradient>'+
  '</defs>';
  var hairStroke=streak===3?'#7a4a9c':mline;
  var hairAttr='fill="'+hairFill+'" stroke="'+hairStroke+'" '+sw;
  var streakPath=function(d){return streak===1?'<path d="'+d+'" fill="none" stroke="'+mc2+'" stroke-width="5" stroke-linecap="round" opacity=".95"/>':'';};

  var s='';
  // effets derrière
  if(ef===2)s+='<ellipse cx="120" cy="130" rx="108" ry="100" fill="'+ac+'" opacity=".18"/><ellipse cx="120" cy="130" rx="92" ry="84" fill="none" stroke="'+ac+'" stroke-width="3" opacity=".45"/>';
  // aile lointaine
  if(wingsOn)s+='<path d="M140 132C150 104 172 86 196 84C192 92 186 96 180 98C190 100 196 104 198 108C190 110 182 110 176 108C184 114 188 118 188 122C178 124 168 122 160 118C156 126 150 132 140 132Z" fill="'+farBody+'" stroke="'+line+'" '+sw+'/>';
  // queue
  s+='<g transform="translate(190 148) scale(1.15) translate(-190 -148)"><path d="'+TAILS[tail]+'" '+hairAttr+'/>';
  if(streak===1)s+=streakPath(['M198 146C214 154 220 176 212 206','M198 146C220 156 222 180 214 204','M198 146C216 152 222 170 214 190','M198 146C216 160 218 184 206 210','M200 146C218 140 224 158 220 190','M198 146C210 152 214 168 206 186'][tail]);
  s+='</g>';
  // pattes lointaines
  s+='<path d="'+LEG_FAR_F+'" fill="'+farBody+'" stroke="'+line+'" '+sw+'/><path d="'+LEG_FAR_B+'" fill="'+farBody+'" stroke="'+line+'" '+sw+'/>';
  // crinière arrière
  s+='<g transform="translate(6 10) translate(112 36) scale(1.18 1.22) translate(-112 -36)"><path d="'+MANES[mane][0]+'" '+hairAttr+'/></g>';
  // corps + pattes proches
  s+='<path d="'+BODY+'" fill="'+body+'" stroke="'+line+'" '+sw+'/>';
  s+='<path d="'+LEG_NEAR_F+'" fill="'+body+'"/><path d="M97 160L98 214Q97 225 106 225Q116 225 115 214L117 172" fill="none" stroke="'+line+'" '+sw+'/>';
  s+='<path d="'+LEG_NEAR_B+'" fill="'+body+'"/><path d="M186 176L180 214Q180 225 171 225Q162 225 162 214L162 190C156 186 152 176 152 166" fill="none" stroke="'+line+'" '+sw+'/>';
  // marque de beauté
  if(mi)s+=cutieMark(mi,mk,isHex(a.maneColor2)?mc2:ac,170,164);
  // vêtements
  if(cl===1)s+='<path d="M104 126C120 118 148 120 168 128C186 136 200 150 204 168C180 172 150 170 126 160C114 150 106 138 104 126Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><path d="M140 140l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1Z" fill="#fff" opacity=".85"/>';
  if(cl===2)s+='<path d="M100 130C120 124 140 126 150 130L148 172C130 176 110 174 98 166C94 154 96 140 100 130Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><g fill="'+dark(ac,.3)+'"><circle cx="112" cy="146" r="2.2"/><circle cx="112" cy="158" r="2.2"/></g>';
  if(cl===3)s+='<path d="M98 128C118 120 148 124 160 130L160 176C136 182 112 180 96 168C92 154 94 140 98 128Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><path d="M102 166C120 174 142 176 160 170" stroke="'+dark(ac,.25)+'" stroke-width="3" fill="none" stroke-dasharray="3 3"/><path d="M98 172L97 184L116 186L116 174Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/>';
  if(cl===4)s+='<path d="M98 128C120 120 160 124 190 134C202 142 204 160 200 176C180 186 140 188 110 182C96 176 92 160 94 146Z" fill="#3a6fd8" stroke="#1f3e86" '+sw+'/><path d="M104 150C130 156 160 154 196 146L198 158C164 166 132 166 102 160Z" fill="#ffd43b" stroke="#1f3e86" stroke-width="2"/><path d="M98 168L97 184L116 186L116 172Z M162 180L162 196L182 194L184 178Z" fill="#3a6fd8" stroke="#1f3e86" '+sw+'/>';
  // aile proche (repliée)
  if(wingsOn)s+='<path d="M128 140C138 122 160 116 182 122C176 128 170 130 164 130C174 132 180 136 182 140C174 144 166 144 158 142C166 146 170 150 170 154C160 158 148 156 140 152C134 150 130 146 128 140Z" fill="'+body+'" stroke="'+line+'" '+sw+'/><path d="M142 140C150 136 160 136 168 138M140 147C148 146 156 147 162 150" fill="none" stroke="'+line+'" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>';
  s+='<g transform="translate(6 10)">';
  // cou (accessoire)
  if(nk===1)s+='<path d="M100 120L88 112L90 132Z M100 120L112 112L110 132Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><circle cx="100" cy="122" r="4.5" fill="'+ac+'" stroke="'+dark(ac)+'" stroke-width="2"/>';
  if(nk===2)s+='<path d="M98 112C104 134 124 144 138 126L134 114C126 128 112 128 106 108Z" fill="#ffd43b" stroke="#b8860b" '+sw+'/><path d="M112 134L118 146L124 133Z" fill="'+ac+'" stroke="'+dark(ac)+'" stroke-width="2"/>';
  if(nk===3)s+='<path d="M98 114C108 132 126 134 136 116L136 128C126 144 108 142 98 128Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><path d="M104 132L96 156L110 150L112 136Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/>';
  if(nk===4)s+='<g fill="#fff" stroke="#c9bfd8" stroke-width="1.2">'+[[100,120],[104,126],[110,130],[117,132],[124,130],[130,125],[134,118]].map(function(p){return'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3.4"/>';}).join('')+'</g>';
  if(nk===5)s+='<path d="M98 116C108 130 124 132 136 118" stroke="'+ac+'" stroke-width="5" fill="none"/><path d="M110 128C110 120 122 120 122 128L124 136H108Z" fill="#ffd43b" stroke="#b8860b" '+sw+'/><circle cx="116" cy="137" r="2.4" fill="#b8860b"/>';
  // œil lointain (dépasse du profil, typique G4)
  // oreille lointaine
  s+='<path d="M100 46L104 18Q114 28 114 46Z" fill="'+farBody+'" stroke="'+line+'" '+sw+'/>';
  // tête
  s+='<path d="'+HEAD+'" fill="'+body+'" stroke="'+line+'" '+sw+'/>';
  s+='<ellipse cx="94" cy="106" rx="9" ry="5" fill="url(#ch'+id+')"/>';
  // museau : narine + sourire
  s+='<path d="M50 99q2 1 3-1" fill="none" stroke="'+line+'" stroke-width="2" stroke-linecap="round"/>';
  s+=(mood==='grimace'?'<path d="M58 113q6-4 12 0" fill="none" stroke="'+line+'" stroke-width="2.4" stroke-linecap="round"/>':'<path d="M56 110q7 7 16 2" fill="none" stroke="'+line+'" stroke-width="2.4" stroke-linecap="round"/>');
  // œil proche
  s+=eyeSvg(55,80,7.5,17,ec,mood==='sleepy'?3:mood==='smug'?2:eyes,true,line,id);
  s+=eyeSvg(84,82,16,23,ec,mood==='sleepy'?3:mood==='smug'?2:eyes,false,line,id);
  // oreille proche
  s+='<path d="M110 50L122 16Q134 32 132 58Z" fill="'+body+'" stroke="'+line+'" '+sw+'/><path d="M116 46L122 26Q128 36 127 52Z" fill="'+mix(body,'#ff9fc0',.35)+'"/>';
  // corne
  if(hornOn)s+='<path d="M72 50L58 10L84 44Z" fill="'+body+'" stroke="'+line+'" '+sw+'/><path d="M64 26L74 22M67 34L78 30M70 42L81 38" stroke="'+line+'" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>';
  // frange
  s+='<path d="'+MANES[mane][1]+'" '+hairAttr+'/>';
  if(streak===1)s+=streakPath(['M72 52C84 38 104 34 122 38','M70 54C80 38 100 32 120 36','M68 56C78 42 96 36 116 40','M66 58C76 40 100 34 124 40','M70 54C84 40 104 36 124 40','M72 50C84 38 102 36 120 40'][mane]);
  // chapeaux
  if(hat===1)s+='<g fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'><path d="M112 34L96 22L98 46Z"/><path d="M112 34L128 22L126 46Z"/><circle cx="112" cy="34" r="5"/></g>';
  if(hat===2)s+='<path d="M76 34L80 10L90 24L100 6L108 24L120 12L118 36C104 30 90 30 76 34Z" fill="#ffd43b" stroke="#b8860b" '+sw+'/><circle cx="100" cy="24" r="3.5" fill="'+ac+'"/>';
  if(hat===3)s+='<path d="M80 40C88 28 112 26 124 36L114 34L104 18L94 34Z" fill="#ffd43b" stroke="#b8860b" '+sw+'/><path d="M104 22L108 32L100 32Z" fill="'+ac+'" stroke="'+dark(ac)+'" stroke-width="1.5"/>';
  if(hat===4)s+='<path d="M48 40C70 46 120 46 146 30C150 40 140 50 122 50C96 54 64 52 48 40Z" fill="#b5732f" stroke="#6b3f17" '+sw+'/><path d="M70 42C68 24 76 8 98 8C122 8 128 24 124 42C106 46 88 46 70 42Z" fill="#c98a43" stroke="#6b3f17" '+sw+'/><path d="M72 36C90 40 108 40 124 36" stroke="'+ac+'" stroke-width="4"/>';
  if(hat===5)s+='<path d="M54 44C78 52 124 52 150 38C146 50 128 58 102 58C78 58 60 54 54 44Z" fill="#6a3f9c" stroke="#2d1847" '+sw+'/><path d="M72 46L104 -14L128 44C108 50 90 50 72 46Z" fill="#7d4fb5" stroke="#2d1847" '+sw+'/><path d="M98 20l2 5 5 .6-3.8 3.2 1.2 5-4.4-2.6-4.4 2.6 1.2-5-3.8-3.2 5-.6Z" fill="'+ac+'"/>';
  if(hat===6)s+='<g transform="translate(118 34)">'+[0,72,144,216,288].map(function(r){return'<ellipse cy="-7" rx="5" ry="8" fill="'+ac+'" stroke="'+dark(ac)+'" stroke-width="1.6" transform="rotate('+r+')"/>';}).join('')+'<circle r="4.5" fill="#ffd43b" stroke="#b8860b" stroke-width="1.5"/></g>';
  if(hat===7)s+='<path d="M64 46C62 24 80 14 102 16C124 18 132 32 130 46C110 50 84 50 64 46Z" fill="'+ac+'" stroke="'+dark(ac)+'" '+sw+'/><path d="M66 44C52 44 40 48 34 54C50 56 64 52 74 48Z" fill="'+dark(ac,.2)+'" stroke="'+dark(ac)+'" '+sw+'/><circle cx="100" cy="16" r="3.5" fill="'+dark(ac,.2)+'"/>';
  // lunettes
  if(gl===1)s+='<g fill="rgba(255,255,255,.18)" stroke="'+dark(ac,.3)+'" stroke-width="3"><circle cx="84" cy="83" r="21"/><circle cx="53" cy="81" r="11"/><path d="M64 81L63 81M105 80L122 74"/></g>';
  if(gl===2)s+='<path d="M64 68C76 64 96 64 106 68C106 88 98 100 84 100C70 100 64 88 64 68Z" fill="#2d2a3e" stroke="#120a1c" '+sw+'/><path d="M44 70C50 68 58 68 62 70C62 84 58 92 52 92C46 92 44 84 44 70Z" fill="#2d2a3e" stroke="#120a1c" '+sw+'/><path d="M106 70L124 66M62 71L64 71" stroke="#120a1c" stroke-width="3"/><path d="M72 74L82 74" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>';
  if(gl===3)s+='<path d="M64 46C74 36 114 36 132 48" stroke="#5a4a3a" stroke-width="5" fill="none"/><g fill="'+light(ac,.3)+'" stroke="#5a4a3a" stroke-width="3"><ellipse cx="78" cy="44" rx="10" ry="8" fill-opacity=".8"/><ellipse cx="100" cy="40" rx="10" ry="8" fill-opacity=".8"/></g>';
  s+='</g>';
  // effets devant
  if(ef===1)s+='<g fill="#fff" stroke="'+ac+'" stroke-width="1.2">'+[[30,40,1],[210,60,.8],[24,150,.7],[220,110,1.1],[160,40,.6]].map(function(p){return'<path transform="translate('+p[0]+' '+p[1]+') scale('+p[2]+')" d="M0-10Q1-1 10 0Q1 1 0 10Q-1 1-10 0Q-1-1 0-10Z"/>';}).join('')+'</g>';
  if(ef===2&&hornOn)s+='<path d="M58 10L72 50L84 44Z" fill="'+ac+'" opacity=".45"/><circle cx="58" cy="10" r="8" fill="'+ac+'" opacity=".5"/>';
  if(ef===3)s+=[[30,46,1],[208,70,.8],[34,150,.7],[214,116,.9]].map(function(p){return'<path transform="translate('+p[0]+' '+p[1]+') scale('+p[2]+')" d="M0 9C-12 0-12-10-5-10C-2-10 0-7 0-5C0-7 2-10 5-10C12-10 12 0 0 9Z" fill="#ff6fa8" stroke="#c8166b" stroke-width="1.5"/>';}).join('');
  if(ef===4)s+=[[28,44,1],[212,66,.9],[30,150,.7],[216,118,1]].map(function(p){return'<path transform="translate('+p[0]+' '+p[1]+') scale('+p[2]+')" d="M0-10L3-3L10-3L4 2L6 10L0 5L-6 10L-4 2L-10-3L-3-3Z" fill="#ffe25a" stroke="#c99a00" stroke-width="1.5"/>';}).join('');

  return '<span class="avatar-art mood-'+esc(mood||'happy')+'" style="--avatar-size:'+size+'px" aria-label="'+esc(a.name||'Poney')+'"><svg viewBox="-6 -16 252 268" role="img" aria-hidden="true">'+defs+s+'</svg></span>';
}
window.PONY_CATALOG=C;window.PONY_PALETTES=PAL;window.defaultPony=def;window.normalizePony=norm;
window.renderAvatar=function(a,size,mood){return pony((a&&typeof a==='object'&&a.type==='pony')?a:def(),size||64,mood||'happy');};
window.avatarData=function(){return [];};
})();
