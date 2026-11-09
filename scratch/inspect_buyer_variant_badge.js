const fs = require('fs');
const lines = fs.readFileSync('js/buyer-store.js', 'utf8').split('\n');

console.log('--- buyer-store.js lines 3295-3315 ---');
for (let i = 3295; i <= 3315; i++) {
  console.log(i + ': ' + lines[i-1]);
}

console.log('--- buyer-store.js lines 3565-3585 ---');
for (let i = 3565; i <= 3585; i++) {
  console.log(i + ': ' + lines[i-1]);
}

