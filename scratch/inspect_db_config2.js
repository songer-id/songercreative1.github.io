const fs = require('fs');
const db = fs.readFileSync('js/db.js', 'utf8');

const idx = db.indexOf('DEFAULT_CARD_VARIANTS_CONFIG');
console.log(db.slice(idx, idx + 2500));

