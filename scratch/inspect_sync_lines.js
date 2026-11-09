const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

console.log('=== Lines 4830-4860 ===');
console.log(lines.slice(4830, 4860).join('\n'));

console.log('=== Lines 5005-5065 ===');
console.log(lines.slice(5005, 5065).join('\n'));

console.log('=== Lines 28410-28500 ===');
console.log(lines.slice(28410, 28500).join('\n'));
