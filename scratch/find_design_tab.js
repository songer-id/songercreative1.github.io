const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split(/\r?\n/);
lines.forEach((l, idx) => {
  if (l.includes("previewStep1Tab = 'design'") || l.includes('tab-btn-card-design') || l.includes('openCardDesignModal')) {
    console.log((idx+1) + ': ' + l);
  }
});

