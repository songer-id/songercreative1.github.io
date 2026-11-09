const fs = require('fs');

const adminCss = fs.readFileSync('css/admin.css', 'utf8');
const lines = adminCss.split('\n');

console.log('Searching css/admin.css for background rules on preview containers:');
lines.forEach((l, i) => {
  if (l.includes('desktop-preview') || l.includes('mobile-preview') || l.includes('preview-container') || l.includes('card-live-preview')) {
    console.log(`L${i+1}: ${l}`);
  }
});

