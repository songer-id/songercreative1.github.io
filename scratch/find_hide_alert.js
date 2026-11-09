const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
let idx = 0;
while ((idx = pf.indexOf('hidePreviewTestModeAlert', idx)) !== -1) {
  console.log('Match at ' + idx + ': ' + pf.slice(idx - 30, idx + 100).replace(/\n/g, ' '));
  idx += 24;
}

