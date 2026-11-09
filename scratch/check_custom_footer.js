const fs = require('fs');

const pfContent = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pfContent.split('\n');

console.log('Searching for custom_footer in product-form.js:');
lines.forEach((l, i) => {
  if (l.includes('custom_footer')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

