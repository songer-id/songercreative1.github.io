const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('function syncThemeCSSVariables');
console.log(pf.slice(idx + 1500, idx + 3000));

