const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const snippet = pf.substring(518000, 526000);
const lines = snippet.split('\n');
console.log('Snippet 518000-526000:');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function') || lines[i].includes('const ') || lines[i].includes('let ') || lines[i].includes('live') || lines[i].includes('preview') || lines[i].includes('salesCount') || lines[i].includes('rating')) {
    console.log(`${i}: ${lines[i]}`);
  }
}

