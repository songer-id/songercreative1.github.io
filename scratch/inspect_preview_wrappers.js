const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const deskPos = pf.indexOf('id="card-live-preview-box"');
console.log('=== Desktop preview wrapper ===');
console.log(pf.substring(deskPos - 500, deskPos + 300));

const mobPos = pf.indexOf('id="mobile-card-preview-container"');
console.log('=== Mobile preview wrapper ===');
console.log(pf.substring(mobPos - 500, mobPos + 300));

