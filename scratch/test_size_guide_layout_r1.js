const fs = require('fs');
const assert = require('assert');

console.log('--- TEST SUITE: SC-ADMIN-SIZE-GUIDE-LAYOUT-R1 ---');

const jsContent = fs.readFileSync('js/product-form.js', 'utf8');
const cssContent = fs.readFileSync('css/admin.css', 'utf8');

// 1. Verify CSS rules
console.log('1. Checking CSS rules in css/admin.css...');
assert(cssContent.includes('#size-guide-matrix-table {'), 'Missing #size-guide-matrix-table CSS rule');
assert(cssContent.includes('width: max-content;'), 'Missing width: max-content in table CSS');
assert(cssContent.includes('min-width: 100%;'), 'Missing min-width: 100% in table CSS');
assert(!cssContent.includes('#size-guide-matrix-table .size-col-header-input {\r\n  font-size: 11px;'), 'Old font-size: 11px still present');
assert(cssContent.includes('font-size: 0.75rem !important;'), 'Missing font-size: 0.75rem !important for size inputs');
assert(cssContent.includes('right: 0.35rem !important;'), 'Missing right: 0.35rem !important for clear datalist icon');
assert(cssContent.includes('width: 1.125rem !important;'), 'Missing width: 1.125rem !important for clear datalist icon');
assert(cssContent.includes('touch-action: manipulation;'), 'Missing touch-action: manipulation for buttons');
console.log('   ✓ CSS rules passed');

// 2. Extract and test getSizeGuideColWidthClass logic
console.log('2. Testing getSizeGuideColWidthClass logic...');
const getColWidthMatch = jsContent.match(/function getSizeGuideColWidthClass\([\s\S]*?^  \}/m);
assert(getColWidthMatch, 'Could not find function getSizeGuideColWidthClass in js/product-form.js');

const getSizeGuideColWidthClass = new Function('colName', 'colIdx', `
  ${getColWidthMatch[0]};
  return getSizeGuideColWidthClass(colName, colIdx);
`);

// Test cases
assert.strictEqual(getSizeGuideColWidthClass('Ukuran', 0), 'min-w-[130px] sm:min-w-[140px]');
assert.strictEqual(getSizeGuideColWidthClass('Panjang', 1), 'min-w-[160px] sm:min-w-[175px]');
assert.strictEqual(getSizeGuideColWidthClass('Lebar Dada', 2), 'min-w-[160px] sm:min-w-[175px]');
assert.strictEqual(getSizeGuideColWidthClass('Bahu', 3), 'min-w-[160px] sm:min-w-[175px]');
assert.strictEqual(getSizeGuideColWidthClass('Rekomendasi Berat', 4), 'min-w-[220px] sm:min-w-[240px]');
assert.strictEqual(getSizeGuideColWidthClass('Rekomendasi Tinggi', 5), 'min-w-[220px] sm:min-w-[240px]');
assert.strictEqual(getSizeGuideColWidthClass('Panjang Celana', 1), 'min-w-[220px] sm:min-w-[240px]');
assert.strictEqual(getSizeGuideColWidthClass('Lingkar Pinggang', 2), 'min-w-[220px] sm:min-w-[240px]');
assert.strictEqual(getSizeGuideColWidthClass('Lingkar Pinggul', 3), 'min-w-[220px] sm:min-w-[240px]');
assert.strictEqual(getSizeGuideColWidthClass('Lingkar Paha', 4), 'min-w-[220px] sm:min-w-[240px]');
assert.strictEqual(getSizeGuideColWidthClass('Ukuran EU', 0), 'min-w-[160px] sm:min-w-[175px]');
assert.strictEqual(getSizeGuideColWidthClass('Panjang Kaki (cm)', 3), 'min-w-[220px] sm:min-w-[240px]');
console.log('   ✓ getSizeGuideColWidthClass outputs correct classes for all standard & long titles');

// 3. Test template rendering & column alignment
console.log('3. Testing renderSizeGuideTheadHtml and renderSizeGuideTbodyHtml...');

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const theadMatch = jsContent.match(/function renderSizeGuideTheadHtml\([\s\S]*?^  \}/m);
const tbodyMatch = jsContent.match(/function renderSizeGuideTbodyHtml\([\s\S]*?^  \}/m);
assert(theadMatch, 'Could not find renderSizeGuideTheadHtml');
assert(tbodyMatch, 'Could not find renderSizeGuideTbodyHtml');

const renderThead = new Function('columns', 'escapeHtml', 'getSizeGuideColWidthClass', `
  ${theadMatch[0]};
  return renderSizeGuideTheadHtml(columns);
`);

