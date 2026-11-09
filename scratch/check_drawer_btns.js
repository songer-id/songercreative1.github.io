const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf('function buildShopeeDrawerHtml');
const snippet = pf.slice(idx, idx + 20000);
let i = 0;
while ((i = snippet.indexOf('btn-', i)) !== -1) {
  const match = snippet.slice(i, i + 50).split(' ')[0];
  console.log('Button class in drawer: ' + match);
  i += 10;
}

