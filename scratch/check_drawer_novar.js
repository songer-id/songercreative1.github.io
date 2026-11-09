const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf('buildShopeeDrawerHtml');
console.log(pf.slice(idx + 1000, idx + 4000));

