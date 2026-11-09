const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('closeMobilePreview = function ()');
console.log(JSON.stringify(pf.slice(idx, idx + 800)));

