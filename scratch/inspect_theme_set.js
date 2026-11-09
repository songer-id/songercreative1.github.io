const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const idx = pf.indexOf('if (mobSheet) mobSheet.style.backgroundColor = themeBodyColor;');
console.log(pf.slice(idx - 150, idx + 400));

