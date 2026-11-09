const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');
lines.forEach((l, i) => {
  if (l.includes('effHasDiscount') && i > 9100 && i < 9500) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
