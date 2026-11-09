const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf('Bilah Footer Model C');
console.log('idx:', idx);
if (idx !== -1) {
  console.log(pf.slice(idx - 50, idx + 1200));
}

