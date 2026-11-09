const fs = require('fs');
const lines = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('markCardDesignAsCustom') || lines[i].includes('applyCardVariant') || lines[i].includes('snapshot') || lines[i].includes('takeCardDesignSnapshot')) {
    console.log((i+1) + ': ' + lines[i].trim());
  }
}

