const fs = require('fs');

['css/admin.css', 'css/theme-editor.css'].forEach(file => {
  const css = fs.readFileSync(file, 'utf8');
  console.log(`=== ${file} ===`);
  const lines = css.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('font-weight') || (line.includes('font-') && (line.includes('bold') || line.includes('semibold') || line.includes('medium')))) {
      // print line number and 3 lines before & after
      const start = Math.max(0, i - 2);
      const end = Math.min(lines.length - 1, i + 2);
      console.log(`L${i+1}:`);
      for (let j = start; j <= end; j++) {
        console.log(`  ${j+1}: ${lines[j]}`);
      }
    }
  });
});

