const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const loadIdx = pf.indexOf('function loadProductForEdit(');
console.log('=== loadProductForEdit continued 2 ===');
console.log(pf.substring(loadIdx + 4400, loadIdx + 6000));

