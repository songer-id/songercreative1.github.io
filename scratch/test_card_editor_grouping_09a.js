/**
 * Comprehensive Test Suite for Task SC-ADMIN-CARD-EDITOR-GROUPING-09A
 */

const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SUITE: SC-ADMIN-CARD-EDITOR-GROUPING-09A ===');

const pfCode = fs.readFileSync('js/product-form.js', 'utf8');
const adminCss = fs.readFileSync('css/admin.css', 'utf8');

// --- TEST 1: Teks Penyimpanan "Gunakan Sebagai Default ([Nama Kartu])" ---
console.log('\n--- Test 1: Teks Penyimpanan Default ---');
assert.ok(
  pfCode.includes('Gunakan Sebagai Default (${primaryState.card_variant === \'B\' ? \'Kartu Minimalis\' : (primaryState.card_variant === \'C\' ? \'Kartu Detail\' : \'Kartu Klasik\')})'),
  'Desktop template must contain "Gunakan Sebagai Default ([Nama Kartu])"'
);
assert.ok(
  pfCode.includes('deskLbl.textContent = `Gunakan Sebagai Default (${modelName})`'),
  'updateSaveAsDefaultLabels must use "Gunakan Sebagai Default (${modelName})"'
);
assert.ok(
  pfCode.includes('lblSaveDesk.textContent = `Gunakan Sebagai Default (${modelNameText})`'),
  'Variant change listener must use "Gunakan Sebagai Default (${modelNameText})"'
);
// Confirm old text does NOT exist anywhere in product-form.js
assert.strictEqual(
  pfCode.includes('Gunakan Tema Sebagai Default'),
  false,
  'Old string "Gunakan Tema Sebagai Default" must be completely removed'
);
console.log('✓ "Gunakan Sebagai Default ([Nama Kartu])" format verified across all templates and handlers');

// --- TEST 2: Tipografi font-weight normal ---
console.log('\n--- Test 2: Tipografi font-weight normal ---');
assert.ok(
  adminCss.includes('#card-customization-section'),
  'css/admin.css must contain scoped rules for #card-customization-section'
);
assert.ok(
  adminCss.includes('#card-customization-section-mob'),
  'css/admin.css must contain scoped rules for #card-customization-section-mob'
);
assert.ok(
  adminCss.includes('font-weight: 400 !important;'),
  'css/admin.css must enforce font-weight: 400 !important for card editor'
);

// Check that buttons in accordion have font-normal
assert.ok(pfCode.includes('id="btn-accordion-frame"'), 'btn-accordion-frame exists');
assert.ok(pfCode.includes('id="btn-apply-default-card-design" class="w-full py-1.5 px-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-normal'), 'btn-apply-default-card-design has font-normal');
assert.ok(pfCode.includes('id="btn-cancel-card-design" class="w-1/3 py-2 px-2.5 border border-slate-300 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-normal'), 'btn-cancel-card-design has font-normal');
assert.ok(pfCode.includes('id="btn-save-card-design" class="btn-primary-brand flex-1 py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-normal'), 'btn-save-card-design has font-normal');
console.log('✓ Typography scoped rules and font-normal utility classes verified');

// --- TEST 3: Susunan Accordion Berdasarkan Objek (5 Kelompok) ---
console.log('\n--- Test 3: Susunan Accordion Berdasarkan Objek ---');
const expectedGroups = ['frame', 'text-info', 'badge', 'promo', 'footer'];

// Desktop and Mobile group containers, buttons, bodies, and icons
expectedGroups.forEach(g => {
  assert.ok(pfCode.includes(`id="accordion-group-${g}"`), `Desktop accordion group ${g} exists`);
  assert.ok(pfCode.includes(`id="btn-accordion-${g}"`), `Desktop button ${g} exists`);
  assert.ok(pfCode.includes(`id="accordion-body-${g}"`), `Desktop body ${g} exists`);
  assert.ok(pfCode.includes(`id="accordion-icon-${g}"`), `Desktop icon ${g} exists`);

  assert.ok(pfCode.includes(`id="accordion-group-${g}-mob"`), `Mobile accordion group ${g} exists`);
  assert.ok(pfCode.includes(`id="btn-accordion-${g}-mob"`), `Mobile button ${g} exists`);
  assert.ok(pfCode.includes(`id="accordion-body-${g}-mob"`), `Mobile body ${g} exists`);
  assert.ok(pfCode.includes(`id="accordion-icon-${g}-mob"`), `Mobile icon ${g} exists`);
});
console.log('✓ All 5 accordion groups exist on Desktop and Mobile');

