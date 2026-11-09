const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

for (let i = 0; i < pf.length; i++) {
  if (pf[i].includes('function syncStateFromDOM(')) {
    console.log('syncStateFromDOM at line ' + (i + 1));
    for (let j = i; j < Math.min(pf.length, i + 60); j++) {
      if (pf[j].includes('show_sales') || pf[j].includes('card_config') || pf[j].includes('saveCardConfig')) {
        console.log((j + 1) + ': ' + pf[j].trim());
      }
    }
  }
}

