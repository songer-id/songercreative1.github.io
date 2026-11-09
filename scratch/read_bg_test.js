const fs = require('fs');

if (fs.existsSync('scratch/test_preview_bg_04_r1.js')) {
  console.log(fs.readFileSync('scratch/test_preview_bg_04_r1.js', 'utf8'));
}

