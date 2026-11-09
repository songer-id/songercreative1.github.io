const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

console.log('--- Lines 3810-3830 in product-form.js ---');
for (let i = 3810; i <= 3830; i++) {
  console.log(i + ': ' + lines[i-1]);
}

console.log('--- Lines 3895-3915 in product-form.js ---');
for (let i = 3895; i <= 3915; i++) {
  console.log(i + ': ' + lines[i-1]);
}

console.log('--- Lines 8895-8915 in product-form.js ---');
for (let i = 8895; i <= 8915; i++) {
  console.log(i + ': ' + lines[i-1]);
}

