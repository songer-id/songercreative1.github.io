const fs = require('fs');
const db = fs.readFileSync('js/db.js', 'utf8');

const fnIdx = db.indexOf('getFooterTextsHistory');
console.log(db.slice(fnIdx + 400, fnIdx + 1200));

