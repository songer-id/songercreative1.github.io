const fs = require('fs');

// Create minimal test harness for updateProductCardLivePreview
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Let's inspect the exact lines where cardHtml is built in updateProductCardLivePreview
const idxA = pf.indexOf("if (variant === 'B')");
const idxEnd = pf.indexOf("// SIMULASI MINI PDP DETAIL PRODUK");
console.log('Card rendering code length:', idxEnd - idxA);
