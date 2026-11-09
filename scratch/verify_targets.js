const fs = require('fs');

const path = 'js/product-form.js';
const content = fs.readFileSync(path, 'utf8');

console.log('Checking presence of key sections:');
console.log('1. syncThemeCSSVariables:', content.includes('function syncThemeCSSVariables()'));
console.log('2. getPrimaryThemeColor:', content.includes('function getPrimaryThemeColor()'));
console.log('3. Desktop outer wrapper:', content.includes('id="preview-card-outer-wrapper"'));
console.log('4. Mobile outer wrapper:', content.includes('id="preview-card-outer-wrapper-mob"'));
console.log('5. Live preview wrapper:', content.includes('// Pembungkus Area Kartu (SC-ADMIN-PREVIEW-LAYOUT-03-R1'));
console.log('6. Desktop save button:', content.includes('id="btn-save-card-design"'));
console.log('7. Mobile save button:', content.includes('id="btn-save-card-design-mob"'));
console.log('8. setCardCustomizationView:', content.includes('function setCardCustomizationView(isCustomMode)'));
console.log('9. handleSaveCardDesign:', content.includes('function handleSaveCardDesign()'));

