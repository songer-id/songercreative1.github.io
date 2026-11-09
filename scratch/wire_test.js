const fs = require('fs');

const path = 'scratch/test_card_design_04.js';
let content = fs.readFileSync(path, 'utf8');

// Attach event listeners to mock elements
const targetWire = "// Color inputs\nconst cfgTitleColor = mockDoc.getElementById('cfg-title-color');";
const wireCode = `// Wire event listeners on mock buttons like bindProductFormEvents does
tabDefDesk.addEventListener('click', () => ProductForm.setCardCustomizationView(false));
tabCustDesk.addEventListener('click', () => ProductForm.setCardCustomizationView(true));
tabDefMob.addEventListener('click', () => ProductForm.setCardCustomizationView(false));
tabCustMob.addEventListener('click', () => ProductForm.setCardCustomizationView(true));
btnCancelDesk.addEventListener('click', ProductForm.handleCancelCardDesign);
btnCancelMob.addEventListener('click', ProductForm.handleCancelCardDesign);
btnSaveDesk.addEventListener('click', ProductForm.handleSaveCardDesign);
btnSaveMob.addEventListener('click', ProductForm.handleSaveCardDesign);

// Color inputs
const cfgTitleColor = mockDoc.getElementById('cfg-title-color');`;

content = content.replace(targetWire, wireCode);
fs.writeFileSync(path, content, 'utf8');
console.log('Wired event listeners in test_card_design_04.js');

