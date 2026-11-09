const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Let's find all accordion triggers in pf
const triggers = pf.match(/class=\"[^\"]*card-accordion-trigger[^\"]*\"/g) || [];
console.log('Accordion trigger classes:');
triggers.slice(0, 10).forEach(t => console.log(t));

// Let's find labels in desktop section
const deskStart = pf.indexOf('id=\"card-customization-section\"');
const deskEnd = pf.indexOf('id=\"card-customization-section-mob\"');
const deskMarkup = pf.slice(deskStart, deskEnd);

console.log('--- Desktop labels with font- or bold:');
const deskLabels = deskMarkup.match(/<label[^>]*class=\"[^\"]*\"[^>]*>/g) || [];
deskLabels.slice(0, 15).forEach(l => console.log(l));

// Let's find buttons in desktop section
console.log('--- Desktop buttons with font- or bold:');
const deskButtons = deskMarkup.match(/<button[^>]*class=\"[^\"]*\"[^>]*>/g) || [];
deskButtons.slice(0, 15).forEach(b => console.log(b));

