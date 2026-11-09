const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

function showSection(startPattern, endPattern) {
  const start = pf.indexOf(startPattern);
  const end = pf.indexOf(endPattern, start);
  console.log(`=== ${startPattern} (${start} - ${end}) ===`);
  console.log(pf.substring(start, end));
}

showSection('id="accordion-group-text-info"', 'id="accordion-group-promo"');
showSection('id="accordion-group-text-info-mob"', 'id="accordion-group-promo-mob"');

