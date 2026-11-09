const fs = require('fs');

// Let's inspect all places where bindCleanDatalistPopovers is called or where scope is passed
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const regex = /bindCleanDatalistPopovers\([^)]*\)/g;
let m;
while ((m = regex.exec(pf)) !== null) {
  const lineNo = pf.slice(0, m.index).split('\n').length;
  console.log(`Line ${lineNo}: ${m[0]}`);
}

