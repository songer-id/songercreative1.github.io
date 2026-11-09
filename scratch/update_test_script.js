const fs = require('fs');

const path = 'scratch/test_card_design_04.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const primaryState = ProductForm.primaryState || sandbox.primaryState;",
  "const primaryState = ProductForm.getPrimaryState();"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Updated test_card_design_04.js with getPrimaryState()');

