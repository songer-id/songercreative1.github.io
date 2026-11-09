const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const saveIdx = pf.indexOf('function saveProduct(');
console.log('=== saveProduct definition ===');
console.log(pf.substring(saveIdx, saveIdx + 2500));

