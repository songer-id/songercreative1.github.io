const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('data-field="cost_price"')) {
    console.log((idx + 1) + ': ' + l.trim());
  }
});

