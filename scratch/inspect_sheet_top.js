const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');
const lines = content.split('\n');

for (let i = 3140; i < 3200; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

