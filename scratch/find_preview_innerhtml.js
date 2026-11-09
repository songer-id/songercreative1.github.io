const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const fnStart = pf.indexOf('function updateProductCardLivePreview()');
const fnEnd = pf.indexOf('// SIMULASI MINI PDP DETAIL PRODUK (KHUSUS STEP 2', fnStart);
const fnCode = pf.substring(fnStart, fnEnd);

const innerHtmlMatches = [];
let m;
const re = /([a-zA-Z0-9_\.]+\.innerHTML\s*=\s*[^;]+;)/g;
while ((m = re.exec(fnCode)) !== null) {
  innerHtmlMatches.push(m[1]);
}
console.log('innerHTML assignments in updateProductCardLivePreview:');
console.log(innerHtmlMatches);

