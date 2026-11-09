const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

function findOccurrences(term) {
  let idx = 0;
  console.log('=== ' + term + ' ===');
  while ((idx = pf.indexOf(term, idx)) !== -1) {
    console.log('Match at ' + idx + ': ' + pf.slice(idx - 20, idx + 150).replace(/\n/g, ' '));
    idx += term.length;
  }
}

findOccurrences('btn-preview-mode-passive');
findOccurrences('btn-preview-mode-test');

