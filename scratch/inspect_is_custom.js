const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');
for (let i = 8710; i <= 8735; i++) {
  console.log(i + ': ' + lines[i - 1]);
}