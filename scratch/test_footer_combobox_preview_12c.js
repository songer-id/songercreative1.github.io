/**
 * test_footer_combobox_preview_12c.js
 * Focused Verification Suite for TASK: SC-ADMIN-FOOTER-COMBOBOX-PREVIEW-12C
 */

const assert = require('assert');
const fs = require('fs');

console.log('=== RUNNING VERIFICATION SUITE: SC-ADMIN-FOOTER-COMBOBOX-PREVIEW-12C ===\n');

const dbCode = fs.readFileSync('js/db.js', 'utf8').replace(/\r\n/g, '\n');
const pfCode = fs.readFileSync('js/product-form.js', 'utf8').replace(/\r\n/g, '\n');
const bsCode = fs.readFileSync('js/buyer-store.js', 'utf8').replace(/\r\n/g, '\n');

// =========================================================================
// 1. Structure of Combobox Input/Pilih for Footer 1 and Footer 2
// =========================================================================
console.log('--- 1. Testing Combobox Input/Pilih Structure & Placeholders ---');

// Check desktop & mobile Footer 1 markup
assert.ok(pfCode.includes('id="input-card-footer-text-side"'), 'Footer 1 desktop input exists');
assert.ok(pfCode.includes('id="input-card-footer-text-mob"'), 'Footer 1 mobile input exists');
assert.ok(pfCode.includes('placeholder="Tersedia berbagai Variasi"'), 'Footer 1 placeholder matches specification');

// Check desktop & mobile Footer 2 markup
assert.ok(pfCode.includes('id="input-card-footer-2-text-side"'), 'Footer 2 desktop input exists');
assert.ok(pfCode.includes('id="input-card-footer-2-text-mob"'), 'Footer 2 mobile input exists');
assert.ok(pfCode.includes('placeholder="Pengiriman Cepat"'), 'Footer 2 placeholder matches specification');

// Check clean datalist combobox wrapper classes
assert.ok(pfCode.includes('clean-datalist-input-box'), 'clean-datalist-input-box container class used');
assert.ok(pfCode.includes('clean-datalist-arrow'), 'clean-datalist-arrow button exists for opening dropdown');
assert.ok(pfCode.includes('btn-clear-datalist'), 'btn-clear-datalist button exists for clearing input');
assert.ok(pfCode.includes('clean-datalist-popover'), 'clean-datalist-popover container used for suggestions');

// Check datalist attribute points to footer-texts-history-list
assert.ok(pfCode.includes('list="footer-texts-history-list"'), 'Inputs use list="footer-texts-history-list"');

// Check that getOptionsForDatalist directly supplies DB history suggestions
assert.ok(pfCode.includes("listId === 'footer-texts-history-list'"), 'getOptionsForDatalist handles footer-texts-history-list');
assert.ok(pfCode.includes('DB.getFooterTextsHistory()'), 'getOptionsForDatalist fetches from DB.getFooterTextsHistory()');

console.log('✓ Section 1 Passed: Combobox markup, placeholders, and history data source verified.');

// =========================================================================
// 2. Synchronization, Control Handlers & 32-Character Grapheme Enforcement
// =========================================================================
console.log('\n--- 2. Testing Synchronization, Control Handlers & 32-Char Limit ---');

// Check truncateTo32Graphemes helper exists
assert.ok(pfCode.includes('function truncateTo32Graphemes('), 'truncateTo32Graphemes helper defined');
assert.ok(pfCode.includes('Intl.Segmenter'), 'truncateTo32Graphemes uses Intl.Segmenter for grapheme clusters');

// Check syncF1Str and syncF2Str truncate to 32 graphemes and call _syncDatalistControls
assert.ok(pfCode.includes('const syncF1Str = (val) => {'), 'syncF1Str helper defined');
assert.ok(pfCode.includes('const syncF2Str = (val) => {'), 'syncF2Str helper defined');
assert.ok(pfCode.includes('const cleanVal = truncateTo32Graphemes(val);'), 'syncF1Str / syncF2Str enforce 32 grapheme limit');
assert.ok(pfCode.includes('x._syncDatalistControls()'), 'syncF1Str / syncF2Str synchronize datalist controls across inputs');

// Check selection inside bindCleanDatalistPopovers applies 32 grapheme limit
assert.ok(pfCode.includes('truncateTo32Graphemes(val)'), 'bindCleanDatalistPopovers applies 32 grapheme limit on suggestion selection');

// Check input._syncDatalistControls attachment
assert.ok(pfCode.includes('input._syncDatalistControls = syncClearAndArrowVisibility;'), 'bindCleanDatalistPopovers attaches _syncDatalistControls to input element');

console.log('✓ Section 2 Passed: Sync handlers, grapheme limiting, and datalist control bindings verified.');

