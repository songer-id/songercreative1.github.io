const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const fnStart = pf.indexOf('function updateProductCardLivePreview()');
const fnCode = pf.substring(fnStart, fnStart + 5000);
console.log('=== Start of updateProductCardLivePreview ===');
console.log(fnCode);

