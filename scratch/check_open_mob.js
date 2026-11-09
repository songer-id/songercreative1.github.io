const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');

const s = content.indexOf('openMobilePreview = function');
console.log(content.slice(s, s + 1000));

