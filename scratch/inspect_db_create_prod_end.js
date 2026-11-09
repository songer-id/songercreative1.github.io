const fs = require('fs');
const dbCode = fs.readFileSync('js/db.js', 'utf8');

const createIdx = dbCode.indexOf('createProduct(');
console.log('=== createProduct end in db.js ===');
console.log(dbCode.substring(createIdx + 2000, createIdx + 4500).replace(/\r\n/g, '\n'));

