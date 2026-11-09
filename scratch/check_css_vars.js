const fs = require('fs');

function checkCss(file) {
  if (!fs.existsSync(file)) return;
  const c = fs.readFileSync(file, 'utf8');
  c.split('\n').forEach((l, i) => {
    if (l.includes('--body') || l.includes('--color-body') || l.includes('--bg-body') || l.includes('body_bg')) {
      console.log(`${file}:${i+1}: ${l.trim()}`);
    }
  });
}

checkCss('css/style.css');
checkCss('css/admin.css');
checkCss('css/theme-editor.css');

