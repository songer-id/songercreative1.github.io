const fs = require('fs');
const adminApp = fs.readFileSync('js/admin-app.js', 'utf8');
const lines = adminApp.split('\n');

console.log('=== POS PRODUCT CONSUMPTION IN ADMIN-APP.JS ===');
lines.forEach((l, idx) => {
  if (l.match(/renderPosProducts|posCart|addToCart|posCheckout|loadPosProducts|openPosCalculator/i)) {
    console.log(`admin-app.js L${idx+1}: ${l.trim()}`);
  }
});

