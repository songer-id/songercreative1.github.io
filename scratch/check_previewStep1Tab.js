const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('previewStep1Tab')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

