const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

console.log('--- getChk and surrounding lines 4260-4280 ---');
for (let i = 4255; i < 4280; i++) {
  console.log((i+1) + ': ' + pf[i]);
}

console.log('--- Event listeners lines 26980-27000 ---');
for (let i = 26980; i < 27010; i++) {
  console.log((i+1) + ': ' + pf[i]);
}

console.log('--- Event listeners lines 27360-27400 ---');
for (let i = 27360; i < 27400; i++) {
  console.log((i+1) + ': ' + pf[i]);
}
