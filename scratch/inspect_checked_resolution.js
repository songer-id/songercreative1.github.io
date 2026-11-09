const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

for (let i = 9245; i < 9290; i++) {
  console.log((i + 1) + ': ' + pf[i]);
}

