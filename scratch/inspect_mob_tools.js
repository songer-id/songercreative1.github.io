const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');

function findSnippet(kw) {
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes(kw)) {
      console.log((i+1) + ': ' + l.trim());
    }
  });
}

findSnippet('card-customization-section-mob');
findSnippet('renderMobileCardDesignSheet');

