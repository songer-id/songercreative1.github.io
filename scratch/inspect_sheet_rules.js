const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

// Find any rule containing sheet or drawer or mob
const lines = css.split('\n');
lines.forEach((l, i) => {
  if ((l.includes('sheet') || l.includes('drawer') || l.includes('preview')) && (l.includes('{') || l.includes(':') || l.includes(','))) {
    if (!l.includes('mini-pdp') && !l.includes('shopee')) {
      console.log(`css:${i+1}: ${l.trim()}`);
    }
  }
});

