const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

console.log('--- Lines 3160-3200 (Mobile Label Khusus) ---');
for (let i = 3160; i <= 3200; i++) {
  console.log(i + ': ' + lines[i-1]);
}

