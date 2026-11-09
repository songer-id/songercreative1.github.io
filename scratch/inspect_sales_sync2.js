const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');
console.log('Total lines:', pf.length);

const idx = pf.findIndex(l => l.includes('show_sales: getChk'));
console.log('show_sales: getChk at line:', idx + 1);
for (let i = Math.max(0, idx - 10); i < Math.min(pf.length, idx + 20); i++) {
  console.log((i + 1) + ': ' + pf[i]);
}
