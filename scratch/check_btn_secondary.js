const fs = require('fs');

const pfContent = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pfContent.split('\n');

lines.forEach((l, i) => {
  if (l.includes('btn-step-1-cancel') || l.includes('btn-cancel') || l.includes('btn-secondary')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

