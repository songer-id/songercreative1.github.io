const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('btn-border-radius-preset');
console.log('--- btn-border-radius-preset:');
let pos = 0;
while ((pos = pf.indexOf('btn-border-radius-preset', pos)) !== -1) {
  console.log(`At pos ${pos}:`);
  console.log(pf.slice(Math.max(0, pos - 50), Math.min(pf.length, pos + 250)));
  console.log('---');
  pos += 24;
}

