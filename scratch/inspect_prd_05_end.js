const fs = require('fs');
const prd = fs.readFileSync('docs/PRD_MASTER.md', 'utf8');

const idx = prd.indexOf('SC-ADMIN-LAYOUT-CLEANUP-05');
console.log(prd.slice(idx + 1200, idx + 1800));

