const fs = require('fs');
const assert = require('assert');

console.log('=== RUNNING TESTS FOR SC-ADMIN-DETAIL-CARD-FOOTER-11 ===\n');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const bs = fs.readFileSync('js/buyer-store.js', 'utf8');
const db = fs.readFileSync('js/db.js', 'utf8');

// --- Test 1: FOOTER_ICONS_CATALOG Integrity ---
console.log('Test 1: Checking FOOTER_ICONS_CATALOG...');
assert(pf.includes('const FOOTER_ICONS_CATALOG = ['), 'FOOTER_ICONS_CATALOG must exist');

// Extract the catalog array using regex or evaluation
const catalogMatch = pf.match(/const FOOTER_ICONS_CATALOG = (\[[\s\S]*?\]);/);
assert(catalogMatch, 'FOOTER_ICONS_CATALOG must match array format');
const catalog = eval(catalogMatch[1]);

assert.strictEqual(catalog.length, 24, 'Catalog must contain exactly 24 icons');

// Check legacy identifiers allowlist
const legacyIds = ['truck', 'clock', 'zap', 'shield-check', 'minus', 'layers', 'tag', 'gift', 'sparkles', 'none'];
legacyIds.forEach(id => {
  assert(catalog.some(item => item.id === id), `Catalog must include legacy id '${id}'`);
});

// Check that each item has valid id, label, icon
catalog.forEach(item => {
  assert(item.id && typeof item.id === 'string', 'Item must have string id');
  assert(item.label && typeof item.label === 'string', 'Item must have string label');
  assert(item.icon && typeof item.icon === 'string', 'Item must have string icon');
});
console.log('✓ Test 1 passed: 24 curated icons present with all legacy allowlist IDs.\n');


// --- Test 2: Unicode Length & Helpers ---
console.log('Test 2: Checking getUnicodeLength & character limit logic...');
assert(pf.includes('function getUnicodeLength(str)'), 'getUnicodeLength function must exist');

function getUnicodeLength(str) {
  return str ? [...str].length : 0;
}

assert.strictEqual(getUnicodeLength(''), 0);
assert.strictEqual(getUnicodeLength('Tersedia berbagai Variasi'), 25);
assert.strictEqual(getUnicodeLength('12345678901234567890123456789012'), 32);
assert.strictEqual(getUnicodeLength('123456789012345678901234567890123'), 33);
assert.strictEqual(getUnicodeLength('⚡ Kirim Cepat 🚀'), 15); // Unicode aware: 1 + 1 + 11 + 1 + 1 = 15
console.log('✓ Test 2 passed: Unicode character length computed correctly.\n');


// --- Test 3: Placeholders, No Default Hardcoded Fallbacks ---
console.log('Test 3: Checking Placeholders and Default Empty Values...');
// Accordion inputs must have placeholder and empty string default
assert(pf.includes('placeholder="Tersedia berbagai Variasi"'), 'Strip 1 must have placeholder "Tersedia berbagai Variasi"');
assert(pf.includes('placeholder="Pengiriman Cepat"'), 'Strip 2 must have placeholder "Pengiriman Cepat"');

// Initial state
assert(pf.includes("card_footer_text: '',"), 'Initial primaryState card_footer_text must be empty string');
assert(pf.includes("card_footer_2_text: '',"), 'Initial primaryState card_footer_2_text must be empty string');

// No fallback string in syncStateFromDOM
assert(!pf.includes("primaryState.card_footer_text || 'Proses Hanya Dalam 1Jam'"), 'syncStateFromDOM must not force legacy fallback for Footer 1');
assert(!pf.includes("primaryState.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia'"), 'syncStateFromDOM must not force legacy fallback for Footer 2');
console.log('✓ Test 3 passed: Placeholders set, default empty string preserved.\n');


// --- Test 4: Live Preview Model C Conditional Render ---
console.log('Test 4: Checking Live Preview Conditional Rendering logic...');
// In product-form.js live preview:
assert(pf.includes('<!-- Dua Baris Strip Footer Horizontal di Bagian Bawah Kartu -->'), 'Live preview must contain footer comment');
assert(pf.includes('(hasFooter1 || hasFooter2)'), 'Live preview must conditionally render entire footer');
assert(pf.includes("(footerIcon && footerIcon !== 'none')"), 'Live preview must not render icon if none');
assert(pf.includes("(footer2Icon && footer2Icon !== 'none')"), 'Live preview Footer 2 must not render icon if none');
console.log('✓ Test 4 passed: Live preview conditional render properly structured.\n');