// Verify controls mapping to objects:
// Group 1: frame -> cfg-bg-color, cfg-border-color, cfg-border-radius
const frameDesk = pfCode.slice(pfCode.indexOf('id="accordion-group-frame"'), pfCode.indexOf('id="accordion-group-text-info"'));
assert.ok(frameDesk.includes('id="cfg-bg-color"'), 'Bingkai Kartu contains cfg-bg-color');
assert.ok(frameDesk.includes('id="cfg-border-color"'), 'Bingkai Kartu contains cfg-border-color');
assert.ok(frameDesk.includes('id="cfg-border-radius"'), 'Bingkai Kartu contains cfg-border-radius');
console.log('✓ Bingkai Kartu controls properly placed');

// Group 2: text-info -> cfg-title-color, cfg-price-color, cfg-btn-color, cfg-show-rating, cfg-show-sales
const textInfoDesk = pfCode.slice(pfCode.indexOf('id="accordion-group-text-info"'), pfCode.indexOf('id="accordion-group-badge"'));
assert.ok(textInfoDesk.includes('id="cfg-title-color"'), 'Teks & Info contains cfg-title-color');
assert.ok(textInfoDesk.includes('id="cfg-price-color"'), 'Teks & Info contains cfg-price-color');
assert.ok(textInfoDesk.includes('id="cfg-btn-color"'), 'Teks & Info contains cfg-btn-color');
assert.ok(textInfoDesk.includes('id="cfg-show-rating"'), 'Teks & Info contains cfg-show-rating');
assert.ok(textInfoDesk.includes('id="cfg-show-sales"'), 'Teks & Info contains cfg-show-sales');
console.log('✓ Teks & Informasi controls properly placed');

// Group 3: badge -> cfg-show-badge
const badgeDesk = pfCode.slice(pfCode.indexOf('id="accordion-group-badge"'), pfCode.indexOf('id="accordion-group-promo"'));
assert.ok(badgeDesk.includes('id="cfg-show-badge"'), 'Label Khusus contains cfg-show-badge');
console.log('✓ Label Khusus controls properly placed');

// Group 4: promo -> cfg-show-strike, cfg-show-discount-badge, cfg-show-ticket-icon, cfg-enable-countdown, countdown tokens
const promoDesk = pfCode.slice(pfCode.indexOf('id="accordion-group-promo"'), pfCode.indexOf('id="accordion-group-footer"'));
assert.ok(promoDesk.includes('id="cfg-show-strike"'), 'Promo contains cfg-show-strike');
assert.ok(promoDesk.includes('id="cfg-show-discount-badge"'), 'Promo contains cfg-show-discount-badge');
assert.ok(promoDesk.includes('id="cfg-show-ticket-icon"'), 'Promo contains cfg-show-ticket-icon');
assert.ok(promoDesk.includes('id="cfg-enable-countdown"'), 'Promo contains cfg-enable-countdown');
assert.ok(promoDesk.includes('id="cfg-countdown-bg-color"'), 'Promo contains cfg-countdown-bg-color');
assert.ok(promoDesk.includes('id="cfg-countdown-text-color"'), 'Promo contains cfg-countdown-text-color');
assert.ok(promoDesk.includes('id="cfg-countdown-icon-color"'), 'Promo contains cfg-countdown-icon-color');
assert.ok(promoDesk.includes('id="cfg-countdown-border-color"'), 'Promo contains cfg-countdown-border-color');
assert.ok(promoDesk.includes('id="cfg-countdown-radius"'), 'Promo contains cfg-countdown-radius');
console.log('✓ Promo & Diskon controls properly placed');

// Group 5: footer -> Strip 1 & Strip 2 footer controls
const footerDesk = pfCode.slice(pfCode.indexOf('id="accordion-group-footer"'), pfCode.indexOf('<!-- Pinned Footer Section (Di Bawah Accordion) -->'));
assert.ok(footerDesk.includes('id="input-card-footer-text-side"'), 'Footer contains Strip 1 text');
assert.ok(footerDesk.includes('id="cfg-footer-bg-color-side"'), 'Footer contains Strip 1 bg');
assert.ok(footerDesk.includes('id="cfg-footer-text-color-side"'), 'Footer contains Strip 1 text color');
assert.ok(footerDesk.includes('id="input-card-footer-2-text-side"'), 'Footer contains Strip 2 text');
assert.ok(footerDesk.includes('id="cfg-footer-2-bg-color-side"'), 'Footer contains Strip 2 bg');
assert.ok(footerDesk.includes('id="cfg-footer-2-text-color-side"'), 'Footer contains Strip 2 text color');
console.log('✓ Footer Kartu controls properly placed');

