const fs = require('fs');
const ah = fs.readFileSync('admin.html', 'utf8');
ah.split('\n').slice(0, 50).forEach((l, i) => {
  if (l.includes('<link') || l.includes('<style') || l.includes('<script')) {
    console.log(i+1, l.trim());
  }
});
