const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

console.log('=== CANCEL & DRAFT HANDLING IN product-form.js ===');
lines.forEach((l, idx) => {
  if (l.match(/function\s+(?:handleFormCancel|hasAnyNewProductData|hasEditProductChanged|clearDraftStorage|saveDraftToStorage|loadDraftFromStorage)\b/)) {
    console.log(`L${idx+1}: ${l.trim()}`);
  }
});

