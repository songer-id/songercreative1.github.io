const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

let idx = 0;
while ((idx = pf.indexOf('btn-step-1-cancel', idx)) !== -1) {
  console.log('Match at', idx);
  console.log(pf.slice(Math.max(0, idx - 50), Math.min(pf.length, idx + 200)));
  console.log('---');
  idx += 'btn-step-1-cancel'.length;
}

