const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const db = fs.readFileSync('js/db.js', 'utf8');
const adminApp = fs.readFileSync('js/admin-app.js', 'utf8');
const buyerStore = fs.readFileSync('js/buyer-store.js', 'utf8');
const pdp = fs.readFileSync('js/pdp.js', 'utf8');
const pc = fs.readFileSync('js/pricing-calculator.js', 'utf8');

// Function scanner
function extractFunctions(code, filename) {
  const lines = code.split('\n');
  const fns = [];
  lines.forEach((l, idx) => {
    // Match function foo(...)
    let m = l.match(/(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*function)\s*\(/);
    if (m) {
      const name = m[1] || m[2] || m[3];
      if (name && !['if', 'for', 'while', 'switch', 'catch'].includes(name)) {
        fns.push({ name, file: filename, line: idx + 1, code: l.trim() });
      }
    }
  });
  return fns;
}

const pfFns = extractFunctions(pf, 'js/product-form.js');
const dbFns = extractFunctions(db, 'js/db.js');
const aaFns = extractFunctions(adminApp, 'js/admin-app.js');
const bsFns = extractFunctions(buyerStore, 'js/buyer-store.js');
const pdpFns = extractFunctions(pdp, 'js/pdp.js');
const pcFns = extractFunctions(pc, 'js/pricing-calculator.js');

const allFns = [...pfFns, ...dbFns, ...aaFns, ...bsFns, ...pdpFns, ...pcFns];

console.log(`Extracted functions:
- product-form.js: ${pfFns.length}
- db.js: ${dbFns.length}
- admin-app.js: ${aaFns.length}
- buyer-store.js: ${bsFns.length}
- pdp.js: ${pdpFns.length}
- pricing-calculator.js: ${pcFns.length}
Total: ${allFns.length}`);

// Find duplicate functions inside product-form.js
const pfFnCounts = {};
pfFns.forEach(f => {
  if (!pfFnCounts[f.name]) pfFnCounts[f.name] = [];
  pfFnCounts[f.name].push(f);
});

console.log('\n=== DUPLICATE FUNCTIONS INSIDE product-form.js ===');
Object.keys(pfFnCounts).forEach(name => {
  if (pfFnCounts[name].length > 1) {
    console.log(`Function "${name}" defined ${pfFnCounts[name].length} times:`);
    pfFnCounts[name].forEach(inst => console.log(`  - L${inst.line}: ${inst.code}`));
  }
});

// Find cross-file duplicates
const globalFnCounts = {};
allFns.forEach(f => {
  if (!globalFnCounts[f.name]) globalFnCounts[f.name] = [];
  globalFnCounts[f.name].push(f);
});

console.log('\n=== CROSS-FILE DUPLICATE FUNCTION NAMES ===');
Object.keys(globalFnCounts).forEach(name => {
  const files = new Set(globalFnCounts[name].map(f => f.file));
  if (files.size > 1) {
    console.log(`Function "${name}" defined in multiple files (${files.size} files):`);
    globalFnCounts[name].forEach(inst => console.log(`  - ${inst.file} L${inst.line}`));
  }
});

