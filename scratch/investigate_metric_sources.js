const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log('--- SEARCHING RATING & SALES IN product-form.js ---');

function searchMatches(pattern, maxLen = 300) {
  let matches = [];
  let m;
  while ((m = pattern.exec(pf)) !== null) {
    const start = Math.max(0, m.index - 50);
    const end = Math.min(pf.length, m.index + m[0].length + maxLen);
    matches.push(pf.substring(start, end).replace(/\n\s+/g, ' '));
  }
  return matches;
}

console.log('\n=== formatSalesCount usages ===');
console.log(searchMatches(/formatSalesCount/g, 150));

console.log('\n=== rating usages in render ===');
console.log(searchMatches(/rating|sales_count/g, 100).slice(0, 10));

console.log('\n=== primaryState initialization ===');
const stateMatch = pf.match(/let\s+primaryState\s*=\s*\{[\s\S]*?\};/);
if (stateMatch) {
  console.log(stateMatch[0].substring(0, 500));
}

