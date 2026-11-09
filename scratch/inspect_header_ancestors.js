const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');

const headerIdx = html.indexOf('admin-main-topbar');
console.log(html.slice(headerIdx - 500, headerIdx + 200));

