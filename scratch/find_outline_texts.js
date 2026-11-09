const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const searchTerms = ['Garis Tepi', 'Warna Border', 'Warna Garis Tepi', 'Tanpa', 'None', 'cfg-border-width'];
const results = [];
pf.split('\n').forEach((l, i) => {
  searchTerms.forEach(term => {
    if (l.includes(term) && i > 2500 && i < 4500) {
      results.push(`Line ${i+1} [${term}]: ${l.trim()}`);
    }
  });
});
console.log(results.join('\n'));
