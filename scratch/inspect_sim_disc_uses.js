const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');
console.log('--- Lines around 6880 ---');
console.log(lines.slice(6870, 6900).join('\n'));
console.log('--- Lines around 7899 ---');
console.log(lines.slice(7890, 7920).join('\n'));
