const fs = require('fs');

['admin.html', 'js/theme-editor.js', 'js/product-form.js', 'css/admin.css'].forEach(f => {
  if (!fs.existsSync(f)) return;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('type="range"') || l.includes('accent-emerald')) {
      console.log(`${f}:${idx + 1}: ${l.trim()}`);
    }
  });
});

