const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

function printRange(start, end) {
  console.log(`=== Lines ${start}-${end} ===`);
  console.log(lines.slice(start - 1, end).join('\n'));
}

printRange(445, 505);
printRange(1380, 1400);
printRange(1835, 1870);
printRange(1980, 2000);
