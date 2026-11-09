const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
console.log('Has CRLF:', pf.includes('\r\n'));

