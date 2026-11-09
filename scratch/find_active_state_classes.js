const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Search for classList.add or className manipulation on presets and tools
const lines = pf.split('\n');
lines.forEach((l, i) => {
  if (
    (l.includes('btn-') || l.includes('preset') || l.includes('counter') || l.includes('active') || l.includes('badge')) &&
    (l.includes('font-') || l.includes('bold') || l.includes('medium') || l.includes('semibold'))
  ) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

