const fs = require('fs');

const dbContent = fs.readFileSync('js/db.js', 'utf8');
const pfContent = fs.readFileSync('js/product-form.js', 'utf8');

console.log('Searching for getSettings in js/db.js:');
dbContent.split('\n').forEach((l, i) => {
  if (l.includes('getSettings')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

console.log('Searching for getSettings in js/product-form.js:');
pfContent.split('\n').forEach((l, i) => {
  if (l.includes('getSettings') || l.includes('body_bg') || l.includes('getPrimaryThemeColor')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

