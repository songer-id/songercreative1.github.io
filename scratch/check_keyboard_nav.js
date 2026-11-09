const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split(/\r?\n/);
for (let i = 1340; i < 1390; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

