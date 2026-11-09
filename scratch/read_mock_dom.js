const fs = require('fs');
const content = fs.readFileSync('scratch/test_card_editor_09a_r1.js', 'utf8');
console.log(content.slice(0, 1500));
