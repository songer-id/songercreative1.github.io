const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const deskStart = pf.indexOf('id="accordion-body-footer"');
const deskBefore = pf.lastIndexOf('<div', deskStart);
const deskAfter = pf.indexOf('<!-- Accordion Group 5', deskStart);
// if not Accordion Group 5, what's next?
const nextGroup = pf.indexOf('<!-- Accordion Group', deskStart + 50);
console.log('Desk start:', deskStart, 'Next group:', nextGroup);
console.log(pf.slice(deskStart, nextGroup !== -1 ? nextGroup : deskStart + 6000));

