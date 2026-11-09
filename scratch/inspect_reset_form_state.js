const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const resetIdx = pf.indexOf('function resetFormState(');
console.log('=== resetFormState definition ===');
console.log(pf.substring(resetIdx, resetIdx + 2000));
