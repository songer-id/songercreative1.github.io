const fs = require('fs');
['js/product-form.js', 'admin/index.html'].forEach(f => {
  if (fs.existsSync(f)) {
    const c = fs.readFileSync(f, 'utf8');
    c.split('\n').forEach((l, i) => {
      if (l.includes('cfg-countdown') || l.includes('cfg-enable-countdown')) {
        console.log(f + ':' + (i+1) + ': ' + l.trim());
      }
    });
  }
});

