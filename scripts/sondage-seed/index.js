// Questions de démonstration supplémentaires, un fichier par catégorie.
const fs = require('fs');
module.exports = fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.js') && !f.startsWith('_') && f !== 'index.js')
  .sort()
  .flatMap(f => require('./' + f));
