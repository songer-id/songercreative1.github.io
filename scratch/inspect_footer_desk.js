const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const deskStart = pf.indexOf('<div id="accordion-body-footer"');
console.log('deskStart:', deskStart);
// Let's find the closing tag for accordion-body-footer
const nextAccordion = pf.indexOf('accordion-group-', deskStart + 20);
console.log('nextAccordion:', nextAccordion);
console.log('=== ACCORDION BODY FOOTER (DESKTOP) ===');
console.log(pf.slice(deskStart, nextAccordion > 0 ? nextAccordion : deskStart + 3000));
