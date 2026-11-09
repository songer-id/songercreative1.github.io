const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf('<!-- Footer 1 (Atas)');
console.log(pf.slice(idx - 150, idx));

