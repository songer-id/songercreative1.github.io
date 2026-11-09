const fs = require('fs');

function checkFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('body_bg_color') || l.includes('ctrl-hex-body-bg') || l.includes('bodyBg') || l.includes('--color-body')) {
      console.log(`${filepath}:${i+1}: ${l.trim()}`);
    }
  });
}

checkFile('js/admin-app.js');
checkFile('js/buyer-store.js');
checkFile('js/theme-editor.js');
checkFile('theme-editor.html');
checkFile('admin.html');
checkFile('index.html');

