const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

console.log('=== LOAD PRODUCT FOR EDIT IN product-form.js ===');
let startLine = -1;
lines.forEach((l, idx) => {
  if (l.includes('function loadProductForEdit') || l.includes('loadProductForEdit(')) {
    startLine = idx + 1;
  }
});
console.log(`loadProductForEdit starts at L${startLine}`);
if (startLine !== -1) {
  console.log(lines.slice(startLine - 1, startLine + 120).join('\n'));
}

