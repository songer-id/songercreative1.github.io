const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

const lines = css.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('border') && (l.includes('desktop-preview-sidebar') || l.includes('preview-header') || l.includes('preview-sidebar') || l.includes('mobile-preview-sheet'))) {
    console.log((idx + 1) + ': ' + l.trim());
  }
});

