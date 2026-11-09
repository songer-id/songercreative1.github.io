const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('function formatSalesCount(');
const sub = pf.substring(idx, idx + 500);
console.log(sub);

