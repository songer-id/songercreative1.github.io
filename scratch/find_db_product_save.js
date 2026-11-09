const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const matches = [];
let m;
const re = /DB\.(?:saveProduct|updateProduct|addProduct)/g;
while ((m = re.exec(pf)) !== null) {
  matches.push({ pos: m.index, match: m[0], snippet: pf.substring(m.index - 50, m.index + 200).replace(/\n\s+/g, ' ') });
}
console.log('DB product save calls:', matches);

