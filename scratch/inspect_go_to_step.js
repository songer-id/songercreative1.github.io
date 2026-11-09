const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('function goToStep');
console.log(pf.slice(idx, idx + 2500));

