const fs = require('fs');
const dbCode = fs.readFileSync('js/db.js', 'utf8');

const createIdx = dbCode.indexOf('createProduct(');
console.log('=== createProduct snippet in db.js ===');
console.log(dbCode.substring(createIdx, createIdx + 2000).replace(/\r\n/g, '\n'));

