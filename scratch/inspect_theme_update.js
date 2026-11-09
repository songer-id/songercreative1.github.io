const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const target = 'preview-card-outer-wrapper-mob';
const idx = pf.indexOf(target);
console.log(pf.slice(idx - 200, idx + 1000));

