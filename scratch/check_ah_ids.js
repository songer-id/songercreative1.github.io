const fs = require('fs');
const ah = fs.readFileSync('admin.html', 'utf8');
const searchList = ['cfg-show-sales', 'cfg-show-rating', 'card-customization-section', 'desktop-preview-sidebar', 'mobile-preview-sheet'];
searchList.forEach(id => {
  console.log(id, 'in admin.html?', ah.includes(id));
});
