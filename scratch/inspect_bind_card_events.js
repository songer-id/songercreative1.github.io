const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const fnIdx = pf.indexOf('function bindCardCustomizationEvents()');
console.log('=== bindCardCustomizationEvents definition ===');
console.log(pf.substring(fnIdx, fnIdx + 2000));

