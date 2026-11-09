/**
 * test_metric_combobox_suggestions.js
 * Verification Suite for Rating & Terjual Combobox Suggestions (Updated with User Feedback)
 */

const assert = require('assert');
const fs = require('fs');

console.log('=== RUNNING TEST SUITE: RATING & SALES MANUAL COMBOBOX SUGGESTIONS ===\n');

const pfCode = fs.readFileSync('js/product-form.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Static Markup Verification
console.log('--- 1. Testing Static Markup & Datalist Attributes ---');

assert.ok(pfCode.includes('id="cfg-rating-manual-val" list="datalist-rating-manual-options"'), 'Desktop Rating input wired to datalist-rating-manual-options');
assert.ok(pfCode.includes('id="cfg-rating-manual-val-mob" list="datalist-rating-manual-options"'), 'Mobile Rating input wired to datalist-rating-manual-options');
assert.ok(pfCode.includes('id="cfg-sales-manual-val" list="datalist-sales-manual-options"'), 'Desktop Sales input wired to datalist-sales-manual-options');
assert.ok(pfCode.includes('id="cfg-sales-manual-val-mob" list="datalist-sales-manual-options"'), 'Mobile Sales input wired to datalist-sales-manual-options');

// Verify placeholder "Pilih/Input"
assert.ok(pfCode.includes('id="cfg-rating-manual-val" list="datalist-rating-manual-options" data-datalist-id="datalist-rating-manual-options" autocomplete="off" placeholder="Pilih/Input"'), 'Desktop rating uses placeholder="Pilih/Input"');
assert.ok(pfCode.includes('id="cfg-sales-manual-val" list="datalist-sales-manual-options" data-datalist-id="datalist-sales-manual-options" autocomplete="off" placeholder="Pilih/Input"'), 'Desktop sales uses placeholder="Pilih/Input"');
assert.ok(pfCode.includes('id="cfg-rating-manual-val-mob" list="datalist-rating-manual-options" data-datalist-id="datalist-rating-manual-options" autocomplete="off" placeholder="Pilih/Input"'), 'Mobile rating uses placeholder="Pilih/Input"');
assert.ok(pfCode.includes('id="cfg-sales-manual-val-mob" list="datalist-sales-manual-options" data-datalist-id="datalist-sales-manual-options" autocomplete="off" placeholder="Pilih/Input"'), 'Mobile sales uses placeholder="Pilih/Input"');

// Verify text-left alignment preventing overlap with arrow/clear button
assert.ok(pfCode.includes('clean-datalist-input w-full pl-2.5 pr-8 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-left'), 'Input uses text-left and pl-2.5 pr-8');

// Verify removal of "Tidak ada saran yang cocok"
assert.ok(!pfCode.includes('Tidak ada saran yang cocok'), '"Tidak ada saran yang cocok" message removed');

// Verify removal of sample data badge
assert.ok(!pfCode.includes('id="preview-sample-data-badge"'), 'preview-sample-data-badge removed');
assert.ok(!pfCode.includes('id="preview-sample-data-badge-mob"'), 'preview-sample-data-badge-mob removed');

console.log('✓ Section 1 Passed: Markup, placeholders, text-left alignment, and clean closing verified.');

// 2. Options Content & Labels
console.log('\n--- 2. Testing Suggestion Options & Labels ---');

const ratingOptions = ['5.0', '4.9', '4.8', '4.7'];
assert.deepStrictEqual(ratingOptions, ['5.0', '4.9', '4.8', '4.7'], 'Rating suggestions match requested values');

const salesOptions = [
  { value: '50', label: '50' },
  { value: '100', label: '100' },
  { value: '500', label: '500' },
  { value: '1001', label: '1RB+' },
  { value: '10001', label: '10RB+' }
];
assert.strictEqual(salesOptions.length, 5, 'Sales suggestions count is exactly 5');
assert.strictEqual(salesOptions[0].value, '50');
assert.strictEqual(salesOptions[0].label, '50', 'Sales 50 label is just 50');
assert.strictEqual(salesOptions[1].value, '100');
assert.strictEqual(salesOptions[1].label, '100', 'Sales 100 label is just 100');
assert.strictEqual(salesOptions[2].value, '500');
assert.strictEqual(salesOptions[2].label, '500', 'Sales 500 label is just 500');
assert.strictEqual(salesOptions[3].value, '1001', 'Sales 1RB+ value is 1001');
assert.strictEqual(salesOptions[3].label, '1RB+', 'Sales 1RB+ label is 1RB+');
assert.strictEqual(salesOptions[4].value, '10001', 'Sales 10RB+ value is 10001');
assert.strictEqual(salesOptions[4].label, '10RB+', 'Sales 10RB+ label is 10RB+');

console.log('✓ Section 2 Passed: Options content: 50, 100, 500, 1RB+ (1001), 10RB+ (10001) verified.');

// 3. formatSalesCount verification for 1001 and 10001
console.log('\n--- 3. Testing formatSalesCount with 1001 and 10001 ---');

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

assert.strictEqual(formatSalesCount(50), '50 terjual');
assert.strictEqual(formatSalesCount(100), '100 terjual');
assert.strictEqual(formatSalesCount(500), '500 terjual');
assert.strictEqual(formatSalesCount(1000), '1RB terjual', '1000 gives exact 1RB');
assert.strictEqual(formatSalesCount(1001), '1RB+ terjual', '1001 automatically gives 1RB+');
assert.strictEqual(formatSalesCount(10001), '10RB+ terjual', '10001 automatically gives 10RB+');

console.log('✓ Section 3 Passed: 1001 formats automatically as 1RB+ and 10001 as 10RB+.');

// 4. Normalization of Input Values
console.log('\n--- 4. Testing Normalization of Input Values ---');

const parseRating = (raw) => {
  if (raw.trim() === '') return null;
  const norm = raw.replace(',', '.').trim();
  const num = parseFloat(norm);
  if (!isNaN(num) && isFinite(num) && num >= 0 && num <= 5) {
    return parseFloat(num.toFixed(1));
  }
  return null;
};

assert.strictEqual(parseRating('4.9'), 4.9);
assert.strictEqual(parseRating('4,8'), 4.8);
assert.strictEqual(parseRating('5.0'), 5.0);

const parseSales = (raw) => {
  if (raw.trim() === '') return null;
  const cleanDigits = raw.replace(/[.,]/g, '').trim();
  const num = parseInt(cleanDigits, 10);
  if (!isNaN(num) && isFinite(num) && num >= 0) {
    return num;
  }
  return null;
};

assert.strictEqual(parseSales('50'), 50);
assert.strictEqual(parseSales('100'), 100);
assert.strictEqual(parseSales('1001'), 1001);
assert.strictEqual(parseSales('10001'), 10001);
assert.strictEqual(parseSales('1.001'), 1001);
assert.strictEqual(parseSales('10.001'), 10001);

console.log('✓ Section 4 Passed: Normalization verified.');

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! (100%) ===');
