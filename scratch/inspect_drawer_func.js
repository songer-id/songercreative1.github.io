const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');

function findDrawerLines() {
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('id="mobile-preview-sheet"') || l.includes('id="mobile-preview-drawer"')) {
      console.log((i+1) + ': ' + l);
    }
  });
}

findDrawerLines();

