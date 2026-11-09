const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf('function goToStep(step)');
console.log(pf.slice(idx - 400, idx + 1800));

