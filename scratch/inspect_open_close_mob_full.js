const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log(pf.slice(1269500, 1272500));

