const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const matches = pf.match(/id="[^"]*preview[^"]*"/g) || [];
console.log('Preview IDs in product-form.js:');
[...new Set(matches)].forEach(m => console.log(m));

