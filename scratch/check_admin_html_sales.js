const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');

console.log('admin.html has cfg-show-sales:', html.includes('cfg-show-sales'));
console.log('admin.html has cfg-show-sales-mob:', html.includes('cfg-show-sales-mob'));

