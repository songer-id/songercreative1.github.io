const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('let isSampleDataActive = false;');
console.log(pf.substring(idx, idx + 600));

