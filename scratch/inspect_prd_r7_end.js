const fs = require('fs');
const prd = fs.readFileSync('docs/PRD_MASTER.md', 'utf8');

const r7Idx = prd.indexOf('SC-ADMIN-CARD-MOBILE-TYPOGRAPHY-09C-R7');
console.log(prd.substring(r7Idx + 1500, r7Idx + 3000));

