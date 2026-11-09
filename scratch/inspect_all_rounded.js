const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');
const lines = content.split('\n');

for (let i = 2650; i <= 3000; i++) {
  if (lines[i] && lines[i].includes('rounded-')) {
    console.log((i+1) + ': ' + lines[i].trim());
  }
}

