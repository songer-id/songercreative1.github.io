const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
pf.split('\n').forEach((l, i) => {
  if (l.includes('mobile-preview-sheet') || l.includes('openMobilePreview') || l.includes('closeMobilePreview')) {
    console.log(i+1, l);
  }
});
