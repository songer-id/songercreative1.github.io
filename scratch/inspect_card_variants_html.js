const fs = require('fs');

// Let's inspect cardHtml for variant A, B, C
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Search for variant === 'B'
const bIdx = pf.indexOf("if (variant === 'B')");
console.log(pf.slice(bIdx, bIdx + 3000));

