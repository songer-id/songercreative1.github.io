const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf('btn-preview-add-cart');
console.log(pf.slice(idx - 200, idx + 1200));

