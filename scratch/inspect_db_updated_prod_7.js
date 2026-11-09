const fs = require('fs');
const dbCode = fs.readFileSync('js/db.js', 'utf8');

console.log(dbCode.substring(139500, 142000).replace(/\r\n/g, '\n'));

