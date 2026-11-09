const fs = require('fs');

console.log('Testing card sales rendering across Model A, B, and C...');

// Let's inspect formatSalesCount in product-form.js
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Check formatSalesCount occurrences
const fnMatch = pf.match(/function formatSalesCount\([\s\S]*?\n  \}/);
if (fnMatch) {
  console.log('formatSalesCount function definition:');
  console.log(fnMatch[0]);
}

// Check where formatSalesCount is called in updateProductCardLivePreview
const lines = pf.split('\n');
lines.forEach((l, i) => {
  if (l.includes('formatSalesCount(')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
