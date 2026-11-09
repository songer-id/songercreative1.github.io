const fs = require('fs');

// Read product-form.js and inspect the DOM setup and updateProductCardLivePreview logic
const code = fs.readFileSync('js/product-form.js', 'utf8');

console.log('--- Checking getCardConfigFromDOM and cfg resolution ---');
const idx1 = code.indexOf('function getCardConfigFromDOM()');
console.log('getCardConfigFromDOM located at byte', idx1);

const idx2 = code.indexOf('const showSalesChecked = document.getElementById(\'cfg-show-sales\')');
console.log('showSalesChecked located at byte', idx2);
