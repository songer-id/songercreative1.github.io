const fs = require('fs');
const lines = fs.readFileSync('js/db.js', 'utf8').split('\n');
for (let i = 1850; i <= 1875; i++) {
  console.log(i + ': ' + lines[i-1]);
}

