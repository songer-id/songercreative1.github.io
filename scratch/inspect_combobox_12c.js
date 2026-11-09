const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log('--- Inspecting datalist-variation-labels in getOptionsForDatalist ---');
const fnStart = pf.indexOf('function getOptionsForDatalist');
console.log(pf.slice(fnStart, fnStart + 1500));

