const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf('function buildShopeeDrawerHtml');
const returnIdx = pf.indexOf('return `', idx);
console.log('Return index in buildShopeeDrawerHtml:', returnIdx);
console.log(pf.slice(returnIdx, returnIdx + 3000));

