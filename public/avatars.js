(function(){
  const data = [{'id': 'chef-renarde', 'name': 'Chef Renarde', 'animal': 'Animal', 'accessory': 'animal'}, {'id': 'skateur-renard', 'name': 'Renard skateur', 'animal': 'Animal', 'accessory': 'animal'}, {'id': 'lapin-lunettes', 'name': 'Lapin lunettes', 'animal': 'Animal', 'accessory': 'animal'}, {'id': 'renard-jardinier', 'name': 'Renard jardinier', 'animal': 'Animal', 'accessory': 'animal'}, {'id': 'ours-cafe', 'name': 'Ours café', 'animal': 'Animal', 'accessory': 'animal'}, {'id': 'dragon-casque', 'name': 'Dragon casqué', 'animal': 'Animal', 'accessory': 'animal'}, {'id': 'chat-fauteuil', 'name': 'Chat en fauteuil', 'animal': 'Animal', 'accessory': 'inclusif'}, {'id': 'roux-lunettes', 'name': 'Humain·e roux·se', 'animal': 'Humain', 'accessory': 'inclusif'}, {'id': 'chien-hoodie', 'name': 'Chien hoodie', 'animal': 'Animal', 'accessory': 'animal'}, {'id': 'tigre-casquette', 'name': 'Tigre casquette', 'animal': 'Animal', 'accessory': 'animal'}, {'id': 'licorne-pastel', 'name': 'Licorne pastel', 'animal': 'Animal', 'accessory': 'animal'}, {'id': 'pirate-perroquet', 'name': 'Pirate perroquet', 'animal': 'Humain', 'accessory': 'animal'}, {'id': 'dancer-bat', 'name': 'Chibi chauve-souris', 'animal': 'Animal', 'accessory': 'animal'}, {'id': 'koala-livre', 'name': 'Koala lecteur·rice', 'animal': 'Animal', 'accessory': 'animal'}, {'id': 'lapin-gouter', 'name': 'Lapin goûter', 'animal': 'Animal', 'accessory': 'animal'}];
  const esc = s => String(s||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  function avatar(id,size=64,mood='happy') {
    const a=data.find(x=>x.id===id)||data[0];
    const src='/assets/avatars/'+a.id+'.png';
    return `<span class="avatar-art mood-${esc(mood)}" style="--avatar-size:${size}px" aria-label="${esc(a.name)}"><img src="${src}" alt="${esc(a.name)}" draggable="false"></span>`;
  }
  window.renderAvatar=avatar;
  window.avatarData=()=>data;
})();
