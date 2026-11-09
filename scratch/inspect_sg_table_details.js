const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const css = fs.readFileSync('css/admin.css', 'utf8');

// 1. Find renderSizeGuideTheadHtml and renderSizeGuideTbodyHtml
const theadIdx = pf.indexOf('function renderSizeGuideTheadHtml');
console.log('=== renderSizeGuideTheadHtml & TbodyHtml ===');
console.log(pf.slice(theadIdx, theadIdx + 3500));

// 2. CSS lines 3440 to 3500
console.log('\n=== CSS lines 3430 to 3500 ===');
const lines = css.split('\n');
console.log(lines.slice(3430, 3480).join('\n'));

// 3. Table HTML inside renderSizeGuideSectionHtml
const tblStart = pf.indexOf('id="size-guide-table-panel"');
console.log('\n=== Table HTML in renderSizeGuideSectionHtml ===');
console.log(pf.slice(tblStart, tblStart + 2500));

