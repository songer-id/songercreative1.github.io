const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

const idx = css.indexOf('TASK 12A');
console.log(css.slice(idx - 100, idx + 1000));

