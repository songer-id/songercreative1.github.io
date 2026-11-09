const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log('=== saveDraftToStorage snippet ===');
console.log(pf.substring(97900, 99500));

console.log('\n=== handleSaveCardDesign snippet ===');
console.log(pf.substring(279200, 281500));

