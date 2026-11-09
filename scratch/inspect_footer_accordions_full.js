const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// desktop
const deskStart = pf.indexOf('<div id="accordion-body-footer"');
const deskEnd = pf.indexOf('<!-- Accordion Group 6: Mode', deskStart);
console.log('=== DESKTOP FOOTER ACCORDION ===');
console.log(pf.slice(deskStart, deskEnd));

// mob
const mobStart = pf.indexOf('<div id="accordion-body-footer-mob"');
const mobEnd = pf.indexOf('<!-- Accordion Group 6: Mode', mobStart);
console.log('=== MOBILE FOOTER ACCORDION ===');
console.log(pf.slice(mobStart, mobEnd));
