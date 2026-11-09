const fs = require('fs');
const lines = fs.readFileSync('admin.html', 'utf8').split('\n');

for (let i = 130; i <= 170; i++) {
  console.log(i + ': ' + lines[i-1]);
}

