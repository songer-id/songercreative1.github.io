const fs = require('fs');

const prd = fs.readFileSync('docs/PRD_MASTER.md', 'utf8');
const lines = prd.split('\n');

console.log('Total lines in PRD_MASTER.md:', lines.length);
console.log('Last 40 lines:');
console.log(lines.slice(-40).join('\n'));
