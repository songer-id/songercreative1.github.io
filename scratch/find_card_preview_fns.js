const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const regex = /card-live-preview-box|renderProductCardPreview|renderCardModelC/g;
let m;
while ((m = regex.exec(pf)) !== null) {
  const lineNo = pf.slice(0, m.index).split('\n').length;
  console.log(`Line ${lineNo}: ${m[0]}`);
}

