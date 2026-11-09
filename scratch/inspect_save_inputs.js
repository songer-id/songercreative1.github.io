const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

const idx = pf.findIndex(l => l.includes('function saveCardConfigInputs('));
console.log('saveCardConfigInputs at line:', idx + 1);
for (let i = Math.max(0, idx - 5); i < Math.min(pf.length, idx + 40); i++) {
  console.log((i + 1) + ': ' + pf[i]);
}
