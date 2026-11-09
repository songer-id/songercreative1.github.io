const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const fnIdx = pf.indexOf('function applyCardVariant');
console.log(pf.slice(fnIdx, fnIdx + 1200));

