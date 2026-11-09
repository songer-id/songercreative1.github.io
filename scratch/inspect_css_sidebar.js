const fs = require('fs');
const lines = fs.readFileSync('css/admin.css', 'utf8').split('\n');

console.log('--- css/admin.css lines 830-850 ---');
for (let i = 830; i <= 850; i++) {
  if (lines[i-1]) console.log(i + ': ' + lines[i-1]);
}

console.log('--- css/admin.css lines 1645-1695 ---');
for (let i = 1645; i <= 1695; i++) {
  if (lines[i-1]) console.log(i + ': ' + lines[i-1]);
}

