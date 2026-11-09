const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Desktop aside
const deskIdx = pf.indexOf('<aside id="desktop-preview-sidebar"');
const deskEnd = pf.indexOf('</aside>', deskIdx);
const deskHtml = pf.slice(deskIdx, deskEnd + 8);

// Mobile sheet
const mobIdx = pf.indexOf('<div id="mobile-preview-sheet"');
const mobEnd = pf.indexOf('<!-- END MOBILE PREVIEW SHEET -->', mobIdx) !== -1 
  ? pf.indexOf('<!-- END MOBILE PREVIEW SHEET -->', mobIdx) 
  : pf.indexOf('</main>', mobIdx); // or let's find where mobile-preview-sheet ends
const mobHtml = pf.slice(mobIdx, mobIdx + 2000);

console.log('=== DESKTOP HTML ===');
console.log(deskHtml.slice(0, 1500));

console.log('=== MOBILE HTML ===');
console.log(mobHtml.slice(0, 1500));

