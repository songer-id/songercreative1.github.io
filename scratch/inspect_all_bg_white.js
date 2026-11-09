const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

let idx = 0;
while ((idx = css.indexOf('.bg-white', idx)) !== -1) {
  console.log('--- Match at', idx, '---');
  console.log(css.slice(Math.max(0, idx - 150), Math.min(css.length, idx + 250)));
  idx += '.bg-white'.length;
}

