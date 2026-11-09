const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

for (let i = 9480; i < 9530; i++) {
  console.log((i + 1) + ': ' + pf[i]);
}
console.log('--- Model B lines 9580-9620 ---');
for (let i = 9580; i < 9620; i++) {
  console.log((i + 1) + ': ' + pf[i]);
}
console.log('--- Model C lines 9660-9690 ---');
for (let i = 9660; i < 9690; i++) {
  console.log((i + 1) + ': ' + pf[i]);
}

