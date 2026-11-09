const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log('File size:', pf.length);

// Check primaryState initial
console.log('primaryState initial match:', pf.includes("card_footer_text: 'Proses Hanya Dalam 1Jam',"));

// Check getLastProductFooterConfig match
console.log('getLastProductFooterConfig match:', pf.includes("text: p.card_footer_text || 'Proses Hanya Dalam 1Jam',"));

// Check resetProductFormState match
console.log('resetProductFormState match:', pf.includes("text: 'Proses Hanya Dalam 1Jam',"));

// Check loadProductForEdit match
console.log('loadProductForEdit match:', pf.includes("text: prod.card_footer_text || 'Proses Hanya Dalam 1Jam',"));

// Check accordion-body-footer
console.log('accordion-body-footer match:', pf.includes('id="accordion-body-footer"'));

// Check accordion-body-footer-mob
console.log('accordion-body-footer-mob match:', pf.includes('id="accordion-body-footer-mob"'));

