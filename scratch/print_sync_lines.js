const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split(/\r?\n/);
for (let i = 800; i < 1400; i++) {
  if (lines[i].includes('syncClearAndArrowVisibility') || lines[i].includes('bindCleanDatalistPopovers')) {
    console.log((i+1) + ': ' + lines[i]);
  }
}

