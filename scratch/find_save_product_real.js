const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const matches = [];
let m;
const re = /(?:function|const|let|var)\s+([a-zA-Z0-9_]*save[a-zA-Z0-9_]*)\s*=?/gi;
while ((m = re.exec(pf)) !== null) {
  matches.push({ name: m[1], pos: m.index });
}
console.log('Save functions found:');
console.log(matches);

// Cari submit handler
const subMatches = [];
const reSub = /addEventListener\(['"]submit['"]/g;
while ((m = reSub.exec(pf)) !== null) {
  subMatches.push(m.index);
}
console.log('Submit listeners found at indices:', subMatches);

