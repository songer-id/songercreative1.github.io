const fs = require('fs');

// Let's inspect how bindCleanDatalistPopovers works on mock elements
// We can use the mock DOM from scratch/test_footer_product_labels_12b.js
const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log('Inspecting bindCleanDatalistPopovers function implementation:');
const start = pf.indexOf('function bindCleanDatalistPopovers');
const end = pf.indexOf('function syncSizeGuideStateFromDOM');
console.log(pf.slice(start, start + 800));

