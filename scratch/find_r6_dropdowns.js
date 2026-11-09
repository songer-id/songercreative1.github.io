const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('DISCOUNT_LABEL_POSITIONS');
console.log('DISCOUNT_LABEL_POSITIONS idx:', idx);
if (idx !== -1) {
  console.log(pf.slice(idx - 50, idx + 800));
}

