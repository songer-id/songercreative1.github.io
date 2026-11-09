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

searchFile('js/product-form.js', 'badge_radius');
searchFile('js/product-form.js', 'badge_text_color');
searchFile('js/product-form.js', 'badge_bg_color');
searchFile('js/product-form.js', 'badge_border_color');
searchFile('js/product-form.js', 'badge_style');
searchFile('js/product-form.js', 'badgeStyle');

