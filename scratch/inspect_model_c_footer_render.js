const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

const pfModelCIdx = pf.indexOf('// CARD PRODUK MODEL 3: KARTU DETAIL (3:4 PORTRAIT + DUA FOOTER MELINTANG)');
console.log('=== Model C in product-form.js ===');
console.log(pf.substring(pfModelCIdx + 3000, pfModelCIdx + 6500));
