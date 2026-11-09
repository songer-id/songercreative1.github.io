const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log('=== Event Binding around 1416000 ===');
console.log(pf.substring(1416000, 1422000));

