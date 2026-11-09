const fs = require('fs');
const content = fs.readFileSync('css/admin.css', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('card-customization-section')) {
    console.log((i+1) + ': ' + lines[i].trim());
  }
}

