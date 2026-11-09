const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf("if (actionType === 'buy') {", 400000);
console.log(pf.slice(idx - 200, idx + 1500));

