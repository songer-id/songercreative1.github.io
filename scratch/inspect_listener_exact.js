/**
 * Test actual handlers in product-form.js
 */
const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log('Checking event listener bindings in bindFormEvents...');
const match = pf.match(/\['show-rating', 'show-sales'[\s\S]*?markCardDesignAsCustom\(\);[\s\S]*?\}\);/);
if (match) {
  console.log(match[0]);
}
