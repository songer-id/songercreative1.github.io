const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

const lines = css.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('desktop-preview-sidebar') || line.includes('mobile-preview-sheet') || line.includes('preview-card-outer') || line.includes('card-live-preview')) {
    console.log((idx + 1) + ': ' + line);
  }
});
