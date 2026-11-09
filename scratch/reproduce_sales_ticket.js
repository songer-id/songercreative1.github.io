const fs = require('fs');

// We will inspect the exact event handlers in product-form.js
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Let's check how the eye icon click works in the browser
console.log('Inspecting eye toggle markup and handlers...');
const lines = pf.split('\n');
for (let i = 2740; i < 2775; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
