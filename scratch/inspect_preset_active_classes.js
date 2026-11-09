const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const regex = /btn-(?:border-width|border-radius|discount-badge-radius|countdown-radius|badge-radius|rating-src|sales-src)[^;]*;?/g;
// search for occurrences
const lines = pf.split('\n');
lines.forEach((l, i) => {
  if (l.includes('border-emerald-500') || l.includes('bg-emerald-50')) {
    if (l.includes('font-')) {
      console.log(`L${i+1}: ${l.trim()}`);
    }
  }
});

