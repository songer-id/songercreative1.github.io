const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('// Footer 2 Custom Styles (Khusus Card C)');
console.log('Context around footer extraction in updateProductCardLivePreview:');
console.log(pf.slice(idx - 600, idx + 1500));
