const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

console.log('--- Lines 3860-3905 ---');
for (let i = 3860; i <= 3905; i++) {
  console.log(i + ': ' + lines[i-1]);
}

