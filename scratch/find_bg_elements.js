const fs = require('fs');

const pfContent = fs.readFileSync('js/product-form.js', 'utf8');

// Find desktop-preview-sidebar and mobile-preview-sheet
const deskStart = pfContent.indexOf('id="desktop-preview-sidebar"');
const deskEnd = pfContent.indexOf('<!-- FLOATING STRIP BUTTON', deskStart);
const deskHtml = pfContent.slice(deskStart, deskEnd);

const mobStart = pfContent.indexOf('id="mobile-preview-sheet"');
const mobEnd = pfContent.indexOf('<!-- EDIT MODAL', mobStart);
const mobHtml = pfContent.slice(mobStart, mobEnd);

console.log('=== Elements in Desktop Sidebar with bg- ===');
deskHtml.split('\n').forEach((l, i) => {
  if (l.includes('bg-') || l.includes('background')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

console.log('\n=== Elements in Mobile Sheet with bg- ===');
mobHtml.split('\n').forEach((l, i) => {
  if (l.includes('bg-') || l.includes('background')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

