const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

const suspects = [
  'transform',
  'perspective',
  'filter',
  'contain',
  'will-change',
  'backdrop-filter'
];

suspects.forEach(prop => {
  let idx = 0;
  console.log(`\n=== Properties for: ${prop} ===`);
  while ((idx = css.indexOf(prop, idx)) !== -1) {
    const snippet = css.slice(Math.max(0, idx - 60), Math.min(css.length, idx + 100));
    if (snippet.includes('admin-main') || snippet.includes('view-product-form') || snippet.includes('form-container') || snippet.includes('product-form-wrapper')) {
      console.log(snippet.replace(/\n/g, ' '));
    }
    idx += prop.length;
  }
});

