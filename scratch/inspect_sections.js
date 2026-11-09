const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

console.log('--- Desktop Preview Sidebar & Card Customization Section ---');
for (let i = 2620; i <= 2665; i++) {
  console.log(i + ': ' + lines[i-1]);
}

console.log('--- Mobile Preview Sheet & Card Customization Section ---');
for (let i = 3025; i <= 3065; i++) {
  console.log(i + ': ' + lines[i-1]);
}

