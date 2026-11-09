const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

console.log(lines.slice(4975, 5065).join('\n'));
