const fs = require('fs');

const pfContent = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pfContent.split('\n');

lines.forEach((l, i) => {
  if (l.includes('function resetFormState') || l.includes('function editProduct')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

