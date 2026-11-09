const fs = require('fs');
const dbCode = fs.readFileSync('js/db.js', 'utf8');

const matches = [];
let m;
const re = /card_config/g;
while ((m = re.exec(dbCode)) !== null) {
  matches.push({ pos: m.index, snippet: dbCode.substring(m.index - 50, m.index + 200).replace(/\r\n/g, ' ') });
}
console.log('card_config occurrences in db.js:', matches);