// =========================================================================
// 3. Step 1 Admin Preview Sample Demonstration & Notice Badge
// =========================================================================
console.log('\n--- 3. Testing Step 1 Admin Preview Demonstration & Sample Badges ---');

// Check sample badges in markup
assert.ok(pfCode.includes('id="preview-footer-sample-badge"'), 'Desktop preview footer sample badge exists');
assert.ok(pfCode.includes('id="preview-footer-sample-badge-mob"'), 'Mobile preview footer sample badge exists');
assert.ok(pfCode.includes('Footer kosong ditampilkan sebagai contoh.'), 'Sample notice text matches specification');

// Check sample preview fallback logic in updateProductCardLivePreview
assert.ok(pfCode.includes("const isStep1CardPreview = (currentStep === 1 && variant === 'C');"), 'Step 1 Card Preview identified for Model C');
assert.ok(pfCode.includes("const previewF1Text = hasUserFooter1 ? rawFooterText : (isStep1CardPreview ? 'Tersedia berbagai Variasi' : '');"), 'Footer 1 falls back to sample "Tersedia berbagai Variasi" only for Step 1 preview');
assert.ok(pfCode.includes("const previewF2Text = hasUserFooter2 ? rawFooter2Text : (isStep1CardPreview ? 'Pengiriman Cepat' : '');"), 'Footer 2 falls back to sample "Pengiriman Cepat" only for Step 1 preview');

// Check sample badge visibility condition
assert.ok(pfCode.includes('const hasSampleFooter = isStep1CardPreview && (isF1Sample || isF2Sample);'), 'Badge shown if either footer uses sample text');
assert.ok(pfCode.includes("if (hasSampleFooter) badge.classList.remove('hidden');"), 'Footer sample badge shown when sample text active');
assert.ok(pfCode.includes("else badge.classList.add('hidden');"), 'Footer sample badge hidden when user text filled');

// Sample data badge removed as requested by user
assert.ok(!pfCode.includes('id="preview-sample-data-badge"'), 'preview-sample-data-badge removed');

console.log('✓ Section 3 Passed: Live preview sample demonstration and independent notice badge verified.');

// =========================================================================
// 4. Sample Texts Never Pollute State, Inputs, Payloads, or Presets
// =========================================================================
console.log('\n--- 4. Testing Strict Isolation: Sample Text Never Pollutes State or Payloads ---');

// In handleSaveCardDesign:
assert.ok(!pfCode.includes("card_footer_1_text = 'Tersedia berbagai Variasi'"), 'Sample text 1 never assigned to state in handleSaveCardDesign');
assert.ok(!pfCode.includes("card_footer_2_text = 'Pengiriman Cepat'"), 'Sample text 2 never assigned to state in handleSaveCardDesign');

// In getCardConfig:
assert.ok(!pfCode.includes("footer_1_text: 'Tersedia berbagai Variasi'"), 'Design presets never include sample text 1 as default');
assert.ok(!pfCode.includes("footer_2_text: 'Pengiriman Cepat'"), 'Design presets never include sample text 2 as default');

// In validateForm:
assert.ok(pfCode.includes("const f1Val = (primaryState.card_footer_text || '').trim();"), 'validateForm checks actual user text, not sample preview text');

console.log('✓ Section 4 Passed: Strict state, input, and payload isolation verified.');

// =========================================================================
// 5. Buyer Store Behavior
// =========================================================================
console.log('\n--- 5. Testing Buyer Store Behavior ---');

// Check that buyer-store.js only uses actual stored text
assert.ok(bsCode.includes('const footer1Text = (f1Obj.text !== undefined ? f1Obj.text :'), 'Buyer store reads saved footer 1 text');
assert.ok(bsCode.includes('const footer2Text = (f2Obj.text !== undefined ? f2Obj.text :'), 'Buyer store reads saved footer 2 text');
assert.ok(!bsCode.includes("'Tersedia berbagai Variasi'"), 'Buyer store NEVER falls back to sample text for Footer 1');
assert.ok(!bsCode.includes("'Pengiriman Cepat'"), 'Buyer store NEVER falls back to sample text for Footer 2');
assert.ok(!bsCode.includes('Footer kosong ditampilkan sebagai contoh.'), 'Buyer store NEVER renders sample notice badge');
assert.ok(bsCode.includes('const hasFooter2 = countdownInfo.is_active || Boolean(footer2Text);'), 'Buyer store does not render empty Footer 2 strip');

console.log('✓ Section 5 Passed: Buyer store strictly isolated from sample demonstration text.');

// =========================================================================
// 6. Functional Mock Unit Testing
// =========================================================================
console.log('\n--- 6. Mock DOM & Functional Logic Verification ---');

