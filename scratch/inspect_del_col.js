const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

let idx = 0;
while ((idx = pf.indexOf('btn-del-size-col', idx)) !== -1) {
  console.log('Match at', idx);
  console.log(pf.slice(Math.max(0, idx - 100), Math.min(pf.length, idx + 400)));
  console.log('------------------');
  idx += 'btn-del-size-col'.length;
}

