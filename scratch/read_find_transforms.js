const fs = require('fs');

if (fs.existsSync('scratch/find_transforms.js')) {
  console.log(fs.readFileSync('scratch/find_transforms.js', 'utf8'));
}

