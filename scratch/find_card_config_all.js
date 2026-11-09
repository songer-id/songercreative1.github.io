const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

for (let i = 0; i < pf.length; i++) {
  if (pf[i].includes('function openEdit') || pf[i].includes('function editProduct') || pf[i].includes('card_config')) {
    if (pf[i].includes('card_config')) {
      console.log((i + 1) + ': ' + pf[i].trim().slice(0, 100));
    }
  }
}

