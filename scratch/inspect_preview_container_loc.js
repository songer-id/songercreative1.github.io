const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Where are the live preview card containers?
['#card-preview-container', '#card-preview-container-mob', 'card-customization-section', 'card-customization-section-mob'].forEach(id => {
  const idx = pf.indexOf(id.replace('#', ''));
  console.log(id, 'at index', idx);
});

