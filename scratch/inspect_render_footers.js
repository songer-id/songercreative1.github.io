const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const bs = fs.readFileSync('js/buyer-store.js', 'utf8');

function inspectAround(name, content, searchStr, radius = 500) {
  let pos = 0;
  while (true) {
    const idx = content.indexOf(searchStr, pos);
    if (idx === -1) break;
    console.log(`=== ${name} at ${idx} ===`);
    console.log(content.slice(Math.max(0, idx - 100), Math.min(content.length, idx + radius)));
    console.log('='.repeat(40));
    pos = idx + searchStr.length;
  }
}

inspectAround('product-form.js', pf, 'footerIcon');
inspectAround('buyer-store.js', bs, 'footer1Icon');
