const fs = require('fs');
const dbCode = fs.readFileSync('js/db.js', 'utf8');

console.log(dbCode.substring(137000, 139500).replace(/\r\n/g, '\n'));

