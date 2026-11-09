const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const matches = [];
let m;
const re = /btn-border-width-preset/g;
while ((m = re.exec(pf)) !== null) {
  matches.push({ pos: m.index, snippet: pf.substring(m.index - 50, m.index + 200).replace(/\n\s+/g, ' ') });
}
console.log('btn-border-width-preset occurrences:', matches);

