const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const fnStart = pf.indexOf('function bindCleanDatalistPopovers');
const fnEnd = pf.indexOf('function syncSizeGuideStateFromDOM');
const body = pf.slice(fnStart, fnEnd);

let idx = 0;
while ((idx = body.indexOf('syncClearAndArrowVisibility', idx)) !== -1) {
  const lineStart = body.lastIndexOf('\n', idx);
  const lineEnd = body.indexOf('\n', idx);
  console.log(body.slice(lineStart + 1, lineEnd));
  idx += 'syncClearAndArrowVisibility'.length;
}

