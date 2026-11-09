const fs = require('fs');

if (fs.existsSync('scratch/find_breadcrumbs.js')) {
  console.log(fs.readFileSync('scratch/find_breadcrumbs.js', 'utf8'));
}

