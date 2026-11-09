const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');
const lines = content.split('\n');

for (let i = 3575; i < 3660; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

