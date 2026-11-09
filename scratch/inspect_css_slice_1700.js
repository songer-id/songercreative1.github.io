const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');
const lines = css.split('\n');
console.log(lines.slice(1665, 1725).join('\n'));

