const fs = require('fs');

const path = 'js/product-form.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "    captureCardDesignSnapshot,\n    handleCancelCardDesign,\n    handleSaveCardDesign,",
  "    captureCardDesignSnapshot,\n    handleCancelCardDesign,\n    handleSaveCardDesign,\n    setCardCustomizationView,\n    loadCardConfigInputs,"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Exported setCardCustomizationView and loadCardConfigInputs in ProductForm');

