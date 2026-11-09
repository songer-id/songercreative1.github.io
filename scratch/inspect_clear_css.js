const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

let idx = 0;
while ((idx = css.indexOf('.btn-clear-datalist', idx)) !== -1) {
  console.log(css.slice(Math.max(0, idx - 100), Math.min(css.length, idx + 200)));
  console.log('---');
  idx += '.btn-clear-datalist'.length;
}

