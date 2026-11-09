const fs = require('fs');
const content = fs.readFileSync('docs/PRD_PRODUCT_MASTER.md', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('hpp') || line.toLowerCase().includes('cost_price') || line.includes('0.6') || line.includes('60%')) {
    console.log((idx+1) + ': ' + line.trim());
  }
});

