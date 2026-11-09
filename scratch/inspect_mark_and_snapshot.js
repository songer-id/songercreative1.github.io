const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

console.log('--- Lines 3660-3700 ---');
for (let i = 3660; i <= 3700; i++) {
  console.log(i + ': ' + lines[i-1]);
}

console.log('--- Lines 3950-4020 ---');
for (let i = 3950; i <= 4020; i++) {
  console.log(i + ': ' + lines[i-1]);
}

