const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log('=== Event Binding around 1422000-1428000 ===');
console.log(pf.substring(1422000, 1428000));

