const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const snippet = pf.substring(514000, 520000);
const lines = snippet.split('\n');
console.log('Snippet 514000-520000:');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function') || lines[i].includes('const ') || lines[i].includes('let ')) {
    console.log(`${i}: ${lines[i]}`);
  }
}

