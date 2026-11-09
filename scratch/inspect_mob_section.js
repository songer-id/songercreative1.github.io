const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');
const lines = content.split('\n');

for (let i = 3185; i < 3580; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

