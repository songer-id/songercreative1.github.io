const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const loadIdx = pf.indexOf('function loadProductForEdit(');
console.log('=== loadProductForEdit definition ===');
console.log(pf.substring(loadIdx, loadIdx + 2000));

