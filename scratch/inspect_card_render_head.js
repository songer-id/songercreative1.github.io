const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const snippet = pf.substring(525000, 535000);
console.log('Snippet 525000-535000:');
const lines = snippet.split('\n');
for (let i = 0; i < Math.min(lines.length, 120); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

