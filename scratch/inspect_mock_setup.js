const fs = require('fs');
const content = fs.readFileSync('scratch/test_card_controls_09c_r4.js', 'utf8');
const lines = content.split('\n');
for (let i = 25; i < 90; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

