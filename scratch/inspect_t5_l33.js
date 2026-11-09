const fs = require('fs');
const t5 = fs.readFileSync('scratch/test_layout_cleanup_05.js', 'utf8');
const lines = t5.split('\n');
console.log(lines.slice(20, 45).join('\n'));

