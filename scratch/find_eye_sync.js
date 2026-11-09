const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8').split('\n');

for (let i = 0; i < pf.length; i++) {
  if (pf[i].includes('function syncEyeToggleIcons(')) {
    console.log('syncEyeToggleIcons at line ' + (i + 1));
    for (let j = i; j < Math.min(pf.length, i + 35); j++) {
      console.log((j + 1) + ': ' + pf[j]);
    }
  }
}

