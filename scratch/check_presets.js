const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('preset') || lines[i].includes('quick') || lines[i].includes('pilihan cepat')) {
    console.log((i+1) + ': ' + lines[i].trim());
  }
}

