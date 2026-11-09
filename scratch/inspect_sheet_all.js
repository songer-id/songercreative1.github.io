const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const start = pf.indexOf('<div id="mobile-preview-sheet"');
const end = pf.indexOf('</main>', start);
console.log(pf.slice(start, start + 3000));

