const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');
const lines = css.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('view-product-form') || line.includes('admin-main-viewport') || line.includes('product-form-wrapper') || line.includes('wizard-form-col') || line.includes('desktop-preview-sidebar')) {
    console.log((idx + 1) + ': ' + line.trim());
  }
});
