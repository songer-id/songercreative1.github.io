const fs = require('fs');
const dbCode = fs.readFileSync('js/db.js', 'utf8');

console.log(dbCode.substring(128500, 130000).replace(/\r\n/g, '\n'));

