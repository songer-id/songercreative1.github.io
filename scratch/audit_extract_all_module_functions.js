const fs = require('fs');

const files = [
  'js/product-form.js',
  'js/db.js',
  'js/pricing-calculator.js',
  'js/utils.js',
  'js/admin-app.js',
  'js/buyer-store.js',
  'js/pdp.js',
  'js/category-manager.js',
  'js/promo-manager.js'
];

const fnRegex = /(?:function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\(([^)]*)\)|([a-zA-Z0-9_$]+))\s*=>|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*function\s*\(([^)]*)\)|^\s*([a-zA-Z0-9_$]+)\s*\(([^)]*)\)\s*\{)/;

const catalog = {};

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const lines = code.split('\n');
  const list = [];
  lines.forEach((line, idx) => {
    const m = line.match(fnRegex);
    if (m) {
      const name = m[1] || m[3] || m[6] || m[8];
      const params = m[2] !== undefined ? m[2] : (m[4] !== undefined ? m[4] : (m[5] !== undefined ? m[5] : (m[7] !== undefined ? m[7] : m[9])));
      if (name && !['if', 'for', 'while', 'switch', 'catch'].includes(name)) {
        list.push({
          name,
          params: (params || '').trim(),
          line: idx + 1
        });
      }
    }
  });
  catalog[f] = list;
  console.log(`${f}: ${list.length} functions`);
});

fs.writeFileSync('scratch/inventory_all_files_functions.json', JSON.stringify(catalog, null, 2));
console.log('Saved scratch/inventory_all_files_functions.json');

