const fs = require('fs');

if (fs.existsSync('scratch/find_bg_elements.js')) {
  console.log(fs.readFileSync('scratch/find_bg_elements.js', 'utf8'));
}

