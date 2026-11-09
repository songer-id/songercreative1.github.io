const fs = require('fs');
const dbCode = fs.readFileSync('js/db.js', 'utf8');

const matches = [];
let m;
const re = /updateProduct\s*:\s*function|updateProduct\s*\(/g;
while ((m = re.exec(dbCode)) !== null) {
  matches.push({ pos: m.index, snippet: dbCode.substring(m.index, m.index + 1200).replace(/\r\n/g, '\n') });
}
console.log('updateProduct found:', matches);

