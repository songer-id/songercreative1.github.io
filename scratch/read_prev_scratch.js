const fs = require('fs');

if (fs.existsSync('scratch/check_ancestors.js')) {
  console.log('=== check_ancestors.js ===');
  console.log(fs.readFileSync('scratch/check_ancestors.js', 'utf8'));
}
if (fs.existsSync('scratch/check_containers.js')) {
  console.log('=== check_containers.js ===');
  console.log(fs.readFileSync('scratch/check_containers.js', 'utf8'));
}

