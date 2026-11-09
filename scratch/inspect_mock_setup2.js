const fs = require('fs');
const content = fs.readFileSync('scratch/test_card_controls_09c_r4.js', 'utf8');
const lines = content.split('\n');
for (let i = 90; i < 150; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

