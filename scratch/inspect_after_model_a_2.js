const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const pos = pf.indexOf('T (Variasi A)');
console.log(pf.substring(pos + 2500, pos + 4500));

