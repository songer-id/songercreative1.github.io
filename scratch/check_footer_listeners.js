const fs = require('fs');

const pfContent = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pfContent.split('\n');

console.log('Searching for footer/discount/countdown listeners in product-form.js:');
lines.forEach((l, i) => {
  if (l.includes('cfg-footer') || l.includes('cfg-discount-badge') || l.includes('cfg-countdown') || l.includes('cfg-badge-')) {
    if (l.includes('addEventListener') || l.includes('forEach') || l.includes('input') || l.includes('change')) {
      console.log(`L${i+1}: ${l.trim()}`);
    }
  }
});

