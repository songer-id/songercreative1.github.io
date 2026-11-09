const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const fnStart = pf.indexOf('function updateProductCardLivePreview()');
const fnEnd = pf.indexOf('// SIMULASI MINI PDP DETAIL PRODUK (KHUSUS STEP 2', fnStart);
const fnCode = pf.substring(fnStart, fnEnd);
const lines = fnCode.split('\n');

console.log('=== Model B Rating/Sales (lines 660-685) ===');
console.log(lines.slice(660, 685).join('\n'));

console.log('=== Model C Rating (lines 735-755) ===');
console.log(lines.slice(735, 755).join('\n'));

console.log('=== Model A Rating (lines 810-830) ===');
console.log(lines.slice(810, 830).join('\n'));

