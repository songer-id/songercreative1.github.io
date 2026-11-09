const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('ProductForm.closeMobilePreview');
console.log(pf.slice(idx - 100, idx + 200));

