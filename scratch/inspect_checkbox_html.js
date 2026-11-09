const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

console.log('--- Desktop cfg-show-sales HTML ---');
for (let i = 2755; i < 2775; i++) {
  console.log((i + 1) + ': ' + pf[i]);
}

console.log('--- Mobile cfg-show-sales-mob HTML ---');
for (let i = 3260; i < 3280; i++) {
  console.log((i + 1) + ': ' + pf[i]);
}

