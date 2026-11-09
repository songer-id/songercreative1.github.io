const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

// 1. Breadcrumb search
console.log('--- Breadcrumb Search ---');
const topBarIndex = pf.indexOf('product-form-top-bar');
if (topBarIndex !== -1) {
  console.log('Found product-form-top-bar at char', topBarIndex);
  console.log(pf.slice(topBarIndex - 200, topBarIndex + 400));
} else {
  console.log('product-form-top-bar NOT found in product-form.js');
}

// 2. Mobile drawer markup
console.log('\n--- Mobile Drawer Markup ---');
const mobSheetIndex = pf.indexOf('mobile-preview-sheet');
if (mobSheetIndex !== -1) {
  console.log('Found mobile-preview-sheet at char', mobSheetIndex);
  console.log(pf.slice(mobSheetIndex - 300, mobSheetIndex + 800));
}

// 3. Mobile preview background styling in updateProductCardLivePreview
console.log('\n--- Mobile preview background in updateProductCardLivePreview ---');
const updateLiveIndex = pf.indexOf('function updateProductCardLivePreview');
if (updateLiveIndex !== -1) {
  console.log(pf.slice(updateLiveIndex, updateLiveIndex + 1200));
}

