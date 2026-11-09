const fs = require('fs');
const db = fs.readFileSync('js/db.js', 'utf8').split('\n');

for (let i = 0; i < db.length; i++) {
  if (db[i].includes('card_variants_config')) {
    console.log((i + 1) + ': ' + db[i].trim());
  }
}

