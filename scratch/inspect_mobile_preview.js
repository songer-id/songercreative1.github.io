const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// 1. Mobile Drawer complete markup
const mobSheetIndex = pf.indexOf('id="mobile-preview-sheet"');
if (mobSheetIndex !== -1) {
  console.log('--- Mobile Drawer Full HTML ---');
  console.log(pf.slice(mobSheetIndex - 200, mobSheetIndex + 2500));
}

// 2. Search for where themeBodyColor is used in updateProductCardLivePreview
console.log('\n--- themeBodyColor usage in product-form.js ---');
let idx = 0;
while ((idx = pf.indexOf('getThemeBodyColor', idx)) !== -1) {
  console.log('Match at', idx);
  console.log(pf.slice(Math.max(0, idx - 100), Math.min(pf.length, idx + 200)));
  console.log('-------------------------');
  idx += 'getThemeBodyColor'.length;
}

