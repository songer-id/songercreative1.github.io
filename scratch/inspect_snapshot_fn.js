const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

console.log('--- Lines 3600-3665 ---');
for (let i = 3600; i <= 3665; i++) {
  console.log(i + ': ' + lines[i-1]);
}

console.log('--- Lines 3790-3850 ---');
for (let i = 3790; i <= 3850; i++) {
  console.log(i + ': ' + lines[i-1]);
}

