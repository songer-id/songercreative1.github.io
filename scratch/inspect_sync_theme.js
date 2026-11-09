const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('syncThemeCSSVariables') || lines[i].includes('color-primary-subtle')) {
    console.log((i+1) + ': ' + lines[i].trim());
  }
}
