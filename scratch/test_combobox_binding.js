const fs = require('fs');

// Let's inspect how card-customization-section and its inputs are handled
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Check line 3205-3215
const f1SideIdx = pf.indexOf('input-card-footer-text-side');
console.log('--- Markup for input-card-footer-text-side ---');
console.log(pf.slice(f1SideIdx - 200, f1SideIdx + 300));

// Check when bindCleanDatalistPopovers is called
console.log('--- All calls to bindCleanDatalistPopovers ---');
const regex = /bindCleanDatalistPopovers\([^)]*\)/g;
let match;
while ((match = regex.exec(pf)) !== null) {
  console.log(match[0], 'at char', match.index);
}

