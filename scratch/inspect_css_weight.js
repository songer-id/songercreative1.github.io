const fs = require('fs');
const lines = fs.readFileSync('css/admin.css', 'utf8').split('\n');
for (let i = 3480; i <= 3515; i++) {
  if (lines[i-1]) console.log(i + ': ' + lines[i-1]);
}

