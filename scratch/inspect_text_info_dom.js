const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Desktop Teks & Informasi
const deskStart = pf.indexOf('id="accordion-group-text-info"');
const deskEnd = pf.indexOf('id="accordion-group-badge"', deskStart);
console.log('=== Desktop Text & Info Accordion ===');
console.log(pf.substring(deskStart, deskEnd));

// Mobile Teks & Informasi
const mobStart = pf.indexOf('id="accordion-group-text-info-mob"');
const mobEnd = pf.indexOf('id="accordion-group-badge-mob"', mobStart);
console.log('=== Mobile Text & Info Accordion ===');
console.log(pf.substring(mobStart, mobEnd));

