const fs = require('fs');

const buyerStore = fs.readFileSync('js/buyer-store.js', 'utf8');
const pdp = fs.readFileSync('js/pdp.js', 'utf8');
const adminApp = fs.readFileSync('js/admin-app.js', 'utf8');
const prodList = fs.readFileSync('js/product-list.js', 'utf8');

console.log('=== BUYER STORE CARD RENDERING ===');
const bsLines = buyerStore.split('\n');
bsLines.forEach((l, idx) => {
  if (l.match(/renderProductCard|renderCardVariant|card_variant|Model A|Model B|Model C/i)) {
    console.log(`buyer-store.js L${idx+1}: ${l.trim()}`);
  }
});

console.log('\n=== PDP PRODUCT DATA CONSUMPTION ===');
const pdpLines = pdp.split('\n');
pdpLines.forEach((l, idx) => {
  if (l.match(/getProductById|initProductDetail|loadProduct|product_type|pricing_model|calculate/i)) {
    console.log(`pdp.js L${idx+1}: ${l.trim()}`);
  }
});

