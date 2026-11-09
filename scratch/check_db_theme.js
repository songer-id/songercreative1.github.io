const fs = require('fs');

const dbContent = fs.readFileSync('js/db.js', 'utf8');
const lines = dbContent.split('\n');
console.log('Searching in js/db.js for theme...');
lines.forEach((l, i) => {
  if (/theme|body_bg|bodyBg/i.test(l)) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

