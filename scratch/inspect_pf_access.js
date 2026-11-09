const fs = require('fs');
const test04 = fs.readFileSync('scratch/test_preview_bg_04_r1.js', 'utf8');

const lines = test04.split('\n');
lines.forEach((l, i) => {
  if (l.includes('ProductForm')) {
    console.log(`L${i+1}: ${l}`);
  }
});

