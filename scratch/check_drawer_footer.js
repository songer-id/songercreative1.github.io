const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf('buildShopeeDrawerHtml');
const nextFn = pf.indexOf('function updateDrawerQtyButtonsState');
console.log('Total drawer html len:', nextFn - idx);
console.log(pf.slice(nextFn - 3000, nextFn));

