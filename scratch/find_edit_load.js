const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

for (let i = 1850; i < 2050; i++) {
  if (pf[i].includes('function loadProductForEdit(') || pf[i].includes('loadCardConfigInputs')) {
    console.log((i + 1) + ': ' + pf[i].trim());
  }
}

