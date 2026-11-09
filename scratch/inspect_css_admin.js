const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

let idx = 0;
while ((idx = css.indexOf('admin-main-viewport', idx)) !== -1) {
  console.log('Match at', idx);
  console.log(css.slice(Math.max(0, idx - 100), Math.min(css.length, idx + 300)));
  console.log('-------------------------');
  idx += 'admin-main-viewport'.length;
}

// Also check for mobile-preview-backdrop and mobile-preview-sheet
console.log('\n--- mobile-preview styles in css/admin.css ---');
idx = 0;
while ((idx = css.indexOf('mobile-preview', idx)) !== -1) {
  console.log('Match at', idx);
  console.log(css.slice(Math.max(0, idx - 100), Math.min(css.length, idx + 300)));
  console.log('-------------------------');
  idx += 'mobile-preview'.length;
}

