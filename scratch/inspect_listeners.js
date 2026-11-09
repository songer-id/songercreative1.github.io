const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

for (let i = 26980; i < 27030; i++) {
  console.log((i + 1) + ': ' + pf[i]);
}
for (let i = 27360; i < 27400; i++) {
  console.log((i + 1) + ': ' + pf[i]);
}

