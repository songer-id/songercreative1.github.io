const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf('btn-preview-buy-now');
const idx2 = pf.indexOf('btn-preview-buy-now', idx + 1);
console.log('Match 1 at ' + idx);
console.log(pf.slice(idx - 300, idx + 400));
console.log('\n=========================\nMatch 2 at ' + idx2);
console.log(pf.slice(idx2 - 300, idx2 + 600));

