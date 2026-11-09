const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

function searchAll(term) {
  console.log(`=== Matches for: ${term} ===`);
  const lines = pf.split('\n');
  lines.forEach((l, i) => {
    if (l.includes(term)) {
      console.log(`L${i+1}: ${l.trim()}`);
    }
  });
}

searchAll('input-card-footer-text');
searchAll('input-card-footer-2-text');
searchAll('cfg-footer-bg-color');
searchAll('cfg-footer-text-color');
