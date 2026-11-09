const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const mobStart = pf.indexOf('<div id="accordion-body-footer-mob"');
console.log('mobStart:', mobStart);
console.log('=== ACCORDION BODY FOOTER (MOBILE) ===');
console.log(pf.slice(mobStart, mobStart + 3500));