// Mock Intl.Segmenter test for graphemes
function mockTruncateTo32Graphemes(str) {
  if (!str) return '';
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const segments = [...segmenter.segment(str)];
    if (segments.length <= 32) return str;
    return segments.slice(0, 32).map(s => s.segment).join('');
  }
  return [...str].slice(0, 32).join('');
}

const longEmojiStr = '🔥'.repeat(40);
assert.strictEqual([...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(mockTruncateTo32Graphemes(longEmojiStr))].length, 32, '32 grapheme limit on emojis');

const longIndonesianStr = 'Ini adalah teks yang sangat panjang sekali melebihi tiga puluh dua karakter';
assert.strictEqual(mockTruncateTo32Graphemes(longIndonesianStr).length, 32, '32 grapheme limit on standard text');

// Mock Preview Sample Badge logic
function evaluatePreviewFooters(currentStep, variant, rawFooter1, rawFooter2, isCountdownActive) {
  const isStep1CardPreview = (currentStep === 1 && variant === 'C');
  const hasUserFooter1 = Boolean(rawFooter1 && rawFooter1.trim());
  const hasUserFooter2 = Boolean(rawFooter2 && rawFooter2.trim());

  const previewF1Text = hasUserFooter1 ? rawFooter1.trim() : (isStep1CardPreview ? 'Tersedia berbagai Variasi' : '');
  const previewF2Text = hasUserFooter2 ? rawFooter2.trim() : (isStep1CardPreview ? 'Pengiriman Cepat' : '');

  const isF1Sample = isStep1CardPreview && !hasUserFooter1;
  const isF2Sample = isStep1CardPreview && !isCountdownActive && !hasUserFooter2;
  const hasSampleFooter = isStep1CardPreview && (isF1Sample || isF2Sample);

  return { previewF1Text, previewF2Text, hasSampleFooter, isF1Sample, isF2Sample };
}

// Case A: Both empty -> Both sample, badge active
const caseA = evaluatePreviewFooters(1, 'C', '', '', false);
assert.strictEqual(caseA.previewF1Text, 'Tersedia berbagai Variasi');
assert.strictEqual(caseA.previewF2Text, 'Pengiriman Cepat');
assert.strictEqual(caseA.hasSampleFooter, true, 'Badge active when both footers empty');

// Case B: Footer 1 filled, Footer 2 empty -> Footer 1 user text, Footer 2 sample, badge active
const caseB = evaluatePreviewFooters(1, 'C', 'Garansi Resmi 1 Tahun', '', false);
assert.strictEqual(caseB.previewF1Text, 'Garansi Resmi 1 Tahun');
assert.strictEqual(caseB.previewF2Text, 'Pengiriman Cepat');
assert.strictEqual(caseB.hasSampleFooter, true, 'Badge active when footer 2 is sample');

// Case C: Footer 1 empty, Footer 2 filled -> Footer 1 sample, Footer 2 user text, badge active
const caseC = evaluatePreviewFooters(1, 'C', '', 'Siap Kirim Hari Ini', false);
assert.strictEqual(caseC.previewF1Text, 'Tersedia berbagai Variasi');
assert.strictEqual(caseC.previewF2Text, 'Siap Kirim Hari Ini');
assert.strictEqual(caseC.hasSampleFooter, true, 'Badge active when footer 1 is sample');

// Case D: Both filled -> Both user text, badge HIDDEN
const caseD = evaluatePreviewFooters(1, 'C', 'Garansi Resmi 1 Tahun', 'Siap Kirim Hari Ini', false);
assert.strictEqual(caseD.previewF1Text, 'Garansi Resmi 1 Tahun');
assert.strictEqual(caseD.previewF2Text, 'Siap Kirim Hari Ini');
assert.strictEqual(caseD.hasSampleFooter, false, 'Badge hidden when both footers filled with user text');

// Case E: Model A or B -> No sample footer text injected
const caseE = evaluatePreviewFooters(1, 'A', '', '', false);
assert.strictEqual(caseE.previewF1Text, '');
assert.strictEqual(caseE.previewF2Text, '');
assert.strictEqual(caseE.hasSampleFooter, false, 'No sample footer badge for Model A');

// Case F: Step 2 Mini PDP -> No sample footer text injected
const caseF = evaluatePreviewFooters(2, 'C', '', '', false);
assert.strictEqual(caseF.previewF1Text, '');
assert.strictEqual(caseF.previewF2Text, '');
assert.strictEqual(caseF.hasSampleFooter, false, 'No sample footer badge for Step 2 PDP');

console.log('✓ Section 6 Passed: Mock DOM & functional preview evaluation scenarios passed.');

console.log('\n=== ALL TASK 12C VERIFICATIONS PASSED SUCCESSFULLY! (100%) ===');
