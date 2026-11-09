const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('currentStep = 2') || line.includes('currentStep = 1') || line.includes('currentStep =')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

