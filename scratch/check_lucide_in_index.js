const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const lines = indexHtml.split('\n');
lines.forEach((l, i) => {
  if (l.includes('lucide') || l.includes('icons')) {
    console.log(`index.html:${i+1}: ${l.trim()}`);
  }
});
