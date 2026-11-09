const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const deskFooterStart = pf.indexOf('id="accordion-body-footer"');
const lines = pf.slice(deskFooterStart, deskFooterStart + 5000).split('\n');

for (let i = 0; i < 90; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

