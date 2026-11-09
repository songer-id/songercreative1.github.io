const fs = require('fs');
const prd = fs.readFileSync('docs/PRD_MASTER.md', 'utf8');

const idx = prd.indexOf('SC-ADMIN-LAYOUT-CLEANUP-05');
if (idx !== -1) {
  console.log(prd.slice(idx - 100, idx + 800));
} else {
  console.log('SC-ADMIN-LAYOUT-CLEANUP-05 not found');
}

