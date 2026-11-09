const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

let idx = 0;
let count = 0;
while ((idx = pf.indexOf('mobilePreviewContainer', idx)) !== -1) {
  count++;
  console.log(`[${count}] idx: ${idx}`);
  idx += 'mobilePreviewContainer'.length;
}

