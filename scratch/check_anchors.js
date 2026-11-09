const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');

const checks = [
  'id="cfg-discount-badge-position-group"',
  'id="cfg-discount-badge-position-group-mob"',
  'function setDiscountBadgePosition(pos) {',
  "const ticketHintDesk = document.getElementById('cfg-ticket-promo-hint');",
  '// Discount Badge Position Buttons (Desktop & Mobile Sync)',
  "if (pEndInp) pEndInp.addEventListener('change',"
];

checks.forEach(c => {
  console.log(c, '=>', content.includes(c));
});