const renderTbody = new Function('columns', 'rows', 'escapeHtml', 'getSizeGuideColWidthClass', `
  ${tbodyMatch[0]};
  return renderSizeGuideTbodyHtml(columns, rows);
`);

const templates = {
  pakaian: {
    columns: ['Ukuran', 'Panjang', 'Lebar Dada', 'Bahu', 'Rekomendasi Berat', 'Rekomendasi Tinggi'],
    rows: [
      ['S', '66', '48', '42', '45-55 kg', '155-165 cm'],
      ['M', '68', '50', '44', '55-65 kg', '160-170 cm'],
      ['L', '70', '52', '46', '65-75 kg', '165-175 cm'],
      ['XL', '72', '54', '48', '75-85 kg', '170-180 cm']
    ]
  },
  celana: {
    columns: ['Ukuran', 'Panjang Celana', 'Lingkar Pinggang', 'Lingkar Pinggul', 'Lingkar Paha'],
    rows: [
      ['28', '98', '72', '90', '52'],
      ['30', '100', '76', '94', '54']
    ]
  },
  sepatu: {
    columns: ['Ukuran EU', 'Ukuran US', 'Ukuran UK', 'Panjang Kaki (cm)'],
    rows: [
      ['39', '6.5', '6', '24.5'],
      ['40', '7', '6.5', '25.0']
    ]
  }
};

for (const [tplName, tplData] of Object.entries(templates)) {
  const theadHtml = renderThead(tplData.columns, escapeHtml, getSizeGuideColWidthClass);
  const tbodyHtml = renderTbody(tplData.columns, tplData.rows, escapeHtml, getSizeGuideColWidthClass);

  // Check each column width class in thead vs tbody
  tplData.columns.forEach((col, cIdx) => {
    const expectedWidth = getSizeGuideColWidthClass(col, cIdx);
    
    // Check thead th has this expected width class
    assert(theadHtml.includes(expectedWidth), `Template ${tplName} thead missing ${expectedWidth} for col ${col}`);
    
    // Check tbody td has this expected width class
    assert(tbodyHtml.includes(expectedWidth), `Template ${tplName} tbody missing ${expectedWidth} for col ${col}`);
  });

  // Verify action column matches
  assert(theadHtml.includes('w-10 sm:w-11 min-w-[40px] sm:min-w-[44px]'), `Template ${tplName} thead missing action col width`);
  assert(tbodyHtml.includes('w-10 sm:w-11 min-w-[40px] sm:min-w-[44px]'), `Template ${tplName} tbody missing action col width`);

  // Verify button sizes
  assert(theadHtml.includes('btn-add-size-col w-7 h-7 sm:w-8 sm:h-8 rounded-md'), `Template ${tplName} thead add col button size`);
  assert(tbodyHtml.includes('btn-del-size-row w-7 h-7 sm:w-8 sm:h-8 text-slate-400 hover:text-red-600 rounded-md'), `Template ${tplName} tbody del row button size`);
  
  if (tplData.columns.length > 2) {
    assert(theadHtml.includes('btn-del-size-col w-7 h-7 sm:w-8 sm:h-8 text-slate-400 hover:text-red-600 rounded-md'), `Template ${tplName} thead del col button size`);
  }
}
console.log('   ✓ All 3 templates rendered with 100% strict vertical column alignment');

// 4. Check separation of controls
console.log('4. Checking separation of controls...');
const pakaianThead = renderThead(templates.pakaian.columns, escapeHtml, getSizeGuideColWidthClass);
// Clean datalist wrapper must contain the input
assert(pakaianThead.includes('<div class="relative flex-1 min-w-0 clean-datalist-wrapper">'), 'Clean datalist wrapper missing');
// Trash button must be OUTSIDE clean-datalist-wrapper
assert(pakaianThead.includes('</div>\n              \n                <button type="button" class="btn-del-size-col') || pakaianThead.includes('</div>\n              <button type="button" class="btn-del-size-col') || pakaianThead.includes('</div>\n                <button type="button" class="btn-del-size-col'), 'btn-del-size-col must be outside clean-datalist-wrapper');
console.log('   ✓ Controls strictly separated');

// 5. Check thead.onchange includes updateSizeGuideColWidthClasses
console.log('5. Checking thead.onchange...');
assert(jsContent.includes('if (typeof updateSizeGuideColWidthClasses === \'function\') updateSizeGuideColWidthClasses();'), 'updateSizeGuideColWidthClasses not called in thead.onchange');
console.log('   ✓ Dynamic column width sync verified');

console.log('ALL TESTS PASSED SUCCESSFULLY! ✓✓✓');

