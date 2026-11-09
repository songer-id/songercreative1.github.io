const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

lines.forEach((line, idx) => {
  if (line.includes('function updateProductCardLivePreview') || 
      line.includes('function renderProductForm') ||
      line.includes('updatePreviewSidebarHeader')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

