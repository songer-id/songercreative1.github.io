const fs = require('fs');
const dbCode = fs.readFileSync('js/db.js', 'utf8');

const createIdx = dbCode.indexOf('createProduct(');
console.log('=== createProduct very very end in db.js ===');
console.log(dbCode.substring(createIdx + 7000, createIdx + 9500).replace(/\r\n/g, '\n'));

