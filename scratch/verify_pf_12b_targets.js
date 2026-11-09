const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log('1. getSecondaryThemeColor exists:', pf.includes('function getSecondaryThemeColor()'));
console.log('2. getLastProductFooterConfig exists:', pf.includes('function getLastProductFooterConfig()'));
console.log('3. getUnicodeLength exists:', pf.includes('function getUnicodeLength(str)'));
console.log('4. updateFooterCharCounter exists:', pf.includes('function updateFooterCharCounter(inputEl, counterEl)'));
console.log('5. handleSaveCardDesign exists:', pf.includes('function handleSaveCardDesign()'));
console.log('6. handleCancelCardDesign exists:', pf.includes('function handleCancelCardDesign()'));
console.log('7. validateForm exists:', pf.includes('function validateForm(isDraft = false)'));
console.log('8. getOptionsForDatalist footer exists:', pf.includes("listId === 'footer-texts-history-list'"));
console.log('9. accordion-body-footer exists:', pf.includes('id="accordion-body-footer"'));
console.log('10. accordion-body-footer-mob exists:', pf.includes('id="accordion-body-footer-mob"'));
console.log('11. footer-texts-history-list datalist markup exists:', pf.includes('<datalist id="footer-texts-history-list">'));

