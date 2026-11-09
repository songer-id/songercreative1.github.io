const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('id="mobile-preview-backdrop"');
console.log(pf.slice(idx - 600, idx + 400));

