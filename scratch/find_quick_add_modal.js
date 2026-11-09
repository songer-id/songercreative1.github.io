const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log('In admin.html:', html.includes('quick-add-category') || html.includes('modal-quick-add'));
console.log('In product-form.js:', pf.includes('modal-quick-add-category') || pf.includes('quick-add-category'));

const mIdx = pf.indexOf('modal-quick-add-category');
if (mIdx !== -1) {
  console.log(pf.slice(mIdx - 100, mIdx + 200));
}

