const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// 1. Cari bagaimana rating ditampilkan di Model A, B, C
const fnStart = pf.indexOf('function updateProductCardLivePreview()');
const fnEnd = pf.indexOf('// SIMULASI MINI PDP DETAIL PRODUK (KHUSUS STEP 2', fnStart);
const fnCode = pf.substring(fnStart, fnEnd);

console.log('--- updateProductCardLivePreview lines count ---', fnCode.split('\n').length);

// Cari rating rendering di Model A, B, C
const lines = fnCode.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('bi-star-fill') || l.includes('rating') || l.includes('Rating') || l.includes('salesCount') || l.includes('sales_count')) {
    console.log(`L${idx}: ${l.trim().substring(0, 140)}`);
  }
});

