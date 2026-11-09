const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('min_hpp') || line.includes('min-hpp')) {
    console.log((idx+1) + ': ' + line.trim());
  }
});

