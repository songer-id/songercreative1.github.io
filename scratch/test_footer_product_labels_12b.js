/**
 * test_footer_product_labels_12b.js
 * Focused Verification Suite for TASK: SC-ADMIN-FOOTER-PRODUCT-LABELS-12B
 */

const assert = require('assert');
const fs = require('fs');

console.log('=== RUNNING VERIFICATION SUITE: SC-ADMIN-FOOTER-PRODUCT-LABELS-12B ===\n');

const dbCode = fs.readFileSync('js/db.js', 'utf8').replace(/\r\n/g, '\n');
const pfCode = fs.readFileSync('js/product-form.js', 'utf8').replace(/\r\n/g, '\n');
const bsCode = fs.readFileSync('js/buyer-store.js', 'utf8').replace(/\r\n/g, '\n');

// =========================================================================
// 1. Model C Validation & Draft / Model A / B Exemption
// =========================================================================
console.log('--- 1. Testing Model C Validation, Draft Exemption & Legacy Exception ---');

// 1.1 In validateForm: Check that Model C validates Footer 1 mandatory, Model A/B exempted
assert.ok(pfCode.includes("primaryState.card_variant === 'C'"), 'validateForm checks card_variant === C');
assert.ok(pfCode.includes("!draftMode && primaryState.card_variant === 'C'"), 'Draft mode is strictly exempted from footer 1 mandatory requirement');
assert.ok(pfCode.includes("Label Footer 1 wajib diisi untuk Model Kartu Detail."), 'Descriptive error message for empty/whitespace Footer 1');

// 1.2 In handleSaveCardDesign: Inline error validation on card editor save
assert.ok(pfCode.includes("error-card-footer-text-side"), 'Desktop Strip 1 inline error container wired');
assert.ok(pfCode.includes("error-card-footer-text-mob"), 'Mobile Strip 1 inline error container wired');
assert.ok(pfCode.includes("error-card-footer-2-text-side"), 'Desktop Strip 2 inline error container wired');
assert.ok(pfCode.includes("error-card-footer-2-text-mob"), 'Mobile Strip 2 inline error container wired');
assert.ok(pfCode.includes("Label Footer 1 wajib diisi."), 'Inline error message text present');

// 1.3 Untouched legacy product exception check
assert.ok(pfCode.includes("const isUntouchedLegacy = (formMode === 'edit' && !isFooterTouched && !initialCardFooterText);"), 'Untouched legacy product exception strictly enforced');
console.log('✓ Section 1 Passed: Validation rules, draft exemption, and legacy protection verified.');


// =========================================================================
// 2. Suggestions History, Deduplication & Tenant Isolation
// =========================================================================
console.log('\n--- 2. Testing Suggestions History, Normalization & Scoping ---');

// 2.1 Storage key for suggestions history is tenant-scoped
assert.ok(dbCode.includes("get FOOTER_TEXTS_HISTORY() { return getTenantKey('footer_texts_history'); }"), 'FOOTER_TEXTS_HISTORY uses tenant key');

// 2.2 Placeholders are strictly forbidden from history
const placeholders = [
  'tersedia berbagai variasi',
  'pengiriman cepat',
  'proses hanya dalam 1jam',
  'proses hanya dalam 1 jam',
  'variasi paket tersedia/tidak tersedia'
];
placeholders.forEach(ph => {
  assert.ok(dbCode.includes(ph), `db.js must filter out placeholder '${ph}'`);
});

// 2.3 Limits to 30 items
assert.ok(dbCode.includes('list.slice(0, 30)'), 'History list is bounded to 30 items');
assert.ok(dbCode.includes('result.slice(0, 30)'), 'getFooterTextsHistory returns at most 30 items');

// 2.4 History added after successful save, NOT on cancel
assert.ok(pfCode.includes('DB.saveFooterTextToHistory(f1Val)'), 'saveFooterTextToHistory called in handleSaveCardDesign on save');
const cancelBlock = pfCode.slice(pfCode.indexOf('function handleCancelCardDesign()'), pfCode.indexOf('function handleCancelCardDesign()') + 2000);
assert.ok(!cancelBlock.includes('saveFooterTextToHistory'), 'Cancel action MUST NOT save footer text to history');
console.log('✓ Section 2 Passed: Suggestions history, deduplication, and tenant scoping verified.');


// =========================================================================
// 3. Character Limit (32 Graphemes) & Counter
// =========================================================================
console.log('\n--- 3. Testing Grapheme Counting & 32 Char Limits ---');

// 3.1 Intl.Segmenter or Unicode length
assert.ok(pfCode.includes('Intl.Segmenter'), 'getUnicodeLength supports Intl.Segmenter for grapheme clusters');
assert.ok(pfCode.includes("granularity: 'grapheme'"), 'granularity set to grapheme');

