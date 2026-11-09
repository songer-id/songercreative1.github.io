const fs = require('fs');
const content = fs.readFileSync('scratch/test_runtime_09a_r1.js', 'utf8');
console.log(content.slice(0, 1500));
