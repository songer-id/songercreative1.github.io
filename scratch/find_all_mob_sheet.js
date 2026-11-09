const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

let idx = 0;
while ((idx = pf.indexOf('id="mobile-preview-sheet"', idx)) !== -1) {
  console.log('Match at', idx);
  console.log(pf.slice(Math.max(0, idx - 100), Math.min(pf.length, idx + 200)));
  console.log('-------------------------');
  idx += 'id="mobile-preview-sheet"'.length;
}

