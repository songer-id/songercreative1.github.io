const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const loadIdx = pf.indexOf('function loadProductForEdit(');
console.log('=== loadProductForEdit continued ===');
console.log(pf.substring(loadIdx + 1800, loadIdx + 4500));

