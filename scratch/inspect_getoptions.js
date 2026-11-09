const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log('Inspecting getOptionsForDatalist for footer-texts-history-list:');
const fIdx = pf.indexOf("listId === 'footer-texts-history-list'");
console.log(pf.slice(fIdx - 50, fIdx + 800));

