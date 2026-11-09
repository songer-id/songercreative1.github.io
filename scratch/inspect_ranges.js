const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split(/\r?\n/);

const ranges = [
  [2633, 3604],
  [3838, 3871],
  [3992, 4486],
  [4570, 4630],
  [6863, 6864],
  [7882, 7883],
  [9068, 9069],
  [9188, 9574],
  [9626, 9688],
  [20852, 20853],
  [26932, 26995],
  [27060, 27060],
  [27113, 27590],
  [27646, 27658],
  [29791, 29797]
];

ranges.forEach(([start, end]) => {
  // Find enclosing function
  let enclosingFn = 'global';
  for (let i = start - 1; i >= 0; i--) {
    const m = lines[i].match(/function\s+([a-zA-Z0-9_]+)/);
    if (m) {
      enclosingFn = `${m[1]} (line ${i + 1})`;
      break;
    }
  }
  console.log(`\n=== Range ${start} - ${end} in ${enclosingFn} ===`);
  for (let i = start - 1; i <= Math.min(start + 5, end - 1); i++) {
    if (/\bcfg\b/.test(lines[i])) {
      console.log(`  Line ${i + 1}: ${lines[i].trim().slice(0, 80)}`);
    }
  }
});

