const fs = require('fs');

const prd = fs.readFileSync('docs/PRD_MASTER.md', 'utf8');
const lines = prd.split('\n');

console.log(lines.slice(1400, 1441).join('\n'));

