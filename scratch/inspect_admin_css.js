const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

function findCss(kw) {
  css.split('\n').forEach((l, i) => {
    if (l.includes(kw)) {
      console.log((i+1) + ': ' + l.trim());
    }
  });
}

console.log('=== CSS SEARCH ===');
findCss('card-customization');
findCss('mobile-preview-sheet');
findCss('accordion-body');
findCss('uppercase');

