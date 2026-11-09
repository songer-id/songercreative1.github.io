const fs = require('fs');

function search(path) {
  if (!fs.existsSync(path)) return;
  const content = fs.readFileSync(path, 'utf8');
  if (content.includes('product-form-top-bar')) {
    console.log(`Found in ${path}`);
  }
}

const files = fs.readdirSync('scratch');
files.forEach(f => search('scratch/' + f));
search('js/product-form.js');
search('js/admin-app.js');
search('admin.html');
search('css/admin.css');
search('docs/PRD_MASTER.md');

