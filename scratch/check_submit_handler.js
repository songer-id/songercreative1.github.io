const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
console.log(pf.slice(404000, 412000));

