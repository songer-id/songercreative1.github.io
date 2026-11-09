const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');
const css = fs.readFileSync('css/admin.css', 'utf8');
const formJs = fs.readFileSync('js/product-form.js', 'utf8');

console.log('--- ADMIN.HTML ROOT & MAIN VIEWPORT ---');
const vpStart = html.indexOf('<main id="admin-main-viewport"');
console.log(html.slice(vpStart - 400, vpStart + 200));

console.log('\n--- PRODUCT FORM WRAPPER & DRAWER IN JS ---');
const drawerPos = formJs.indexOf('id="mobile-preview-backdrop"');
console.log(formJs.slice(drawerPos - 500, drawerPos + 400));

