const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
let idx = 0;
while ((idx = pf.indexOf('btn-shopee-drawer-confirm', idx)) !== -1) {
  console.log('Match at ' + idx + ':');
  console.log(pf.slice(idx - 100, idx + 400));
  idx += 30;
}

