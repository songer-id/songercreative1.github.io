const fs = require('fs');

const files = ['js/db.js', 'js/admin-app.js', 'js/buyer-store.js', 'js/pdp.js', 'js/product-form.js'];
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.match(/stock\s*[-=]|stock\s*=\s*.*-\s*qty|mutateStock|deductStock|reduceStock|decreaseStock/i)) {
      console.log(`${f} L${idx+1}: ${l.trim()}`);
    }
  });
});

