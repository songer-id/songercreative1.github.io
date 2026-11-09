const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

let pos = 0;
while ((pos = pf.indexOf('select-card-footer-icon', pos)) !== null && pos !== -1) {
  console.log('--- Found at pos:', pos);
  console.log(pf.substring(Math.max(0, pos - 150), Math.min(pf.length, pos + 300)));
  pos += 24;
}
