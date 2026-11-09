const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

const lines = css.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('mobile-preview-sheet') || l.includes('mobile-preview-body') || l.includes('mobile-card-preview-container') || l.includes('preview-card-outer-wrapper-mob') || l.includes('mobile-preview-backdrop')) {
    console.log(`${idx + 1}: ${l}`);
  }
});

