const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');

// Search for admin-main-viewport and surrounding tags
const vpIdx = html.indexOf('admin-main-viewport');
console.log('--- admin-main-viewport surrounding in admin.html ---');
console.log(html.slice(Math.max(0, vpIdx - 600), Math.min(html.length, vpIdx + 1200)));

