const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const targetIdx = 512000;
const preceding = pf.substring(490000, targetIdx);
const fnMatches = [...preceding.matchAll(/(function\s+[a-zA-Z0-9_]+\s*\([^)]*\)|const\s+[a-zA-Z0-9_]+\s*=\s*(?:function|\([^)]*\)\s*=>))/g)];
for (const m of fnMatches) {
  console.log(m[0]);
}

