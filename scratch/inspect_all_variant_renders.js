const fs = require('fs');
const content = fs.readFileSync('js/buyer-store.js', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('renderCardVariant')) {
    console.log((i+1) + ': ' + lines[i].trim());
  }
}

