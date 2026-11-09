const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

let idx = 0;
while ((idx = pf.indexOf('updateProductCardLivePreview()', idx)) !== -1) {
  console.log('Call at', idx);
  console.log(pf.slice(Math.max(0, idx - 100), Math.min(pf.length, idx + 100)));
  console.log('---');
  idx += 'updateProductCardLivePreview()'.length;
}

