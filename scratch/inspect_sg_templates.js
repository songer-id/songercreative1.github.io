const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

const tplIdx = pf.indexOf('defaultSizeGuideTemplates');
console.log('=== defaultSizeGuideTemplates ===');
console.log(pf.slice(tplIdx, tplIdx + 1200));

const dlIdx = pf.indexOf('datalist-size-col-titles');
console.log('\n=== datalist-size-col-titles ===');
console.log(pf.slice(dlIdx - 100, dlIdx + 800));

