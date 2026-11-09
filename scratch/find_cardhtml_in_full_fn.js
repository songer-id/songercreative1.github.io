const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const fnStart = pf.indexOf('function updateProductCardLivePreview()');
const fnEnd = pf.indexOf('function getExtraQty(id)', fnStart + 50000); // cari akhir fungsi
const sub = pf.substring(fnStart);
const fnRealEnd = sub.indexOf('\n  function ');
const fullFn = sub.substring(0, fnRealEnd);

console.log('Total length of updateProductCardLivePreview:', fullFn.length);

// Cari semua pemakaian cardHtml di fullFn
const matches = [];
let pos = 0;
while ((pos = fullFn.indexOf('cardHtml', pos)) !== -1) {
  matches.push({ pos, snippet: fullFn.substring(Math.max(0, pos - 30), Math.min(fullFn.length, pos + 100)).replace(/\n\s+/g, ' ') });
  pos += 8;
}
console.log('Matches:', matches);

