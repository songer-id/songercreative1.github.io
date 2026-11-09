const fs = require('fs');
const db = fs.readFileSync('js/db.js', 'utf8');

const matches = [];
let idx = 0;
while ((idx = db.indexOf('getFooterTextsHistory()', idx)) !== -1) {
  matches.push(idx);
  idx += 20;
}
console.log('getFooterTextsHistory matches at indices:', matches);
matches.forEach(m => {
  const lineNo = db.slice(0, m).split('\n').length;
  console.log(`Match at line ${lineNo}`);
});
