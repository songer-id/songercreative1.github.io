const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('function formatSalesCount');
console.log('=== formatSalesCount definition ===');
console.log(pf.substring(idx - 50, idx + 800));

// Cari nama fungsi yang membungkus pemanggilan formatSalesCount
const usages = [];
let pos = 0;
while ((pos = pf.indexOf('formatSalesCount(', pos)) !== -1) {
  // cari fungsi terdekat di atasnya
  const preceding = pf.substring(Math.max(0, pos - 2000), pos);
  const fnMatch = [...preceding.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\(/g)];
  const constFnMatch = [...preceding.matchAll(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:function|\([^)]*\)\s*=>)/g)];
  const lastFn = fnMatch.length > 0 ? fnMatch[fnMatch.length - 1][1] : 'unknown';
  const lastConstFn = constFnMatch.length > 0 ? constFnMatch[constFnMatch.length - 1][1] : 'unknown';
  usages.push({ pos, lastFn, lastConstFn, snippet: pf.substring(pos - 100, pos + 250).replace(/\n\s+/g, ' ') });
  pos += 17;
}

console.log('=== Usages of formatSalesCount ===');
console.log(JSON.stringify(usages, null, 2));

