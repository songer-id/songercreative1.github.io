const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

for (let i = 65; i < 115; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

