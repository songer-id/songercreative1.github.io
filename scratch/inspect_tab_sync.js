const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');
for (let i = 8585; i <= 8630; i++) {
  console.log(i + ': ' + lines[i-1]);
}

