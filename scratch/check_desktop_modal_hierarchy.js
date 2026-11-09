const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf('preview-scoped-modal-root"');
console.log('Desktop preview container markup:');
console.log(pf.slice(idx - 600, idx + 400));

