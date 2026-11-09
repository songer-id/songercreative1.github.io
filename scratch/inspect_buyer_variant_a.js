const fs = require('fs');
const lines = fs.readFileSync('js/buyer-store.js', 'utf8').split('\n');
for (let i = 3265; i <= 3290; i++) {
  console.log(i + ': ' + lines[i-1]);
}

