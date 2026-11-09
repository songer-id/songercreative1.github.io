const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const rIdx = pf.indexOf('function resetProductFormState');
console.log(pf.slice(rIdx, rIdx + 1000));

