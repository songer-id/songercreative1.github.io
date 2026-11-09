const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

console.log('--- Action buttons box in desktop (lines 2975-3015) ---');
for (let i = 2975; i <= 3015; i++) {
  console.log(i + ': ' + lines[i-1]);
}

