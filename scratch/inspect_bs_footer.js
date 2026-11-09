const fs = require('fs');

const bs = fs.readFileSync('js/buyer-store.js', 'utf8');
const lines = bs.split('\n');

console.log('=== buyer-store.js lines 3620-3640 ===');
console.log(lines.slice(3619, 3640).join('\n'));

console.log('=== buyer-store.js lines 3720-3765 ===');
console.log(lines.slice(3719, 3765).join('\n'));

