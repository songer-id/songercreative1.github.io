const fs = require('fs');
const testJs = fs.readFileSync('scratch/test_layout_cleanup_05.js', 'utf8');

const lines = testJs.split('\n');
lines.forEach((l, i) => {
  if (l.includes('top-bar') || l.includes('topbar') || l.includes('breadcrumb')) {
    console.log(`L${i+1}: ${l}`);
  }
});

