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

searchFile('admin.html', 'sidebar-preview');
searchFile('admin.html', 'preview-sidebar');
searchFile('js/product-form.js', 'sidebar-preview');
searchFile('js/product-form.js', 'preview-sidebar');
searchFile('css/admin.css', 'sidebar');

