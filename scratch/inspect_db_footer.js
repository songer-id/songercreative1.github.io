const fs = require('fs');

const db = fs.readFileSync('js/db.js', 'utf8');
const lines = db.split('\n');

console.log('=== js/db.js lines 2735-2775 ===');
console.log(lines.slice(2734, 2775).join('\n'));

console.log('=== js/db.js lines 2955-2995 ===');
console.log(lines.slice(2954, 2995).join('\n'));

