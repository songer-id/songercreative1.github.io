const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf('DRAWER ROOT SCOPED INSIDE MINI PDP CARD');
console.log(pf.slice(idx, idx + 4000));

