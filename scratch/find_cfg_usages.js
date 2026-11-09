const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split(/\r?\n/);

console.log('Total lines:', lines.length);

// Let's search for lines containing `cfg.` or `cfg[` or ` cfg ` or `(cfg` or `, cfg` or `cfg,` or `!cfg`
const usages = [];
lines.forEach((line, idx) => {
  if (/\bcfg\b/.test(line)) {
    usages.push({ lineNum: idx + 1, text: line.trim() });
  }
});

console.log(`Found ${usages.length} lines referencing cfg.`);

// Let's print out the range of lines
const lineNums = usages.map(u => u.lineNum);
console.log('Line number ranges:');
let groupStart = lineNums[0];
let prev = lineNums[0];
for (let i = 1; i < lineNums.length; i++) {
  if (lineNums[i] > prev + 50) {
    console.log(`Range: ${groupStart} - ${prev}`);
    groupStart = lineNums[i];
  }
  prev = lineNums[i];
}
console.log(`Range: ${groupStart} - ${prev}`);

