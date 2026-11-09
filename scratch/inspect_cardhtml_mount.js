const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const fnStart = pf.indexOf('function updateProductCardLivePreview()');
const sub = pf.substring(fnStart);
const fnRealEnd = sub.indexOf('\n  function ');
const fullFn = sub.substring(0, fnRealEnd);

console.log(fullFn.substring(79500));

