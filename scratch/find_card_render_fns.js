const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Cari renderCardPreview atau renderLivePreview atau updateLivePreview
const functionsToFind = [
  'formatSalesCount',
  'renderCardPreview',
  'renderLivePreview',
  'renderStep1',
  'updatePreview',
  'refreshCardPreview',
  'getCardConfig',
  'loadProductForEdit',
  'saveProduct',
  'handleSaveCardDesign',
  'handleApplyDefaultCardDesign',
  'handleCancelCardDesign'
];

for (const fn of functionsToFind) {
  const idx = pf.indexOf(fn);
  if (idx !== -1) {
    console.log(`Found ${fn} at index ${idx}`);
  } else {
    console.log(`NOT found: ${fn}`);
  }
}

