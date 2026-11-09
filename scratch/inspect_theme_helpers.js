const fs = require('fs');

function searchFile(file, term) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes(term)) {
      console.log(file + ':' + (idx+1) + ': ' + line.trim());
    }
  });
}

searchFile('js/product-form.js', 'getPrimaryThemeColor');
searchFile('js/product-form.js', 'getThemeBodyColor');
searchFile('js/product-form.js', 'color-primary');
searchFile('js/db.js', 'primary_color');

