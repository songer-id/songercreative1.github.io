const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');
for (let i = 26340; i <= 26390; i++) {
  console.log(i + ': ' + lines[i-1]);
}