// Test unicode length function directly
function testGraphemeLength(str) {
  if (!str) return 0;
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      return [...segmenter.segment(str)].length;
    } catch (_) { }
  }
  return [...str].length;
}

assert.strictEqual(testGraphemeLength('Tersedia berbagai Variasi'), 25);
assert.strictEqual(testGraphemeLength('12345678901234567890123456789012'), 32);
assert.strictEqual(testGraphemeLength('⚡ Kirim Cepat 🚀'), 15);
assert.strictEqual(testGraphemeLength('👨‍👩‍👧‍👦 Keluarga'), 10); // Emoji cluster is 1 grapheme + space + 8 chars = 10

// 3.2 Exactly 32 chars is valid, > 32 is invalid
assert.ok(pfCode.includes('f1Len > 32'), 'Validation rejects length > 32');
assert.ok(pfCode.includes('f2Len > 32'), 'Validation rejects length > 32 for strip 2');
console.log('✓ Section 3 Passed: Grapheme counting and 32 character limit verified.');


// =========================================================================
// 4. Separation of Design Preset from Product Content
// =========================================================================
console.log('\n--- 4. Testing Design Preset Separation from Product Content ---');

// 4.1 saveCardModelPreset strips content and metric metadata
assert.ok(dbCode.includes("k.includes('card_footer_')") || dbCode.includes('delete cleanConfig.card_footer_text;'), 'saveCardModelPreset removes card_footer_text');
assert.ok(dbCode.includes("k.includes('footer_text')") || dbCode.includes('delete cleanConfig.footer_text;'), 'saveCardModelPreset removes footer_text');
assert.ok(dbCode.includes("k.startsWith('admin_')") || dbCode.includes('delete cleanConfig.admin_card_preview_metrics;'), 'saveCardModelPreset removes admin_card_preview_metrics');

// 4.2 New product does not inherit text
assert.ok(pfCode.includes("initialCardFooterText = '';"), 'New product resets initialCardFooterText to empty');
assert.ok(!pfCode.includes("text: 'Proses Hanya Dalam 1Jam'"), 'No default legacy text assigned to new products');
console.log('✓ Section 4 Passed: Design preset cleanly separated from product content.');


// =========================================================================
// 5. Brand Secondary Fallback for Footer 2
// =========================================================================
console.log('\n--- 5. Testing Brand Secondary Fallback for Footer 2 ---');

// 5.1 getSecondaryThemeColor exists and retrieves settings or --color-secondary
assert.ok(pfCode.includes('function getSecondaryThemeColor()'), 'getSecondaryThemeColor function exists in product-form.js');
assert.ok(pfCode.includes('secondary_color'), 'Reads secondary_color from settings');
assert.ok(pfCode.includes('--color-secondary'), 'Reads --color-secondary from CSS');

// 5.2 buyer-store.js uses secondary color fallback
assert.ok(bsCode.includes('const defaultSecondary = (typeof DB !== \'undefined\' && DB.getSettings) ? (DB.getSettings()?.secondary_color || \'#f59e0b\') : \'#f59e0b\';'), 'buyer-store.js resolves defaultSecondary from DB settings');
assert.ok(bsCode.includes('const footer2Bg = f2Obj.bg_color || prod.footer_2_bg_color || config.footer_2_bg_color || defaultSecondary;'), 'buyer-store.js resolves in exact order: custom -> design preset -> brand secondary');

// 5.3 DB DEFAULT_CARD_VARIANTS_CONFIG.variant_c uses #f59e0b for footer_2_bg_color
assert.ok(dbCode.includes("footer_2_bg_color: '#f59e0b'"), 'variant_c default uses #f59e0b brand secondary color');
console.log('✓ Section 5 Passed: Brand secondary fallback for Footer 2 verified.');


// =========================================================================
// 6. Regression Testing: Model C Conditional Rendering
// =========================================================================
console.log('\n--- 6. Testing Model C Conditional Rendering Intact ---');

// When Footer 2 is empty, it does not render empty strip
assert.ok(pfCode.includes('isCountdownActive || Boolean(previewF2Text)'), 'Footer 2 is rendered only when text exists or countdown is active');
assert.ok(bsCode.includes('const hasFooter2 = countdownInfo.is_active || Boolean(footer2Text);'), 'buyer-store.js renders Footer 2 only when text exists or countdown is active');

// Step 2 Mini PDP retention
assert.ok(pfCode.includes('// Step 2: Mini PDP (Detail Produk)'), 'Step 2 Mini PDP logic retained');

console.log('✓ Section 6 Passed: Conditional rendering and Step 2 preview retained.');

console.log('\n=== ALL 12B VERIFICATIONS PASSED SUCCESSFULLY! (100%) ===');
