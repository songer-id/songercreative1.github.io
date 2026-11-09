const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

lines.forEach((l, i) => {
  if (l.includes('cardDesignSnapshot') || l.includes('handleCancelCardDesign') || l.includes('captureCardDesignSnapshot')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});
