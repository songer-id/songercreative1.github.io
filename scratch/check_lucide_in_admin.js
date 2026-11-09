const fs = require('fs');

const adminHtml = fs.readFileSync('admin.html', 'utf8');
const lines = adminHtml.split('\n');
lines.forEach((l, i) => {
  if (l.includes('lucide') || l.includes('icons')) {
    console.log(`admin.html:${i+1}: ${l.trim()}`);
  }
});
