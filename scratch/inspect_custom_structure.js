const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

console.log('--- Lines 2650-2750 ---');
for (let i = 2650; i <= 2750; i++) {
  console.log(i + ': ' + lines[i - 1]);
}

