const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

console.log('--- Lines 3700-3790 (getCardConfigFromDOM & loadCardConfigInputs) ---');
for (let i = 3700; i <= 3790; i++) {
  console.log(i + ': ' + lines[i-1]);
}

console.log('--- Lines 26420-26470 (cfgInputs binding) ---');
for (let i = 26420; i <= 26470; i++) {
  console.log(i + ': ' + lines[i-1]);
}

