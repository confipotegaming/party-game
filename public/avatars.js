(function(){
  const cache = {};
  const esc = s => String(s||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const fallback = [
    {id:'fox-chef',name:'Renard chef',animal:'renard',skin:'#c98b62',hair:'#9b4f32',accent:'#f58b62',hairStyle:'curly',accessory:'chef'},
    {id:'cat-hoodie',name:'Chat hoodie',animal:'chat',skin:'#6b432f',hair:'#25213a',accent:'#70b7ff',accessory:'headphones'},
    {id:'bunny-glasses',name:'Lapin lunettes',animal:'lapin',skin:'#f0c7ae',hair:'#efe7f5',accent:'#b99cff',accessory:'glasses'},
    {id:'fox-freckles',name:'Renard roux',animal:'renard',skin:'#f0b58b',hair:'#d95c32',accent:'#68c38b',accessory:'cap'},
    {id:'ram-dark',name:'Bélier solaire',animal:'belier',skin:'#4a2f2b',hair:'#2b1e25',accent:'#f5b942',accessory:'drink'},
    {id:'dragon-blue',name:'Dragon bleu',animal:'dragon',skin:'#b7d8ea',hair:'#5aa9dc',accent:'#a77df0',accessory:'scarf'},
    {id:'bunny-wheel',name:'Lapin fauteuil',animal:'lapin',skin:'#7b4c3a',hair:'#d76c9b',accent:'#63c9b6',accessory:'wheelchair'},
    {id:'poodle-prosthetic',name:'Caniche prothèse',animal:'caniche',skin:'#e4b99a',hair:'#f2d2b7',accent:'#8f7be8',accessory:'prosthetic'},
    {id:'cat-vitiligo',name:'Chat vitiligo',animal:'chat',skin:'#8c5b4a',hair:'#241c27',accent:'#ff8bb5',accessory:'vitiligo'},
    {id:'wolf-cane',name:'Loup canne',animal:'loup',skin:'#b47d61',hair:'#68758b',accent:'#73b8f4',accessory:'cane'},
    {id:'deer-hearing',name:'Biche appareil auditif',animal:'cerf',skin:'#5d392d',hair:'#3a2420',accent:'#ef9b56',accessory:'hearing'},
    {id:'tiger-neutral',name:'Tigre street',animal:'tigre',skin:'#d69a6f',hair:'#3b211c',accent:'#ffb14e',accessory:'sunglasses'},
    {id:'frog-curls',name:'Grenouille boucles',animal:'grenouille',skin:'#a96d52',hair:'#2b6d54',accent:'#9adf69',accessory:'backpack'},
    {id:'panda-dress',name:'Panda pastel',animal:'panda',skin:'#f0c5ae',hair:'#29232c',accent:'#e99bc2',accessory:'heartbag'},
    {id:'otter-camera',name:'Loutre photo',animal:'loutre',skin:'#9a6049',hair:'#5c382f',accent:'#66c8e8',accessory:'camera'},
    {id:'bunny-red',name:'Lapin roux',animal:'lapin',skin:'#f1c2a4',hair:'#b74f2e',accent:'#f58e68',accessory:'flower'},
    {id:'bear-cap',name:'Ours cool',animal:'ours',skin:'#5a3828',hair:'#21181b',accent:'#8bc9ff',accessory:'cap'},
    {id:'koala-book',name:'Koala lecteur',animal:'koala',skin:'#c18768',hair:'#68727c',accent:'#a78de8',accessory:'book'},
    {id:'penguin-overall',name:'Pingouin jardinier',animal:'pingouin',skin:'#8c624f',hair:'#20283b',accent:'#6ecbb0',accessory:'plant'},
    {id:'unicorn-magic',name:'Licorne magique',animal:'licorne',skin:'#f1c7dc',hair:'#8d7bea',accent:'#66d6e8',accessory:'wand'}
  ];
  const data = window.AVATARS && window.AVATARS.length ? window.AVATARS : fallback;
  function animalParts(a){
    const c=a.accent||'#ff91b5';
    if(a.animal==='belier') return `<path d="M27 31 Q10 12 28 7 Q39 5 42 21" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/><path d="M73 31 Q90 12 72 7 Q61 5 58 21" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>`;
    if(a.animal==='dragon') return `<path d="M27 30 L22 6 L42 19 Z M73 30 L78 6 L58 19 Z" fill="${c}" stroke="#1d1a3b" stroke-width="3"/><path d="M50 14 l5 -9 4 10" fill="${c}" stroke="#1d1a3b" stroke-width="3"/>`;
    if(a.animal==='cerf') return `<path d="M31 28 L24 8 M69 28 L76 8 M24 12 l-7 -5 M24 15 l-8 2 M76 12 l7 -5 M76 15 l8 2" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
    return `<path d="M29 29 L23 7 Q22 3 28 6 L43 19 Z M71 29 L77 7 Q78 3 72 6 L57 19 Z" fill="${c}" stroke="#1d1a3b" stroke-width="3"/>`;
  }
  function accessory(a,skin){
    const c=a.accent||'#ff91b5';
    switch(a.accessory){
      case 'chef': return `<path d="M29 18 Q30 3 40 8 Q50 -2 60 8 Q70 3 71 18 Z" fill="#fff" stroke="#1d1a3b" stroke-width="3"/><path d="M42 17h16" stroke="#ff6f91" stroke-width="3"/>`;
      case 'glasses': return `<rect x="32" y="39" width="16" height="12" rx="5" fill="none" stroke="#1d1a3b" stroke-width="3"/><rect x="52" y="39" width="16" height="12" rx="5" fill="none" stroke="#1d1a3b" stroke-width="3"/><path d="M48 44h4" stroke="#1d1a3b" stroke-width="3"/>`;
      case 'sunglasses': return `<path d="M32 39h17l-2 11H36z M51 39h17l-2 11H53z" fill="#27233b" stroke="#1d1a3b" stroke-width="3"/><path d="M49 43h2" stroke="#fff" stroke-width="2"/>`;
      case 'headphones': return `<path d="M29 44 Q29 20 50 20 Q71 20 71 44" fill="none" stroke="#7a63e8" stroke-width="6"/><rect x="25" y="40" width="9" height="16" rx="4" fill="#7a63e8"/><rect x="66" y="40" width="9" height="16" rx="4" fill="#7a63e8"/>`;
      case 'cap': return `<path d="M26 24 Q50 5 74 24 L69 29 H31 Z" fill="${c}" stroke="#1d1a3b" stroke-width="3"/><path d="M45 27 Q61 25 77 30" fill="none" stroke="#1d1a3b" stroke-width="4"/>`;
      case 'scarf': return `<path d="M28 65 Q50 72 72 65 L68 79 Q50 86 32 79 Z" fill="${c}" stroke="#1d1a3b" stroke-width="3"/><path d="M67 77 l8 19 -8 -3 -6 8" fill="${c}" stroke="#1d1a3b" stroke-width="3"/>`;
      case 'drink': return `<path d="M67 65 h14 l-3 25 H70z" fill="#f4b942" stroke="#1d1a3b" stroke-width="3"/><path d="M72 64l4 -10" stroke="#1d1a3b" stroke-width="3"/>`;
      case 'wheelchair': return `<circle cx="50" cy="98" r="16" fill="#fff" stroke="#1d1a3b" stroke-width="4"/><circle cx="50" cy="98" r="6" fill="${c}"/><path d="M50 75v17l-13 6" fill="none" stroke="#1d1a3b" stroke-width="4"/><path d="M50 76h17" stroke="#1d1a3b" stroke-width="4"/>`;
      case 'prosthetic': return `<path d="M61 88 v14 q0 5 5 5 h8" fill="none" stroke="#6c5ce7" stroke-width="7" stroke-linecap="round"/><circle cx="74" cy="106" r="3" fill="#f5b942"/>`;
      case 'vitiligo': return `<path d="M34 31 q8 -6 14 0 q-6 7 -13 5z M57 55 q8 -4 10 3 q-6 7 -12 4z M28 70 q7 -4 11 2 q-3 8 -10 5z" fill="#f7dfc7" opacity=".95"/>`;
      case 'cane': return `<path d="M74 72 v29 q0 5 -6 5" fill="none" stroke="#1d1a3b" stroke-width="4"/><path d="M69 106 q7 0 10 4" fill="none" stroke="#1d1a3b" stroke-width="4"/>`;
      case 'hearing': return `<circle cx="73" cy="43" r="5" fill="${c}" stroke="#1d1a3b" stroke-width="2"/><path d="M73 48q-5 6 0 10" fill="none" stroke="${c}" stroke-width="3"/>`;
      case 'backpack': return `<path d="M25 64 Q13 67 18 90 Q22 95 31 91" fill="${c}" stroke="#1d1a3b" stroke-width="3"/>`;
      case 'heartbag': return `<path d="M72 69 q10 -6 13 4 v20 H68V73" fill="${c}" stroke="#1d1a3b" stroke-width="3"/><path d="M73 77 q4 -5 8 0 q-4 8 -8 10 q-4 -2 -8 -10 q4 -5 8 0" fill="#fff"/>`;
      case 'camera': return `<rect x="66" y="63" width="18" height="13" rx="3" fill="${c}" stroke="#1d1a3b" stroke-width="3"/><circle cx="75" cy="69" r="4" fill="#fff"/>`;
      case 'flower': return `<circle cx="77" cy="20" r="5" fill="#ff8bb5"/><circle cx="84" cy="20" r="5" fill="#ffcf5a"/><circle cx="80" cy="26" r="5" fill="#ff8bb5"/>`;
      case 'book': return `<rect x="67" y="67" width="17" height="22" rx="2" fill="#fff" stroke="#1d1a3b" stroke-width="3"/><path d="M75 69v18" stroke="${c}" stroke-width="2"/>`;
      case 'plant': return `<path d="M74 83 q-8 -13 1 -19 q6 10 0 19 M74 83 q7 -11 13 -8 q-3 9 -13 8" fill="${c}" stroke="#1d1a3b" stroke-width="2"/><path d="M68 83h13v10H68z" fill="#f08b66" stroke="#1d1a3b" stroke-width="2"/>`;
      case 'wand': return `<path d="M69 88 L84 72" stroke="#1d1a3b" stroke-width="4"/><path d="M84 67l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffd34e"/>`;
      default: return '';
    }
  }
  function avatar(id,size=64,mood='happy'){
    const a=data.find(x=>x.id===id)||data[0]; const k=`${a.id}-${size}-${mood}`; if(cache[k]) return cache[k];
    const skin=a.skin||'#f3c7a6', hair=a.hair||'#4a2e22', c=a.accent||'#ff91b5';
    const eyes=mood==='sleepy'?`<path d="M38 44q5 4 10 0M52 44q5 4 10 0" fill="none" stroke="#1d1a3b" stroke-width="3" stroke-linecap="round"/>`:`<ellipse cx="43" cy="43" rx="6" ry="8" fill="#fff"/><ellipse cx="57" cy="43" rx="6" ry="8" fill="#fff"/><circle cx="44" cy="44" r="3" fill="#1d1a3b"/><circle cx="58" cy="44" r="3" fill="#1d1a3b"/><circle cx="42" cy="41" r="1.5" fill="#fff"/><circle cx="56" cy="41" r="1.5" fill="#fff"/>`;
    const mouth=mood==='grimace'?`<path d="M42 55 l4 4 4-4 4 4 4-4" fill="none" stroke="#1d1a3b" stroke-width="2.5"/>`:mood==='smug'?`<path d="M47 55q8 4 13-1" fill="none" stroke="#1d1a3b" stroke-width="3" stroke-linecap="round"/>`:`<path d="M44 54q6 7 12 0" fill="none" stroke="#1d1a3b" stroke-width="2.5" stroke-linecap="round"/>`;
    const tail=`<path d="M78 79 Q100 71 88 54" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/>`;
    const body=`<ellipse cx="50" cy="78" rx="23" ry="17" fill="${c}" stroke="#1d1a3b" stroke-width="3"/><circle cx="29" cy="81" r="7" fill="${skin}" stroke="#1d1a3b" stroke-width="3"/><circle cx="71" cy="81" r="7" fill="${skin}" stroke="#1d1a3b" stroke-width="3"/><path d="M41 91v10M59 91v10" stroke="#1d1a3b" stroke-width="6" stroke-linecap="round"/>`;
    const wheelchair=a.accessory==='wheelchair' ? `<circle cx="50" cy="98" r="17" fill="#fff" stroke="#1d1a3b" stroke-width="4"/><path d="M50 75v18l-13 6" fill="none" stroke="#1d1a3b" stroke-width="4"/>` : '';
    const svg=`<svg class="avatar-svg" width="${size}" height="${Math.round(size*1.1)}" viewBox="0 0 100 110" role="img" aria-label="${esc(a.name)}">${tail}${body}${animalParts(a)}<circle cx="50" cy="40" r="28" fill="${skin}" stroke="#1d1a3b" stroke-width="3"/><path d="M25 37Q25 11 50 12Q75 11 75 37Q67 23 50 25Q33 23 25 37" fill="${hair}" stroke="#1d1a3b" stroke-width="3"/>${eyes}${mouth}${accessory(a,skin)}${wheelchair}</svg>`;
    cache[k]=svg; return svg;
  }
  window.renderAvatar=avatar;
  window.avatarData=()=>data;
})();
