const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log(pf.substring(833000, 836000));
