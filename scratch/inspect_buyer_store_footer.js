const fs = require('fs');

const bs = fs.readFileSync('js/buyer-store.js', 'utf8');

const idx = bs.indexOf('Footer 1');
console.log('BuyerStore Footer 1 pos:', idx);
if (idx !== -1) {
  console.log(bs.substring(idx - 200, idx + 1500));
}
