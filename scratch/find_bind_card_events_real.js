const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const matches = [];
let m;
const re = /function\s+bindCardCustomizationEvents\s*\(/g;
while ((m = re.exec(pf)) !== null) {
  matches.push(m.index);
}
console.log('bindCardCustomizationEvents matches at:', matches);
if (matches.length > 0) {
  console.log(pf.substring(matches[0], matches[0] + 1500));
}

