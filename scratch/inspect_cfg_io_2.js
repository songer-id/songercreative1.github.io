const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

console.log('--- Lines 26470-26530 ---');
for (let i = 26470; i <= 26530; i++) {
  console.log(i + ': ' + lines[i-1]);
}

