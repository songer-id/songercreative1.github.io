const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

console.log('=== L4920-4950 (handleSaveCardDesign) ===');
console.log(lines.slice(4920, 4950).join('\n'));

lines.forEach((l, i) => {
  if (l.includes('function handleFormSubmit') || l.includes('async function handleFormSubmit')) {
    console.log(`handleFormSubmit at L${i+1}: ${l.trim()}`);
  }
});

