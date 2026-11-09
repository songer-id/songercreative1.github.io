const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const ids = [
  'cfg-border-radius',
  'cfg-border-radius-mob',
  'cfg-discount-badge-radius',
  'cfg-discount-badge-radius-mob',
  'cfg-countdown-radius',
  'cfg-countdown-radius-mob',
  'cfg-badge-radius',
  'cfg-badge-radius-mob'
];

ids.forEach(id => {
  const pos = pf.indexOf(`id="${id}"`);
  console.log(`=== ${id} at pos ${pos} ===`);
  const start = Math.max(0, pf.lastIndexOf('<div class="flex items-center', pos));
  const end = pf.indexOf('</div>\n                      </div>', pos) || pos + 200;
  console.log(pf.slice(start, end + 20));
  console.log('------------------------------------');
});

