const fs = require('fs');

const pfContent = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pfContent.split('\n');

lines.forEach((l, i) => {
  if (l.includes('primaryState') && (l.includes('return') || l.includes('window.') || l.includes(': () =>') || l.includes('getPrimaryState'))) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

