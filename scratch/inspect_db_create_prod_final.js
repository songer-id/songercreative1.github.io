const fs = require('fs');
const dbCode = fs.readFileSync('js/db.js', 'utf8');

const createIdx = dbCode.indexOf('createProduct(');
console.log('=== createProduct very end in db.js ===');
console.log(dbCode.substring(createIdx + 4500, createIdx + 7000).replace(/\r\n/g, '\n'));

