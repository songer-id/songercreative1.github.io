const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');
for (let i = 8630; i <= 8670; i++) {
  console.log(i + ': ' + lines[i-1]);
}

