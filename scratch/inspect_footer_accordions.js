const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Find accordion-group-footer or accordion-body-footer
let pos = 0;
while (true) {
  const idx = pf.indexOf('accordion-body-footer', pos);
  if (idx === -1) break;
  console.log('accordion-body-footer found at:', idx);
  console.log(pf.slice(Math.max(0, idx - 150), idx + 800));
  console.log('='.repeat(50));
  pos = idx + 21;
}
