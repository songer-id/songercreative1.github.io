const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('Dua Strip Footer Kartu Etalase');
console.log('Index:', idx);
console.log(pf.substring(idx - 600, idx + 100));
