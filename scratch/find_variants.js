const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

for (let i = 9480; i < 9690; i++) {
  if (pf[i].includes('variant ===') || pf[i].includes('variant ==')) {
    console.log((i + 1) + ': ' + pf[i]);
  }
}

