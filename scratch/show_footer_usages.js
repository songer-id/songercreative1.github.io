const fs = require('fs');

function showUsages(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  console.log(`=== Usages in ${filename} ===`);
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('footer_badge_icon') || line.includes('footer_2_badge_icon') || line.includes('footer_icon') || line.includes('footer_2_icon')) {
      if (!line.includes('footer_social')) {
        console.log(`L${idx+1}: ${line.trim()}`);
      }
    }
  });
}

showUsages('js/product-form.js');
showUsages('js/db.js');
showUsages('js/buyer-store.js');
