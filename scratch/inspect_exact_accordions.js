const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

function showContext(needle, len = 600) {
  const idx = pf.indexOf(needle);
  if (idx !== -1) {
    console.log(`=== FOUND "${needle}" at index ${idx} ===`);
    console.log(pf.slice(idx, idx + len));
  } else {
    console.log(`NOT FOUND: "${needle}"`);
  }
}

showContext('id="accordion-body-footer"');
showContext('id="accordion-body-footer-mob"');