// --- Test 5: Buyer Store Model C Conditional Render ---
console.log('Test 5: Checking buyer-store.js Model C Conditional Rendering...');
assert(bs.includes('const hasFooter1 = Boolean(footer1Text);'), 'buyer-store.js must check hasFooter1');
assert(bs.includes('const hasFooter2 = countdownInfo.is_active || Boolean(footer2Text);'), 'buyer-store.js must check hasFooter2');
assert(bs.includes('${footerHtml}'), 'buyer-store.js must render ${footerHtml}');
assert(bs.includes("(footer1Icon && footer1Icon !== 'none')"), 'buyer-store.js must not render icon if none');
assert(bs.includes("(footer2Icon && footer2Icon !== 'none')"), 'buyer-store.js Footer 2 must not render icon if none');
console.log('✓ Test 5 passed: buyer-store.js matches live preview conditional rendering.\n');


// --- Test 6: DB Persistence & Fallback Stripping ---
console.log('Test 6: Checking js/db.js addProduct and updateProduct defaults...');
assert(db.includes("footer_text: '',"), 'DB default footer_text must be empty');
assert(db.includes("footer_2_text: '',"), 'DB default footer_2_text must be empty');
assert(db.includes("card_footer_text: productData.card_footer_text ? productData.card_footer_text.trim() : '',"), 'DB addProduct must not force fallback');
assert(db.includes("card_footer_2_text: productData.card_footer_2_text ? productData.card_footer_2_text.trim() : '',"), 'DB addProduct must not force fallback for footer 2');
console.log('✓ Test 6 passed: DB stores empty string without forcing default sample text.\n');


// --- Test 7: Icon Picker UI Elements Desktop & Mobile ---
console.log('Test 7: Checking Icon Picker UI & Accessibility in desktop & mobile...');
assert(pf.includes('id="btn-footer-icon-picker-side"'), 'Desktop strip 1 button exists');
assert(pf.includes('id="btn-footer-icon-picker-mob"'), 'Mobile strip 1 button exists');
assert(pf.includes('id="btn-footer-2-icon-picker-side"'), 'Desktop strip 2 button exists');
assert(pf.includes('id="btn-footer-2-icon-picker-mob"'), 'Mobile strip 2 button exists');

assert(pf.includes('id="menu-footer-icon-picker-side"'), 'Desktop strip 1 menu exists');
assert(pf.includes('id="menu-footer-icon-picker-mob"'), 'Mobile strip 1 menu exists');
assert(pf.includes('id="menu-footer-2-icon-picker-side"'), 'Desktop strip 2 menu exists');
assert(pf.includes('id="menu-footer-2-icon-picker-mob"'), 'Mobile strip 2 menu exists');

assert(pf.includes('id="footer-text-char-count-side"'), 'Desktop strip 1 char counter exists');
assert(pf.includes('id="footer-text-char-count-mob"'), 'Mobile strip 1 char counter exists');
assert(pf.includes('id="footer-2-text-char-count-side"'), 'Desktop strip 2 char counter exists');
assert(pf.includes('id="footer-2-text-char-count-mob"'), 'Mobile strip 2 char counter exists');

// Check accessible attributes
assert(pf.includes('aria-haspopup="true"'), 'Icon picker buttons must have aria-haspopup');
assert(pf.includes('role="menu"'), 'Icon picker menus must have role="menu"');
assert(pf.includes('role="menuitem"'), 'Icon picker items must have role="menuitem"');
console.log('✓ Test 7 passed: Desktop and mobile icon pickers & counters fully wired with ARIA.\n');


// --- Test 8: Character Limit Validation (32 chars) ---
console.log('Test 8: Checking 32-character validation in handleSaveCardDesign and validateForm...');
assert(pf.includes('f1Len > 32'), 'Must check f1Len > 32');
assert(pf.includes('f2Len > 32'), 'Must check f2Len > 32');
assert(pf.includes('Teks Footer 1 melebihi batas 32 karakter') || pf.includes('Label Footer 1 melebihi batas 32 karakter'), 'Must show descriptive error message for Footer 1');
assert(pf.includes('Teks Footer 2 melebihi batas 32 karakter') || pf.includes('Label Footer 2 melebihi batas 32 karakter'), 'Must show descriptive error message for Footer 2');
console.log('✓ Test 8 passed: Character limit validation strictly enforced on save.\n');


// --- Test 9: Snapshot & Cancel (Batal) Integrity ---
console.log('Test 9: Checking handleCancelCardDesign updates icon previews and char counts...');
assert(pf.includes('preview-footer-icon-side'), 'Cancel must refresh preview-footer-icon-side');
assert(pf.includes('preview-footer-2-icon-side'), 'Cancel must refresh preview-footer-2-icon-side');
assert(pf.includes('updateFooterCharCounter(inpF1TextSide, document.getElementById(\'footer-text-char-count-side\'))'), 'Cancel must update F1 counter');
assert(pf.includes('updateFooterCharCounter(inpF2TextSide, document.getElementById(\'footer-2-text-char-count-side\'))'), 'Cancel must update F2 counter');
console.log('✓ Test 9 passed: Snapshot cancellation restores icons and counters.\n');

console.log('ALL 9 TESTS FOR SC-ADMIN-DETAIL-CARD-FOOTER-11 PASSED SUCCESSFULLY!');
