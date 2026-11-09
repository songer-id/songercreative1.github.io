const fs = require('fs');
const lines = fs.readFileSync('js/db.js', 'utf8').split('\n');
for (let i = 750; i <= 770; i++) {
  console.log(i + ': ' + lines[i-1]);
}

