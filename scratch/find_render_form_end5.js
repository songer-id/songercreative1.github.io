const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

for (let i = 28380; i < 28450; i++) {
  console.log((i + 1) + ': ' + pf[i]);
}

