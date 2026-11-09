const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const matches = pf.match(/class=\"[^\"]*card-accordion-trigger[^\"]*\"[^>]*>([\s\S]*?)<\/button>/g) || [];
console.log('Found triggers:', matches.length);
matches.slice(0, 4).forEach((m, i) => {
  console.log('Trigger', i, ':');
  console.log(m);
});

