const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const db = fs.readFileSync('js/db.js', 'utf8');

// 1. Extract primaryState default object definition
const primaryStateBlockMatch = pf.match(/let\s+primaryState\s*=\s*(\{[\s\S]*?\n\s*\};)/);
if (!primaryStateBlockMatch) {
  console.error('primaryState definition not found!');
  process.exit(1);
}

const lines = primaryStateBlockMatch[1].split('\n');
const properties = [];
let currentNested = null;

lines.forEach((line, idx) => {
  const lineTrimmed = line.trim();
  // Check for property declaration like name: '', or shipping_config: (function() {
  const propMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*:\s*(.*)/);
  if (propMatch) {
    const key = propMatch[1];
    let rawVal = propMatch[2].trim().replace(/,$/, '');
    properties.push({
      key,
      rawVal,
      lineInBlock: idx + 1
    });
  }
});

console.log(`Found ${properties.length} direct properties in primaryState block.`);

// For each property, scan usage in product-form.js and db.js
const results = properties.map(p => {
  const key = p.key;
  // Count usages in pf
  const regex = new RegExp(`\\bprimaryState\\.${key}\\b`, 'g');
  const matchesInPf = (pf.match(regex) || []).length;

  // Check if saved in db.js
  const inDbRegex = new RegExp(`\\b(productData|newProduct|updatedProduct)\\.${key}\\b`, 'g');
  const matchesInDb = (db.match(inDbRegex) || []).length;

  // Check write locations (assignment to primaryState.key)
  const assignRegex = new RegExp(`primaryState\\.${key}\\s*=`, 'g');
  const writesCount = (pf.match(assignRegex) || []).length;

  return {
    key,
    defaultValue: p.rawVal,
    totalUsages: matchesInPf,
    writesCount,
    savedInDb: matchesInDb > 0
  };
});

fs.writeFileSync('scratch/inventory_primary_state.json', JSON.stringify(results, null, 2));
console.log('Saved scratch/inventory_primary_state.json');

