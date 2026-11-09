const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'scratch') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.html') || entry.name.endsWith('.css') || entry.name.endsWith('.md'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('product-form-top-bar') || content.includes('btn-back-to-list')) {
        console.log('Found in', fullPath);
      }
    }
  }
}

searchDir('.');

