const fs = require('fs');

const pfContent = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pfContent.split('\n');

console.log('Searching for card design editor functions:');
lines.forEach((l, i) => {
  if (l.includes('loadCardConfigInputs') || 
      l.includes('saveCardConfigInputs') ||
      l.includes('btn-save-card-design') ||
      l.includes('tab-card-design-default') ||
      l.includes('use_default_card_design') ||
      l.includes('saveCardModelPreset')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

