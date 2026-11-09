const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split(/\r?\n/);
for (let i = 18650; i < 18765; i++) {
  if (lines[i].includes('renderVariationCard')) {
    console.log((i+1) + ': ' + lines[i]);
  }
}

