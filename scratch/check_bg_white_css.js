const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

let idx = 0;
while ((idx = css.indexOf('.bg-white', idx)) !== -1) {
  console.log(css.slice(Math.max(0, idx - 50), Math.min(css.length, idx + 100)));
  idx += '.bg-white'.length;
}

