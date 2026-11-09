const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');

const startDesk = content.indexOf('<aside id="desktop-preview-sidebar"');
const endDesk = content.indexOf('</aside>', startDesk);
console.log('--- DESKTOP ASIDE HTML ---');
console.log(content.substring(startDesk, endDesk + 8));

const startMob = content.indexOf('<div id="mobile-preview-sheet"');
const endMob = content.indexOf('<!-- END MOBILE PREVIEW SHEET -->', startMob);
// Or find where mobile-preview-sheet ends
console.log('--- MOBILE SHEET HTML ---');
console.log(content.substring(startMob, startMob + 2000));
