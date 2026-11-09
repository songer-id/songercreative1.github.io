const fs = require('fs');
const dbCode = fs.readFileSync('js/db.js', 'utf8');

console.log(dbCode.substring(126384, 128500).replace(/\r\n/g, '\n'));

