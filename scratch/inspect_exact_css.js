const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

const idx = css.indexOf('#mobile-preview-backdrop');
console.log(JSON.stringify(css.slice(idx - 100, idx + 350)));

