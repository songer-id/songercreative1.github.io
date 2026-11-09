const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const f1MobIdx = pf.indexOf('input-card-footer-text-mob');
console.log('--- Markup for input-card-footer-text-mob ---');
console.log(pf.slice(f1MobIdx - 200, f1MobIdx + 300));

