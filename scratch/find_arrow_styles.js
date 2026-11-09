const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const css = fs.readFileSync('css/admin.css', 'utf8');

console.log('--- In CSS: search arrow ---');
css.split('\n').forEach((l, i) => {
  if (l.includes('arrow') || l.includes('chevron')) {
    console.log((i+1) + ': ' + l.trim());
  }
});

