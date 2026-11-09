const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const snippet = pf.substring(510000, 514500);
const lines = snippet.split('\n');
console.log('Snippet 510000-514500:');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function') || lines[i].includes('update') || lines[i].includes('preview') || lines[i].includes('render')) {
    console.log(`${i}: ${lines[i]}`);
  }
}

