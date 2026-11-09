const fs = require('fs');

const bs = fs.readFileSync('js/buyer-store.js', 'utf8');

const idx = bs.indexOf('renderCardVariantC(prod');
console.log(bs.substring(idx + 1800, idx + 4500));
