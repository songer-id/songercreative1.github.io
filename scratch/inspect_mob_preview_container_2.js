const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

let idx = 422350;
while ((idx = pf.indexOf('mobilePreviewContainer', idx)) !== -1) {
  console.log('Match at', idx);
  console.log(pf.slice(Math.max(0, idx - 100), Math.min(pf.length, idx + 300)));
  console.log('-------------------------');
  idx += 'mobilePreviewContainer'.length;
}

