const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');

const p1 = pf.indexOf('// Countdown configs & simulation toggle');
const p2 = pf.indexOf('// 6. Config Styling & Display Toggles');
const p3 = pf.indexOf('// Footer 1 Custom Styles (Khusus Card C)');

if (p1 === -1 || p2 === -1 || p3 === -1 || !(p1 < p2 && p2 < p3)) {
  console.error('Indices invalid:', { p1, p2, p3 });
  process.exit(1);
}

const before = pf.slice(0, p1);
const partA = pf.slice(p1, p2);
const partB = pf.slice(p2, p3);
const after = pf.slice(p3);

console.log('partA length:', partA.length);
console.log('partB length:', partB.length);

const newPf = before + partB + partA + after;
fs.writeFileSync('js/product-form.js', newPf, 'utf8');
console.log('Successfully swapped configuration and preview calculation blocks in js/product-form.js!');

