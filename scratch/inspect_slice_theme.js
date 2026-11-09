const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log(pf.slice(419300, 421500));

