const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split(/\r?\n/);
lines.forEach((l, idx) => {
  if (l.includes('input-custom-label-1')) {
    console.log((idx+1) + ': ' + l);
  }
});

