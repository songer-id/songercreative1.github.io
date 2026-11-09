const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

for (let i = 27300; i >= 26500; i--) {
  if (pf[i].includes('function ') && !pf[i].includes('() =>')) {
    console.log('Enclosing function at line ' + (i + 1) + ': ' + pf[i]);
    break;
  }
}

