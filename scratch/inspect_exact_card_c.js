const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf('<!-- Dua Baris Strip Footer Horizontal di Bagian Bawah Kartu -->');
console.log(pf.slice(idx, idx + 1400));

