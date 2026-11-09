const fs = require('fs');
const content = fs.readFileSync('js/db.js', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('card_variants_config') || lines[i].includes('DEFAULT_CARD_VARIANTS_CONFIG')) {
    console.log((i+1) + ': ' + lines[i].trim());
  }
}

