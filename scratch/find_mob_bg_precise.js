const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

const mobStart = pf.indexOf('<div id="mobile-preview-sheet"');
const mobEnd = pf.indexOf('<!-- EDIT MODAL', mobStart) !== -1 
  ? pf.indexOf('<!-- EDIT MODAL', mobStart)
  : pf.indexOf('<!-- Modal Dialog / Popup', mobStart);

const mobHtml = pf.slice(mobStart, mobStart + 4000);

console.log('=== Lines in Mobile Sheet with bg- or background ===');
mobHtml.split('\n').forEach((l, i) => {
  if (l.includes('bg-') || l.includes('background')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

