const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const bs = fs.readFileSync('js/buyer-store.js', 'utf8');

const pfIdx = pf.indexOf('<!-- Footer 1 (Atas)');
console.log('=== product-form.js Card C Footer ===');
console.log(pf.slice(pfIdx - 100, pfIdx + 1600));

const bsIdx = bs.indexOf('<!-- Footer 1 (Atas)');
console.log('=== buyer-store.js Card C Footer ===');
console.log(bs.slice(bsIdx - 100, bsIdx + 1600));
