const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const adminHtml = fs.readFileSync('admin.html', 'utf8');

console.log('=== SEARCHING ICON SELECTOR IN admin.html ===');
const mHtml = adminHtml.match(/(?:footer_badge_icon|footer-badge-icon|pilih-icon|select-icon|icon-picker|footer.*icon)/gi);
console.log('admin.html matches:', mHtml);

console.log('=== SEARCHING ICON SELECTOR IN product-form.js ===');
const mPf = pf.match(/(?:select.*icon|icon.*picker|btn-select-icon|footer-badge-icon|footer-icon-picker)/gi);
console.log('product-form.js matches:', mPf);
