const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Cari container preview di Step 1
const matches = [];
let m;
const re = /id=["'](?:card-preview-container|mobile-card-preview|desktop-card-preview|preview-container|live-preview-box|step-1-preview)[^"']*["']/g;
while ((m = re.exec(pf)) !== null) {
  matches.push({ match: m[0], pos: m.index });
}
console.log('Preview container matches in product-form.js:', matches);

