const fs = require('fs');

const db = fs.readFileSync('js/db.js', 'utf8');
const lines = db.split('\n');

console.log('=== js/db.js lines 570-585 ===');
console.log(lines.slice(569, 585).join('\n'));
