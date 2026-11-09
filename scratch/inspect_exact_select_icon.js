const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('select id="select-card-footer-icon"');
console.log('Exact index:', idx);
if (idx !== -1) {
  console.log(pf.substring(idx - 200, idx + 800));
}
