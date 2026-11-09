const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

let idx = 0;
while ((idx = css.indexOf('card-customization', idx)) !== -1) {
  console.log('Found at line:', css.slice(0, idx).split('\n').length);
  console.log(css.slice(Math.max(0, idx - 200), Math.min(css.length, idx + 400)));
  console.log('==============================');
  idx += 18;
}

