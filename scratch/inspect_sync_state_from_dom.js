const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

console.log('=== syncStateFromDOM around line 30630 ===');
console.log(lines.slice(30625, 30675).join('\n'));
