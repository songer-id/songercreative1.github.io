const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');

const sIdx = html.indexOf('sidebar-mobile-backdrop');
console.log(html.slice(sIdx - 300, sIdx + 500));

