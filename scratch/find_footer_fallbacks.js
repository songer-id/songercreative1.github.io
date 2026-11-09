const fs = require('fs');

function searchFallback(file) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = [];
  let m;
  const re = /(?:Proses Hanya Dalam 1Jam|Variasi Paket Tersedia|Proses Cepat)/gi;
  while ((m = re.exec(content)) !== null) {
    matches.push({
      file,
      match: m[0],
      pos: m.index,
      snippet: content.substring(Math.max(0, m.index - 50), Math.min(content.length, m.index + 120)).replace(/\n\s+/g, ' ')
    });
  }
  return matches;
}

console.log('=== Fallback matches ===');
console.log(searchFallback('js/product-form.js'));
console.log(searchFallback('js/buyer-store.js'));
console.log(searchFallback('js/db.js'));
