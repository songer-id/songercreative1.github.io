const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');
const head = html.slice(0, html.indexOf('</head>'));
console.log(head);

