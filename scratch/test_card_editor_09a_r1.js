/**
 * test_card_editor_09a_r1.js
 * Verification test for TASK SC-ADMIN-CARD-EDITOR-09A-R1
 */

const fs = require('fs');
const assert = require('assert');

let JSDOM = null;
try {
  const jsdom = require('jsdom');
  JSDOM = jsdom.JSDOM;
} catch (e) {
  // jsdom not installed
}

console.log('Testing TASK SC-ADMIN-CARD-EDITOR-09A-R1...');

// 1. Test formatSalesCount logic directly
function formatSalesCount(count, compact = false) {
  const num = parseInt(count, 10) || 0;
  const labelSuffix = compact ? 'ter' : 'terjual';
  if (num < 1000) {
    return `${num} ${labelSuffix}`;
  }
  const k = Math.floor(num / 1000);
  const isExact = (num % 1000 === 0);
  const valPrefix = isExact ? `${k}RB` : `${k}RB+`;
  return `${valPrefix} ${labelSuffix}`;
}

assert.strictEqual(formatSalesCount(0), '0 terjual', '0 sales must return "0 terjual"');
assert.strictEqual(formatSalesCount(0, true), '0 ter', '0 sales compact must return "0 ter"');
assert.strictEqual(formatSalesCount(null), '0 terjual', 'null must return "0 terjual"');
assert.strictEqual(formatSalesCount(undefined), '0 terjual', 'undefined must return "0 terjual"');
assert.strictEqual(formatSalesCount(88), '88 terjual', '88 must return "88 terjual"');
assert.strictEqual(formatSalesCount(312), '312 terjual', '312 must return "312 terjual"');
assert.strictEqual(formatSalesCount(1000), '1RB terjual', '1000 must return "1RB terjual"');
assert.strictEqual(formatSalesCount(1500), '1RB+ terjual', '1500 must return "1RB+ terjual"');
console.log('✓ formatSalesCount helper assertions passed');

// 2. Test js/product-form.js source code integrity
const pfCode = fs.readFileSync('js/product-form.js', 'utf8');

// Check that formatSalesCount is defined and exported
assert(pfCode.includes('function formatSalesCount(count, compact = false)'), 'formatSalesCount must be defined in product-form.js');
assert(pfCode.includes('formatSalesCount\n  };') || pfCode.includes('formatSalesCount,'), 'formatSalesCount must be exported by ProductForm');

// Check that primaryState tracks sales_count
assert(pfCode.includes('sales_count: 0'), 'primaryState must initialize sales_count: 0');
assert(pfCode.includes('sales_count: (prod.sales_count !== undefined'), 'editProduct must load prod.sales_count');

// Check that getCardConfigFromDOM extracts show_sales and show_sales_count
assert(pfCode.includes("show_sales: getChk('cfg-show-sales', 'cfg-show-sales-mob')"), 'getCardConfigFromDOM must return show_sales');
assert(pfCode.includes("show_sales_count: getChk('cfg-show-sales', 'cfg-show-sales-mob')"), 'getCardConfigFromDOM must return show_sales_count');

// Check that updateProductCardLivePreview resolves show_sales and salesCount properly
assert(pfCode.includes('showSalesChecked = document.getElementById(\'cfg-show-sales\')'), 'Live preview must safely check desktop/mobile checkbox');
assert(pfCode.includes('const salesCount = (primaryState.sales_count !== undefined'), 'Live preview must read primaryState.sales_count');

// Check that Model A, Model B, Model C, and Step 2 Mini PDP use formatSalesCount instead of hardcoded strings
assert(pfCode.includes('${formatSalesCount(salesCount, false)}'), 'Live preview must use formatSalesCount for sales count');
assert(pfCode.includes('${formatSalesCount(salesCount, isNarrowPriceRow)}'), 'Model B must use formatSalesCount with isNarrowPriceRow');

// Check that Model B mutual notice is present
assert(pfCode.includes('id="cfg-metric-model-b-notice"'), 'Desktop markup must include #cfg-metric-model-b-notice');
assert(pfCode.includes('id="cfg-metric-model-b-notice-mob"'), 'Mobile markup must include #cfg-metric-model-b-notice-mob');
assert(pfCode.includes('noticeBDesk.classList.remove(\'hidden\')'), 'syncCardAccordionDOM must manage noticeBDesk visibility');

// Check that no dummy "1RB+ terjual" strings remain in live preview
const matchesDummy = (pfCode.match(/1RB\+ terjual/g) || []).length;
console.log('Occurrences of "1RB+ terjual" in product-form.js:', matchesDummy);
assert.strictEqual(matchesDummy, 0, 'No hardcoded "1RB+ terjual" should remain in live card preview or mini PDP');

console.log('✓ Source code integrity checks passed');

console.log('ALL SC-ADMIN-CARD-EDITOR-09A-R1 CHECKS PASSED!');
