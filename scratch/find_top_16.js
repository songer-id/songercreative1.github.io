const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const css = fs.readFileSync('css/admin.css', 'utf8');

console.log('Search for 4rem or top-16 in css:');
css.split('\n').forEach((l, i) => {
  if (l.includes('4rem') || l.includes('top-16') || l.includes('top: 16') || l.includes('top: 64')) {
    console.log(`css:${i+1}: ${l.trim()}`);
  }
});

console.log('Search for 4rem or top-16 in pf:');
pf.split('\n').forEach((l, i) => {
  if (l.includes('4rem') || l.includes('top-16') || l.includes('top: 16') || l.includes('top: 64')) {
    console.log(`pf:${i+1}: ${l.trim()}`);
  }
});

