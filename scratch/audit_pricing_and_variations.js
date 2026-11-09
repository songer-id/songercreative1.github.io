const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const pc = fs.readFileSync('js/pricing-calculator.js', 'utf8');

console.log('=== PRICING CALCULATOR TYPES ===');
const pcLines = pc.split('\n');
pcLines.forEach((l, idx) => {
  if (l.match(/price_type|calculate|case\s+[1-7]|function\s+\w+/)) {
    console.log(`pricing-calculator.js L${idx+1}: ${l.trim()}`);
  }
});

