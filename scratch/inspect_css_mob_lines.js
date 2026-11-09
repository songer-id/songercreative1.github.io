const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

// Find all CSS rules containing "mobile-preview"
const lines = css.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('mobile-preview') || line.includes('preview-card-outer-wrapper')) {
    console.log(`L${idx + 1}: ${line}`);
  }
});

