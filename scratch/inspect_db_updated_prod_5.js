const fs = require('fs');
const dbCode = fs.readFileSync('js/db.js', 'utf8');

console.log(dbCode.substring(134500, 137000).replace(/\r\n/g, '\n'));

