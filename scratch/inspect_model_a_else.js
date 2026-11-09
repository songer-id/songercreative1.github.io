const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

for (let i = 9685; i < 9735; i++) {
  console.log((i + 1) + ': ' + pf[i]);
}

