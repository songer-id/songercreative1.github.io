const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

for (let i = 27340; i < 27360; i++) {
  console.log((i + 1) + ': ' + pf[i]);
}

