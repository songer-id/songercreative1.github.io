const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');
const lines = css.split('\n');

lines.forEach((line, i) => {
  if (line.match(/(^|[\s,{])label([\s,{:]|$)/)) {
    console.log(`Line ${i+1}: ${line}`);
    for (let j = Math.max(0, i - 1); j <= Math.min(lines.length - 1, i + 10); j++) {
      console.log(`  ${j+1}: ${lines[j]}`);
    }
    console.log('-----------------');
  }
});

