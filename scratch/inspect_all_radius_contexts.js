const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

['cfg-border-radius', 'cfg-discount-badge-radius', 'cfg-countdown-radius', 'cfg-badge-radius'].forEach(id => {
  const deskIdx = pf.indexOf(`id="${id}"`);
  console.log(`=== ${id} (Desktop) ===`);
  console.log(pf.slice(deskIdx - 150, deskIdx + 300));

  const mobIdx = pf.indexOf(`id="${id}-mob"`);
  console.log(`=== ${id}-mob (Mobile) ===`);
  console.log(pf.slice(mobIdx - 150, mobIdx + 300));
});

