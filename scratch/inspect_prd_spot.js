const fs = require('fs');
const lines = fs.readFileSync('docs/PRD_MASTER.md', 'utf8').split('\n');
for (let i = 1155; i <= 1175; i++) {
  console.log(i + ': ' + lines[i-1]);
}

