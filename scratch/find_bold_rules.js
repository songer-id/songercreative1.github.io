const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Find where card-customization-section is
console.log('card-customization-section occurrences:');
let idx = 0;
while ((idx = pf.indexOf('card-customization-section', idx)) !== -1) {
  console.log('Found at', idx, ':', pf.slice(Math.max(0, idx - 100), Math.min(pf.length, idx + 150)));
  idx += 26;
}

