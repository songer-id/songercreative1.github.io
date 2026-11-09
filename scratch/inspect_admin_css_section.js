const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');
const lines = css.split('\n');

for (let i = 3480; i < 3530; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

