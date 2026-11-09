const fs = require('fs');
const dbCode = fs.readFileSync('js/db.js', 'utf8');

const idx = dbCode.indexOf('saveCardModelPreset');
console.log(dbCode.substring(idx - 100, idx + 800));

