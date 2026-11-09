const fs = require('fs');

const bs = fs.readFileSync('js/buyer-store.js', 'utf8');
const lines = bs.split('\n');

console.log('=== buyer-store.js lines 3680-3725 ===');
console.log(lines.slice(3679, 3725).join('\n'));

