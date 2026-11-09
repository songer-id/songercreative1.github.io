const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

function findCalls(name) {
  let idx = 0;
  console.log('=== ' + name + ' ===');
  while ((idx = pf.indexOf(name, idx)) !== -1) {
    console.log('Match at ' + idx + ': ' + pf.slice(idx - 30, idx + 80).replace(/\n/g, ' '));
    idx += name.length;
  }
}

findCalls('addSingleProductToCartDirect');
findCalls('addVariantProductToCartDirect');

