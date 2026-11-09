const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

console.log('--- Model A lines 9440-9485 ---');
for (let i = 9440; i < 9485; i++) {
  console.log((i + 1) + ': ' + pf[i]);
}

