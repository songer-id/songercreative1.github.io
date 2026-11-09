const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf('function buildShopeeDrawerHtml');
const endIdx = pf.indexOf('function bindMiniPdpInteractiveEvents');
console.log(pf.slice(endIdx - 2000, endIdx));

