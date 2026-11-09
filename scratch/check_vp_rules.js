const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

const regex = /#admin-main-viewport[^{]*\{([^}]+)\}/g;
let match;
while ((match = regex.exec(css)) !== null) {
  if (match[1].includes('z-index') || match[1].includes('transform') || match[1].includes('filter')) {
    console.log('Match:', match[0]);
  }
}

