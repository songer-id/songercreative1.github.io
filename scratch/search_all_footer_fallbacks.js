const fs = require('fs');

function searchPhrase(phrase) {
  ['js/product-form.js', 'js/buyer-store.js', 'js/db.js'].forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((l, i) => {
      if (l.includes(phrase)) {
        console.log(`${file}:${i+1}: ${l.trim()}`);
      }
    });
  });
}

console.log('=== SEARCHING: Proses Hanya Dalam 1Jam ===');
searchPhrase('Proses Hanya Dalam 1Jam');

console.log('=== SEARCHING: Variasi Paket Tersedia ===');
searchPhrase('Variasi Paket Tersedia');
