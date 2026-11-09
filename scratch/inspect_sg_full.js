const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const css = fs.readFileSync('css/admin.css', 'utf8');

// 1. renderSizeGuideSectionHtml
const sIdx = pf.indexOf('function renderSizeGuideSectionHtml()');
console.log('=== renderSizeGuideSectionHtml ===');
console.log(pf.slice(sIdx, sIdx + 4000));

// 2. bindSizeGuideEvents & renderSizeGuideTableContent
const bIdx = pf.indexOf('function bindSizeGuideEvents()');
console.log('\n=== bindSizeGuideEvents ===');
console.log(pf.slice(bIdx, bIdx + 5000));

// 3. CSS for size-guide
console.log('\n=== CSS size-guide ===');
const cssLines = css.split('\n');
cssLines.forEach((l, i) => {
  if (l.includes('size-guide') || l.includes('size_guide')) {
    console.log(`L${i+1}: ${l}`);
  }
});

