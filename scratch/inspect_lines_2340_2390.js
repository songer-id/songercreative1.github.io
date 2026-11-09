const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');
const lines = css.split('\n');
console.log('--- Lines 2340-2390 in css/admin.css:');
for (let i = 2340; i < 2390; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

