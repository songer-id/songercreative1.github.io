const fs = require('fs');
const dbCode = fs.readFileSync('js/db.js', 'utf8');

const createIdx = dbCode.indexOf('createProduct(');
console.log('=== createProduct return in db.js ===');
console.log(dbCode.substring(createIdx + 9500, createIdx + 12000).replace(/\r\n/g, '\n'));

