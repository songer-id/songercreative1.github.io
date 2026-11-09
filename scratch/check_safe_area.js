const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const css = fs.readFileSync('css/admin.css', 'utf8');

console.log('product-form.js safe-area:', pf.includes('safe-area-inset-bottom'));
console.log('admin.css safe-area:', css.includes('safe-area-inset-bottom'));

if (css.includes('safe-area-inset-bottom')) {
  let idx = 0;
  while ((idx = css.indexOf('safe-area-inset-bottom', idx)) !== -1) {
    console.log(css.slice(Math.max(0, idx - 60), Math.min(css.length, idx + 100)));
    idx += 'safe-area-inset-bottom'.length;
  }
}

