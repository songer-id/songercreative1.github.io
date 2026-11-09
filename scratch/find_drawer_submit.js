const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
let idx = 0;
while ((idx = pf.indexOf('btn-submit-shopee-drawer', idx)) !== -1) {
  console.log('Match at ' + idx + ': ' + pf.slice(idx, idx + 120).replace(/\n/g, ' '));
  idx += 25;
}
if (idx === 0) {
  console.log('btn-submit-shopee-drawer not found, searching for drawer submit');
  let i = 0;
  while ((i = pf.indexOf('updateShopeeDrawerSubmitButtonState', i)) !== -1) {
    console.log('updateShopeeDrawerSubmitButtonState at ' + i);
    i += 30;
  }
}

