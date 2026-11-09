const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const subIdx = pf.indexOf('function syncFeatureSubpanels()');
console.log('=== syncFeatureSubpanels & surrounding code ===');
console.log(pf.substring(subIdx, subIdx + 4500));

