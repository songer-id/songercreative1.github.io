const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

console.log('--- Lines 3900-3950 ---');
for (let i = 3900; i <= 3950; i++) {
  console.log(i + ': ' + lines[i-1]);
}

