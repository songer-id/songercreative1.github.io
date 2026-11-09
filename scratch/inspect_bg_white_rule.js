const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

const idx = css.indexOf('#view-product-form #step-pane-1>div.bg-white');
console.log(css.slice(idx - 200, idx + 800));

