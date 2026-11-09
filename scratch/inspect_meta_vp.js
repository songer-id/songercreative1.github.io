const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');

const vpMetaIdx = html.indexOf('name="viewport"');
console.log(html.slice(vpMetaIdx - 30, vpMetaIdx + 120));

