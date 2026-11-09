const fs = require('fs');

function searchFile(path) {
  if (!fs.existsSync(path)) return;
  const content = fs.readFileSync(path, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('Daftar Produk') || l.includes('Tambah Produk') || l.includes('Edit Produk')) {
      console.log(`${path}:${idx + 1}: ${l.trim()}`);
    }
  });
}

searchFile('admin.html');
searchFile('js/product-form.js');
searchFile('js/admin-app.js');
searchFile('css/admin.css');

