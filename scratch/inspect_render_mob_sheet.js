const fs = require('fs');

// Let's examine:
// In renderStep1(), where is mobile-preview-sheet rendered?
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const mobSheetIdx = pf.indexOf('<div id="mobile-preview-sheet"');
console.log('--- mobile-preview-sheet declaration in renderStep1 ---');
console.log(pf.slice(mobSheetIdx, mobSheetIdx + 1500));

