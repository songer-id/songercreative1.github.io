const fs = require('fs');
const bs = fs.readFileSync('js/buyer-store.js', 'utf8');
bs.split('\n').forEach((l, i) => {
  if (l.includes('show_sales')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
