const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

let idx = 0;
while ((idx = pf.indexOf('openMobilePreview', idx)) !== -1) {
  console.log('Match at', idx);
  console.log(pf.slice(Math.max(0, idx - 50), Math.min(pf.length, idx + 400)));
  console.log('-------------------------');
  idx += 'openMobilePreview'.length;
}

idx = 0;
while ((idx = pf.indexOf('closeMobilePreview', idx)) !== -1) {
  console.log('Match at', idx);
  console.log(pf.slice(Math.max(0, idx - 50), Math.min(pf.length, idx + 400)));
  console.log('-------------------------');
  idx += 'closeMobilePreview'.length;
}

