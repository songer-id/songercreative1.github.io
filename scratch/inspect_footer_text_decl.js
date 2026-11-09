const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

const fnStart = pf.indexOf('function updateProductCardLivePreview()');
const sub = pf.substring(fnStart);
const idx = sub.indexOf('footerText');
console.log('footerText pos:', idx);
if (idx !== -1) {
  console.log(sub.substring(idx - 200, idx + 1000));
}
