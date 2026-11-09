const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const idx = pf.indexOf('drawerHtml =');
if (idx !== -1) {
  console.log(pf.slice(idx - 200, idx + 3000));
} else {
  console.log('drawerHtml = not found directly');
  let i = 0;
  while ((i = pf.indexOf('drawerHtml', i)) !== -1) {
    console.log('Match: ' + pf.slice(i - 40, i + 80).replace(/\n/g, ' '));
    i += 10;
  }
}

