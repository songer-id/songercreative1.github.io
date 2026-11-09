const fs = require('fs');

const pfContent = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pfContent.split('\n');

lines.forEach((l, i) => {
  if (l.includes('cfg-footer-bg-color-side') || l.includes('cfg-footer-bg-color-mob') || l.includes('cfg-footer-2')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

