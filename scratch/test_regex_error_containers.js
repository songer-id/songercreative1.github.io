const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');

const regexF1Desk = /(<label for="input-card-footer-text-side"[\s\S]*?<input type="text" id="input-card-footer-text-side"[\s\S]*?<\/div>\s*<\/div>)/;
console.log('regexF1Desk matches:', regexF1Desk.test(pf));

const regexF2Desk = /(<label for="input-card-footer-2-text-side"[\s\S]*?<input type="text" id="input-card-footer-2-text-side"[\s\S]*?<\/div>\s*<\/div>)/;
console.log('regexF2Desk matches:', regexF2Desk.test(pf));

const regexF1Mob = /(<label for="input-card-footer-text-mob"[\s\S]*?<input type="text" id="input-card-footer-text-mob"[\s\S]*?<\/div>\s*<\/div>)/;
console.log('regexF1Mob matches:', regexF1Mob.test(pf));

const regexF2Mob = /(<label for="input-card-footer-2-text-mob"[\s\S]*?<input type="text" id="input-card-footer-2-text-mob"[\s\S]*?<\/div>\s*<\/div>)/;
console.log('regexF2Mob matches:', regexF2Mob.test(pf));

