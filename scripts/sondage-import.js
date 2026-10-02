#!/usr/bin/env node
// Importe des questions dans la base du Grand Sondage.
//   node scripts/sondage-import.js fichier.json|fichier.csv [--replace]
//   node scripts/sondage-import.js https://exemple.org/questions.json [--replace]
//   node scripts/sondage-import.js --demo          (questions de démonstration)
// La base utilisée est data/sondage.json (ou le chemin de la variable SONDAGE_DB).
const fs = require('fs');
const { store } = require('../games/sondage/store');
const importer = require('../games/sondage/importer');

const SYNONYMS = [
  ['téléphone', 'portable', 'smartphone', 'mobile', 'tel', 'iphone'],
  ['télévision', 'télé', 'tv'],
  ['ordinateur', 'ordi', 'pc'],
  ['voiture', 'auto', 'bagnole'],
  ['toilettes', 'wc', 'cabinets'],
  ['football', 'foot'],
];

async function main() {
  const args = process.argv.slice(2), mode = args.includes('--replace') ? 'replace' : 'skip';
  const src = args.find(a => !a.startsWith('--'));
  let list;
  if (args.includes('--demo')) {
    list = require('./sondage-demo');
    const db = store.load();
    if (!db.synonyms || !db.synonyms.length) db.synonyms = SYNONYMS;
  } else if (!src) {
    console.log('Usage : node scripts/sondage-import.js <fichier.json|fichier.csv|URL> [--replace]  ou  --demo');
    process.exit(1);
  } else if (/^https?:\/\//.test(src)) list = await importer.fetchUrl(src);
  else list = importer.parse(fs.readFileSync(src, 'utf8'), src.toLowerCase().endsWith('.csv') ? 'csv' : src.toLowerCase().endsWith('.json') ? 'json' : '');
  const report = store.importMany(list, { mode });
  store.save();
  console.log(`Base : ${store.file}`);
  console.log(`${report.created} créée(s), ${report.updated} mise(s) à jour, ${report.skipped} ignorée(s) (déjà présentes).`);
  for (const e of report.errors) console.log(`  ✗ #${e.index + 1} « ${e.question || '?'} » : ${e.error}`);
}

main().catch(err => { console.error('Import impossible :', err.message); process.exit(1); });
