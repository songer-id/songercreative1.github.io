const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

for (let i = 0; i < pf.length; i++) {
  if (pf[i].includes('card_config:') || pf[i].includes('use_default_card_design:')) {
    console.log((i + 1) + ': ' + pf[i].trim().slice(0, 100));
  }
}

