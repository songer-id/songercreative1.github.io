const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const sIdx = pf.indexOf('mobile-preview-body');
console.log('Mobile preview body snippet:');
console.log(pf.slice(sIdx, sIdx + 1200));
