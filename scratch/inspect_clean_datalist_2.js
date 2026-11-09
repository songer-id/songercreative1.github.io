const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const dlIdx = pf.indexOf('function bindCleanDatalistPopovers');
console.log(pf.slice(dlIdx + 1800, dlIdx + 3800));

