const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');
const lines = css.split('\n');

for (let i = 2340; i >= 0; i--) {
  if (lines[i].includes('@media')) {
    console.log(`Media query at line ${i+1}: ${lines[i]}`);
    break;
  }
}

