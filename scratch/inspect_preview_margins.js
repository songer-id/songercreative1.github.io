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

searchFile('js/product-form.js', '300px');
searchFile('js/product-form.js', '340px');
searchFile('css/admin.css', '300px');
searchFile('css/admin.css', '340px');
searchFile('js/product-form.js', 'isLivePreviewOpen');

