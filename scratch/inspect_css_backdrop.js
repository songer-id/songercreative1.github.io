const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

console.log(css.slice(51500, 52500));

