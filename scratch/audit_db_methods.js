const fs = require('fs');
const db = fs.readFileSync('js/db.js', 'utf8');
const lines = db.split('\n');

console.log('=== PRODUCT METHODS IN DB.JS ===');
lines.forEach((l, idx) => {
  if (l.match(/function\s+[a-zA-Z0-9_]*Product[a-zA-Z0-9_]*|Product.*=|getProducts|saveProduct|createProduct|updateProduct|deleteProduct/)) {
    console.log(`L${idx+1}: ${l.trim()}`);
  }
});

