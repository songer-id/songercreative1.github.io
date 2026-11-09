const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
pf.split('\n').forEach((l, i) => {
  if (l.includes('cfg-show-sales') && i > 26000 && i < 28000) {
    console.log(i+1, l);
  }
});

