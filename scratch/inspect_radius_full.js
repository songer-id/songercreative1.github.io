const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('id="cfg-border-radius"');
console.log('--- Desktop cfg-border-radius block:');
console.log(pf.slice(idx - 200, idx + 400));

