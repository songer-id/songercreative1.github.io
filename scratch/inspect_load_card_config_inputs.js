const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const loadIdx = pf.indexOf('function loadCardConfigInputs(');
console.log('=== loadCardConfigInputs snippet ===');
console.log(pf.substring(loadIdx, loadIdx + 3000));

