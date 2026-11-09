const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('select id="select-card-footer-icon"');
console.log(pf.substring(idx - 1000, idx));
