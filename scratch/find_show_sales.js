const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
pf.split('\n').forEach((l, i) => {
  if (l.includes('show_sales')) {
    console.log(i + 1, l);
  }
});