// --- TEST 4: Initial State & Multi-Expand Behavior ---
console.log('\n--- Test 4: Initial State & Multi-Expand Behavior ---');
assert.ok(
  pfCode.includes('frame: true'),
  'First group "frame" must be open on initial session'
);
assert.ok(
  pfCode.includes("'text-info': false"),
  '"text-info" group must be closed on initial session'
);
assert.ok(
  pfCode.includes('badge: false'),
  '"badge" group must be closed on initial session'
);
assert.ok(
  pfCode.includes('promo: false'),
  '"promo" group must be closed on initial session'
);
assert.ok(
  pfCode.includes('footer: false'),
  '"footer" group must be closed on initial session'
);

// --- TEST 5: Eye / Eye-slash toggles ---
console.log('\n--- Test 5: Eye / Eye-slash toggles ---');
const eyeToggles = [
  'cfg-show-rating',
  'cfg-show-sales',
  'cfg-show-strike',
  'cfg-show-discount-badge',
  'cfg-show-ticket-icon',
  'cfg-show-badge',
  'cfg-enable-countdown'
];

eyeToggles.forEach(t => {
  assert.ok(pfCode.includes(`id="${t}"`), `Desktop input ${t} exists`);
  assert.ok(pfCode.includes(`id="${t}-icon-on"`), `Desktop icon-on for ${t} exists`);
  assert.ok(pfCode.includes(`id="${t}-icon-off"`), `Desktop icon-off for ${t} exists`);

  assert.ok(pfCode.includes(`id="${t}-mob"`), `Mobile input ${t}-mob exists`);
  assert.ok(pfCode.includes(`id="${t}-mob-icon-on"`), `Mobile icon-on for ${t}-mob exists`);
  assert.ok(pfCode.includes(`id="${t}-mob-icon-off"`), `Mobile icon-off for ${t}-mob exists`);
});
console.log('✓ All 7 eye/eye-slash toggles intact on Desktop and Mobile');

// --- TEST 6: Panel Sequence in Step 1 ---
console.log('\n--- Test 6: Sequential Layout in Step 1 ---');
const idxSimDesk = pfCode.indexOf('id="cfg-simulate-countdown-preview"');
const idxCardDesk = pfCode.indexOf('id="preview-card-outer-wrapper"');
const idxEditorDesk = pfCode.indexOf('id="card-customization-section"');
const idxPinnedDesk = pfCode.indexOf('id="btn-apply-default-card-design"');

assert.ok(idxSimDesk > 0 && idxCardDesk > 0 && idxEditorDesk > 0 && idxPinnedDesk > 0, 'All layout elements exist');
assert.ok(
  idxSimDesk < idxCardDesk && idxCardDesk < idxEditorDesk && idxEditorDesk < idxPinnedDesk,
  'Desktop layout must follow: Simulasi Diskon -> Live Preview -> Accordion Tools -> Pinned Actions'
);

const idxSimMob = pfCode.indexOf('id="cfg-simulate-countdown-preview-mob"');
const idxCardMob = pfCode.indexOf('id="preview-card-outer-wrapper-mob"');
const idxEditorMob = pfCode.indexOf('id="card-customization-section-mob"');
const idxPinnedMob = pfCode.indexOf('id="btn-apply-default-card-design-mob"');

assert.ok(idxSimMob > 0 && idxCardMob > 0 && idxEditorMob > 0 && idxPinnedMob > 0, 'All mobile layout elements exist');
assert.ok(
  idxSimMob < idxCardMob && idxCardMob < idxEditorMob && idxEditorMob < idxPinnedMob,
  'Mobile layout must follow: Simulasi Diskon -> Live Preview -> Accordion Tools -> Pinned Actions'
);
console.log('✓ Sequential panel order verified on both Desktop and Mobile');

console.log('\n=== ALL SC-ADMIN-CARD-EDITOR-GROUPING-09A TESTS PASSED! ===');
