const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf('<!-- Dua Baris Strip Footer Horizontal di Bagian Bawah Kartu -->');
const endIdx = pf.indexOf('</div>\n        </div>\n      `;', idx);
console.log('endIdx:', endIdx);
console.log(pf.slice(idx, endIdx + 6));

