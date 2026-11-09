const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Search for any .style.backgroundColor assignments in product-form.js
let idx = 0;
while ((idx = pf.indexOf('.style.backgroundColor', idx)) !== -1) {
  console.log(pf.slice(Math.max(0, idx - 60), Math.min(pf.length, idx + 120)));
  console.log('---');
  idx += '.style.backgroundColor'.length;
}

