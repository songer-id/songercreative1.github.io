const fs = require('fs');
const lines = fs.readFileSync('css/admin.css', 'utf8').split('\n');

console.log('--- css/admin.css lines 1648-1683 ---');
for (let i = 1648; i <= 1683; i++) {
  console.log(i + ': ' + lines[i-1]);
}

console.log('--- css/admin.css lines 3485-3510 ---');
for (let i = 3485; i <= 3510; i++) {
  if (lines[i-1]) console.log(i + ': ' + lines[i-1]);
}

