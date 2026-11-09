const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

function showSection(id, endId) {
  const start = pf.indexOf(id);
  const end = pf.indexOf(endId, start);
  console.log(`=== ${id} (${start} - ${end}) ===`);
  console.log(pf.substring(start, end));
}

showSection('id="accordion-group-text-info"', 'id="accordion-group-badge"');
showSection('id="accordion-group-text-info-mob"', 'id="accordion-group-badge-mob"');

