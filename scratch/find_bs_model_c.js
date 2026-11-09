const fs = require('fs');
const bs = fs.readFileSync('js/buyer-store.js', 'utf8');

bs.split('\n').forEach((l, i) => {
  if (l.includes('ModelC') || l.includes('model_c') || l.includes('footer_2_bg_color')) {
    console.log((i+1) + ': ' + l.trim());
  }
});

