const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
console.log(pf.slice(242000, 243200));

