const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Let's find where mini-pdp-card is in the DOM relative to preview-scoped-modal-root
const idx = pf.indexOf('preview-scoped-modal-root-mob');
console.log('Mobile preview container markup:');
console.log(pf.slice(idx - 600, idx + 400));

