const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const fnStart = pf.indexOf('function updateProductCardLivePreview()');
const fnEnd = pf.indexOf('// SIMULASI MINI PDP DETAIL PRODUK (KHUSUS STEP 2', fnStart);
const fnCode = pf.substring(fnStart, fnEnd);

let pos = 0;
while ((pos = fnCode.indexOf('innerHTML', pos)) !== -1) {
  console.log(fnCode.substring(pos - 40, pos + 80).replace(/\n\s+/g, ' '));
  pos += 10;
}

