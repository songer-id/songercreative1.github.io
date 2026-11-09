const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const deskFooterStart = pf.indexOf('id="accordion-body-footer"');
const slice = pf.slice(deskFooterStart, deskFooterStart + 8000);
const lines = slice.split('\n');

console.log('Total lines in slice:', lines.length);
for (let i = 40; i < Math.min(lines.length, 110); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

