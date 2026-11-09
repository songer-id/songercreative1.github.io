const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');
const lines = css.split('\n');

lines.forEach((line, i) => {
  if (line.includes('font-weight:') || line.includes('font-semibold') || line.includes('font-bold') || line.includes('font-medium')) {
    // print selector by going backwards to find '{'
    let sel = [];
    for (let k = i; k >= 0; k--) {
      sel.unshift(lines[k]);
      if (lines[k].includes('{')) break;
    }
    console.log(`L${i+1}: ${line.trim()} | Sel: ${sel.join(' ').replace(/\s+/g, ' ')}`);
  }
});

