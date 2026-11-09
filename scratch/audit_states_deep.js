const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

console.log('=== STATE DECLARATIONS IN product-form.js ===');
lines.forEach((l, idx) => {
  if (l.match(/^\s*(let|const|var)\s+([a-zA-Z0-9_]+State|[a-zA-Z0-9_]+Config|[a-zA-Z0-9_]+Snapshot)\b/)) {
    console.log(`L${idx+1}: ${l.trim()}`);
  }
});

