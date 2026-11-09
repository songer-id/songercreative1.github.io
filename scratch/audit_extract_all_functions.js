const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

const functions = [];
const fnRegex = /(?:function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\(([^)]*)\)|([a-zA-Z0-9_$]+))\s*=>|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*function\s*\(([^)]*)\))/;

lines.forEach((line, idx) => {
  const m = line.match(fnRegex);
  if (m) {
    const name = m[1] || m[3] || m[6];
    const params = m[2] !== undefined ? m[2] : (m[4] !== undefined ? m[4] : (m[5] !== undefined ? m[5] : m[7]));
    if (name && !['if', 'for', 'while', 'switch', 'catch'].includes(name)) {
      functions.push({
        name,
        params: (params || '').trim(),
        line: idx + 1,
        code: line.trim()
      });
    }
  }
});

console.log(`Extracted ${functions.length} functions from js/product-form.js`);

// Save to scratch
fs.writeFileSync('scratch/inventory_product_form_functions.json', JSON.stringify(functions, null, 2));
console.log('Saved scratch/inventory_product_form_functions.json');

