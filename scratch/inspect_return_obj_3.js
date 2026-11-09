const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const retIdx = pf.lastIndexOf('return {');
console.log(pf.slice(retIdx + 1600, retIdx + 3000));

