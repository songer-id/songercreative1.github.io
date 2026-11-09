const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

for (let i = 0; i < pf.length; i++) {
  if (pf[i].includes('DB.updateProduct') || pf[i].includes('DB.addProduct')) {
    console.log((i + 1) + ': ' + pf[i].trim().slice(0, 100));
    for (let j = Math.max(0, i - 30); j < Math.min(pf.length, i + 10); j++) {
      if (pf[j].includes('card_config') || pf[j].includes('sales_count')) {
        console.log('   ' + (j + 1) + ': ' + pf[j].trim());
      }
    }
  }
}

