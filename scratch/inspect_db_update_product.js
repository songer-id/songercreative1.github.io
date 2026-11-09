const fs = require('fs');
const dbCode = fs.readFileSync('js/db.js', 'utf8');

const updateIdx = dbCode.indexOf('updateProduct:');
console.log('=== DB.updateProduct definition in db.js ===');
console.log(dbCode.substring(updateIdx, updateIdx + 1500));

