(function(){
const C={bodyColors:['Rose','Bleu','Violet','Jaune','Vert','Orange','Rouge','Blanc','Noir','Pastel','Néon','Arc-en-ciel'],bodyShapes:['Classique','Rond','Élancé','Duveteux','Sportif','Furry'],manes:['Kawaii','Longs','Courts','Bouclés','Ponytail','Punk','Rock','Gothique','Pastel','Arc-en-ciel','Fantasy','Volumineux','Avec mèches','Multicolores'],tails:['Classique','Longue','Bouclée','Ponytail','Renard','Loup','Chat','Lapin','Tigre','Léopard','Arc-en-ciel','Cristalline'],eyes:['Yeux kawaii','Grands yeux','Yeux manga','Yeux brillants','Yeux avec étoiles','Yeux avec cœurs','Yeux félins','Yeux magiques'],pupils:['Ronde','Grande','Fente','Étoile','Cœur','Croix','Spirale','Galaxie'],ears:['Poney','Chat','Loup','Renard','Lapin','Tigre','Léopard','Panda','Cerf'],horns:['Sans corne','Petite corne','Grande corne','Corne torsadée','Corne cristalline','Corne magique','Corne lumineuse'],wings:['Sans ailes','Petites ailes','Grandes ailes','Ailes de papillon','Ailes de fée','Ailes de dragon','Ailes cristallines','Ailes magiques','Ailes arc-en-ciel','Ailes lumineuses'],marks:['Aucune','Cœur','Étoile','Lune','Soleil','Arc-en-ciel','Fleur','Papillon','Nuage','Éclair','Cristal','Note de musique','Chat','Loup','Flamme','Symboles magiques','Motifs kawaii','Motifs rock','Motifs gothiques'],clothes:['Sans vêtement','Nœud pastel','Pull kawaii','Cape magique','Veste rock','Dentelle gothique','Salopette','Hoodie','Armure fantasy','Tenue arc-en-ciel'],hats:['Sans chapeau','Nœud','Bonnet','Casquette','Couronne','Chapeau de sorcière','Haut-de-forme','Capuche','Halo','Fleurs'],glasses:['Sans lunettes','Rondes','Étoile','Cœur','Lunettes rock','Visière','Monocle','Papillon'],jewelry:['Aucun','Collier','Perles','Étoile','Cristal','Cœur','Boucles','Chaîne rock'],accessories:['Aucun','Sac à dos','Guitare','Baguette magique','Étoile filante','Peluches','Ailes de paillettes','Ruban'],patterns:['Aucun','Cœurs','Étoiles','Rayures','Pois','Nuages','Éclairs','Léopard','Arc-en-ciel','Galaxie','Cristaux'],effects:['Aucun','Paillettes','Étincelles','Aura magique','Lueur néon','Cœurs flottants','Étoiles flottantes','Arc-en-ciel lumineux']};
const esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
const hex=['#f6a6c9','#8fd3ff','#b99cff','#ffe47a','#9ee6a8','#ffb36b','#f47f86','#fff8f0','#34304a','#d9c7ff','#73ffcb','#ff6b9e'];
function def(){return{type:'pony',version:1,name:'Mon poney',bodyColor:hex[0],bodyShape:0,mane:0,maneColor:'#fff8f0',tail:0,eyes:0,eyeColor:'#513caa',pupils:0,ears:0,horn:0,wings:0,mark:0,markColor:'#ffffff',clothes:0,hat:0,glasses:0,jewelry:0,accessory:0,accessoryColor:'#ffd43b',pattern:0,effect:0};}
function norm(a){if(!a||typeof a!=='object'||a.type!=='pony')return a;var d=def();Object.keys(d).forEach(function(k){if(a[k]!==undefined)d[k]=a[k];});return d;}
function n(v,m){v=Number(v)||0;return Math.max(0,Math.min(m-1,v))|0;}
function pony(a,size,mood){
a=norm(a)||def();
var body=/^#[0-9a-f]{6}$/i.test(a.bodyColor)?a.bodyColor:hex[0];
var mc=/^#[0-9a-f]{6}$/i.test(a.maneColor)?a.maneColor:'#fff8f0';
var ec=/^#[0-9a-f]{6}$/i.test(a.eyeColor)?a.eyeColor:'#513caa';
var mark=/^#[0-9a-f]{6}$/i.test(a.markColor)?a.markColor:'#fff';
var ac=/^#[0-9a-f]{6}$/i.test(a.accessoryColor)?a.accessoryColor:'#ffd43b';
var bshape=n(a.bodyShape,6),mane=n(a.mane,14),tail=n(a.tail,12),eyes=n(a.eyes,8),pup=n(a.pupils,8),ears=n(a.ears,9),horn=n(a.horn,7),wings=n(a.wings,10),mi=n(a.mark,19),cl=n(a.clothes,10),hat=n(a.hat,10),gl=n(a.glasses,8),je=n(a.jewelry,8),ef=n(a.effect,8),pa=n(a.pattern,11),acc=n(a.accessory,8);
var rainbow='url(#rainbow)', stroke='#342047';
var bodyRx=[52,58,49,55,54,57][bshape], bodyRy=[42,45,39,46,40,45][bshape];
var leg1=bshape===2?'M82 141Q78 166 80 193Q81 205 90 205Q98 205 96 195L98 151Z':'M72 141Q68 166 70 194Q71 205 80 205Q88 205 86 194L89 151Z';
var leg2='M103 151L105 194Q106 205 115 205Q123 205 121 194L122 145Z';
var leg3='M128 144L132 192Q132 203 141 203Q149 203 148 193L145 137Z';
var legs='<g fill="'+body+'" stroke="'+stroke+'" stroke-width="4.5" stroke-linejoin="round">'+
'<path d="'+leg1+'"/><path d="'+leg2+'"/><path d="'+leg3+'"/><path d="M54 137L49 190Q48 202 57 203Q65 204 66 192L70 143Z"/></g>'+
'<g fill="#f7d7df" stroke="'+stroke+'" stroke-width="2"><path d="M70 194Q78 200 86 194L86 201Q78 210 70 202Z"/><path d="M105 194Q113 200 121 194L121 201Q113 210 105 202Z"/><path d="M132 192Q140 198 148 192L148 199Q140 208 132 201Z"/><path d="M49 190Q57 197 66 191L65 199Q56 207 49 199Z"/></g>';
var body='<ellipse cx="101" cy="126" rx="'+bodyRx+'" ry="'+bodyRy+'" fill="'+body+'" stroke="'+stroke+'" stroke-width="5"/>';
var neck='<path d="M70 126Q67 91 74 71Q83 51 105 50Q126 52 137 73Q142 91 132 126Z" fill="'+body+'" stroke="'+stroke+'" stroke-width="5"/>';
var muzzle='<path d="M60 87Q63 66 86 57Q108 48 130 59Q150 69 151 91Q148 112 126 119Q94 127 70 112Q57 103 60 87Z" fill="'+body+'" stroke="'+stroke+'" stroke-width="5"/>';
var nose='<path d="M79 96Q87 91 94 96M111 96Q118 91 126 96" fill="none" stroke="'+stroke+'" stroke-width="3.5" stroke-linecap="round"/>';
var earsSvg=(ears===0?
'<path d="M76 62Q54 31 67 18Q81 23 91 55Z" fill="'+body+'" stroke="'+stroke+'" stroke-width="4"/><path d="M124 55Q135 23 149 18Q162 31 140 62Z" fill="'+body+'" stroke="'+stroke+'" stroke-width="4"/>':
'<path d="M76 62Q50 25 67 17Q84 25 91 56Z" fill="'+hex[(ears+2)%hex.length]+'" stroke="'+stroke+'" stroke-width="4"/><path d="M124 56Q137 25 153 18Q169 28 140 63Z" fill="'+hex[(ears+2)%hex.length]+'" stroke="'+stroke+'" stroke-width="4"/>');
var wing=wings?'<g fill="'+(wings===8?rainbow:wings===5?'#8c6a52':'#f8fbff')+'" stroke="'+stroke+'" stroke-width="4"><path d="M67 112Q26 90 31 56Q58 61 80 88Q57 54 63 39Q89 54 94 88Q85 66 96 54Q111 73 101 111Z"/><path d="M137 112Q178 90 173 56Q146 61 124 88Q147 54 141 39Q115 54 110 88Q119 66 108 54Q93 73 103 111Z"/></g>':'';
var tailPaths=[
'M145 143Q188 151 194 178Q190 201 164 194Q181 184 173 172Q162 162 140 162Z',
'M145 145Q193 146 202 174Q202 202 171 199Q190 185 179 171Q164 160 139 164Z',
'M145 147Q187 154 190 181Q183 205 158 193Q176 181 167 172Q155 163 140 165Z',
'M145 144Q190 132 201 158Q205 186 174 193Q190 176 177 166Q161 158 140 165Z'
];
var tailSvg='<path d="'+tailPaths[tail%4]+'" fill="'+(tail===10?rainbow:mc)+'" stroke="'+stroke+'" stroke-width="5"/>';
var manePaths=[
'M66 72Q39 54 54 29Q72 9 98 32Q111 9 137 28Q153 44 136 70Q119 54 101 69Q83 53 66 72Z',
'M64 76Q31 49 54 20Q78 1 104 28Q127 4 151 29Q165 52 136 80Q113 58 99 77Q80 57 64 76Z',
'M68 70Q46 43 65 24Q86 11 103 35Q119 14 143 29Q157 47 136 67Q118 54 102 70Q85 53 68 70Z',
'M61 72Q39 39 65 24Q86 13 101 34Q118 10 145 27Q160 46 137 73Q118 56 101 75Q82 53 61 72Z',
'M62 73Q29 58 47 32Q68 8 96 34Q125 7 151 35Q164 58 135 78Q116 57 99 79Q80 58 62 73Z'
];
var maneSvg='<path d="'+manePaths[mane%5]+'" fill="'+(mane===9?rainbow:mc)+'" stroke="'+stroke+'" stroke-width="3.5"/>';
var eyeScale=eyes===1?1.28:eyes===2?1.08:1;
var eyeRy=eyes===1?18:eyes===7?15:14;
var eyeL=72,eyeR=116;
var pupilChar=['●','●','┃','★','♥','✚','◎','✦'][pup];
var eyeSvg='<g stroke="'+stroke+'" stroke-width="3"><ellipse cx="'+eyeL+'" cy="88" rx="'+(12*eyeScale)+'" ry="'+eyeRy+'" fill="#fff"/><ellipse cx="'+eyeR+'" cy="88" rx="'+(12*eyeScale)+'" ry="'+eyeRy+'" fill="#fff"/></g>'+
'<g fill="'+ec+'"><ellipse cx="'+eyeL+'" cy="89" rx="7" ry="9"/><ellipse cx="'+eyeR+'" cy="89" rx="7" ry="9"/></g>'+
'<g fill="#fff" text-anchor="middle" font-size="'+(pup===7?'12':'8')+'" font-weight="900"><text x="'+eyeL+'" y="93">'+pupilChar+'</text><text x="'+eyeR+'" y="93">'+pupilChar+'</text></g>'+
'<g fill="'+stroke+'" opacity=".75"><path d="M60 75Q72 68 83 74M106 74Q118 68 130 75" fill="none" stroke-width="4" stroke-linecap="round"/></g>';
var hornSvg=horn?'<path d="M94 57L101 '+(horn===2?9:horn===6?16:25)+'L108 57Z" fill="'+(horn===4?'#dff8ff':horn===5?'#b889ff':horn===6?rainbow:ac)+'" stroke="'+stroke+'" stroke-width="3"/>':'';
var marks=[
'<path d="M169 143Q154 128 145 141Q137 153 154 158Q168 166 178 151Q184 143 169 143Z" fill="'+mark+'"/>',
'<path d="M162 130l5 12 13 2-10 8 3 14-11-8-12 8 4-14-11-8 13-2Z" fill="'+mark+'"/>',
'<path d="M161 130Q178 140 161 158Q144 140 161 130Z" fill="'+mark+'"/>',
'<circle cx="160" cy="145" r="14" fill="'+mark+'"/><path d="M160 131v28M146 145h28" stroke="'+body+'" stroke-width="3"/>'
];
var markSvg=mi?marks[(mi-1)%4]:'';
var clothes=cl?'<path d="M56 148Q101 132 146 148L140 177Q102 188 62 177Z" fill="'+(cl===4||cl===5?'#3b294b':ac)+'" stroke="'+stroke+'" stroke-width="4"/>':'';
var glasses=gl?'<g fill="none" stroke="'+ac+'" stroke-width="4"><circle cx="72" cy="88" r="15"/><circle cx="116" cy="88" r="15"/><path d="M87 88h14"/></g>':'';
var jewelry=je?'<path d="M72 116Q101 135 130 116" fill="none" stroke="'+ac+'" stroke-width="5"/><circle cx="101" cy="132" r="7" fill="'+ac+'" stroke="'+stroke+'" stroke-width="3"/>':'';
var hat=hat?'<path d="'+(hat===4?'M62 61Q101 20 140 61Z':'M64 61L87 22L137 57Q103 70 64 61Z')+'" fill="'+ac+'" stroke="'+stroke+'" stroke-width="4"/>':'';
var pattern=pa?'<g opacity=".55" fill="'+(pa===8?rainbow:mark)+'"><circle cx="65" cy="127" r="4"/><circle cx="83" cy="137" r="3"/><circle cx="116" cy="133" r="4"/><circle cx="133" cy="143" r="3"/></g>':'';
var effect=ef?'<g fill="'+(ef===4?'#73ffcb':'#fff')+'" opacity=".9"><text x="29" y="42" font-size="15">✦</text><text x="186" y="74" font-size="12">✧</text><text x="38" y="118" font-size="10">✦</text></g>':'';
var accSvg=acc?'<g fill="'+ac+'" stroke="'+stroke+'" stroke-width="3"><circle cx="48" cy="154" r="11"/><path d="M40 157Q59 137 70 158"/></g>':'';
return '<span class="avatar-art mood-'+esc(mood||'happy')+'" style="--avatar-size:'+size+'px" aria-label="'+esc(a.name||'Poney')+'"><svg viewBox="0 0 220 220" role="img" aria-hidden="true"><defs><linearGradient id="rainbow" x1="0" x2="1"><stop stop-color="#ff6b9e"/><stop offset=".2" stop-color="#ffb84d"/><stop offset=".4" stop-color="#ffe45c"/><stop offset=".6" stop-color="#65e68a"/><stop offset=".8" stop-color="#62c7ff"/><stop offset="1" stop-color="#b889ff"/></linearGradient></defs>'+effect+wing+tailSvg+legs+body+neck+muzzle+earsSvg+maneSvg+hornSvg+eyeSvg+nose+glasses+pattern+markSvg+clothes+jewelry+hat+accSvg+'</svg></span>';
}
window.PONY_CATALOG=C;window.defaultPony=def;window.normalizePony=norm;
window.renderAvatar=function(a,size,mood){return pony((a&&typeof a==='object'&&a.type==='pony')?a:def(),size||64,mood||'happy');};
window.avatarData=function(){return [];};
})();