const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const saveIdx = pf.indexOf('function saveCardConfigInputs(');
console.log('=== saveCardConfigInputs & surrounding ===');
console.log(pf.substring(saveIdx - 500, saveIdx + 1500));

