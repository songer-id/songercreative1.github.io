const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

let idx = 0;
while ((idx = pf.indexOf('renderSizeGuideSectionHtml', idx)) !== -1) {
  console.log('Found renderSizeGuideSectionHtml at', idx);
  console.log(pf.slice(idx, idx + 1500));
  idx += 'renderSizeGuideSectionHtml'.length;
}

const tableIdx = pf.indexOf('size-guide-table');
if (tableIdx !== -1) {
  console.log('\nFound size-guide-table around:', tableIdx);
  console.log(pf.slice(tableIdx - 200, tableIdx + 1500));
}

