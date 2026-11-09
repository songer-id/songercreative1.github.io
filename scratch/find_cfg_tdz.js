const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split(/\r?\n/);

console.log('Finding all declarations of cfg...');
lines.forEach((line, idx) => {
  if (/\b(const|let|var)\s+cfg\b/.test(line)) {
    console.log(`Decl at line ${idx + 1}: ${line.trim()}`);
  }
});

console.log('\nScanning for functions containing cfg...');
// Let's find functions where cfg is used
let currentFn = 'global';
let fnStart = 0;
let scopeLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const fnMatch = line.match(/function\s+([a-zA-Z0-9_]+)/);
  if (fnMatch) {
    currentFn = fnMatch[1];
    fnStart = i + 1;
  }
  if (/\bcfg\b/.test(line)) {
    // console.log(`Line ${i + 1} in [${currentFn}]: ${line.trim()}`);
  }
}

