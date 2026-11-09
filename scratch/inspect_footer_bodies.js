const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const deskFooterStart = pf.indexOf('id="accordion-body-footer"');
const deskFooterEnd = pf.indexOf('<!-- Accordion Group 5', deskFooterStart) !== -1 ? pf.indexOf('<!-- Accordion Group 5', deskFooterStart) : deskFooterStart + 3500;
console.log('--- Desktop Footer Body:');
console.log(pf.slice(deskFooterStart, deskFooterEnd));

const mobFooterStart = pf.indexOf('id="accordion-body-footer-mob"');
const mobFooterEnd = mobFooterStart + 3500;
console.log('--- Mobile Footer Body:');
console.log(pf.slice(mobFooterStart, mobFooterEnd));

