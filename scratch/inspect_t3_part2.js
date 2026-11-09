const fs = require('fs');
if (fs.existsSync('scratch/test_preview_layout_03.js')) {
  const t3 = fs.readFileSync('scratch/test_preview_layout_03.js', 'utf8');
  console.log(t3.slice(1000, 2500));
}

