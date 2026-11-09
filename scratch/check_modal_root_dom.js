const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
let idx = 0;
while ((idx = pf.indexOf('preview-scoped-modal-root', idx)) !== -1) {
  console.log('Match at ' + idx + ':');
  console.log(pf.slice(idx - 150, idx + 250));
  idx += 30;
}

