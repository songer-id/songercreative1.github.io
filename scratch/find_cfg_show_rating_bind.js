const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const matches = [];
let m;
const re = /addEventListener\(['"]change['"],\s*[^)]*cfg-show-rating/g;
const re2 = /cfg-show-rating/g;
while ((m = re2.exec(pf)) !== null) {
  matches.push({ pos: m.index, snippet: pf.substring(m.index - 50, m.index + 120).replace(/\n\s+/g, ' ') });
}
console.log('cfg-show-rating matches count:', matches.length);
console.log(matches.slice(0, 8));

