const { execSync } = require('child_process');

const diff = execSync('git show 0bf6d35 -- js/product-form.js', { maxBuffer: 10 * 1024 * 1024 }).toString();

const lines = diff.split('\n');
lines.forEach((l, i) => {
  if (l.includes('mobBody') || l.includes('mobile-preview-sheet') || l.includes('mobile-preview-body') || l.includes('themeBodyColor')) {
    console.log(`L${i}: ${l}`);
  }
});

