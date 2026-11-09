const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const retIdx = pf.lastIndexOf('return {');
console.log(pf.slice(retIdx, retIdx + 600));

