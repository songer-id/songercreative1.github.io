const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

console.log('--- Lines 2750-2820 (Label Khusus) ---');
for (let i = 2750; i <= 2820; i++) {
  console.log(i + ': ' + lines[i-1]);
}

