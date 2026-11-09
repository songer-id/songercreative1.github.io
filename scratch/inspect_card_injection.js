const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const fnStart = pf.indexOf('function updateProductCardLivePreview()');
const fnEnd = pf.indexOf('// SIMULASI MINI PDP DETAIL PRODUK (KHUSUS STEP 2', fnStart);
const fnCode = pf.substring(fnStart, fnEnd);

const idx = fnCode.indexOf('cardHtml = `');
console.log('=== Card injection near end of Step 1 ===');
// Cari setelah Model A, B, C selesai
const lastPart = fnCode.substring(fnCode.lastIndexOf('cardHtml = `'));
console.log(lastPart.substring(lastPart.indexOf('previewContainer') - 200, lastPart.indexOf('restoreAllScrolls') + 100));

