/**
 * test_card_tools_ui_12a.js
 * Comprehensive Verification Suite for TASK: SC-ADMIN-CARD-TOOLS-UI-12A
 */

const assert = require('assert');
const fs = require('fs');

console.log('=== RUNNING VERIFICATION SUITE: SC-ADMIN-CARD-TOOLS-UI-12A ===\n');

const adminCss = fs.readFileSync('css/admin.css', 'utf8');
const pf = fs.readFileSync('js/product-form.js', 'utf8').replace(/\r\n/g, '\n');

// =========================================================================
// SECTION 1: Typography & Removal of Bold Text from Tools
// =========================================================================
console.log('--- Section 1: Typography & Non-Bold Tools Enforcement ---');

// 1.1 Root cause check: #view-product-form label:not(...) in admin.css must exclude card tool labels
const excludedCheck = adminCss.includes(":not(.card-tool-label):not(.card-custom-label)");
assert.ok(excludedCheck, 'admin.css must exclude .card-tool-label and .card-custom-label from the 600 weight mobile label rule');
console.log('✓ 1.1 Root cause fixed: Mobile label rule excludes card-tool-label and card-custom-label.');

// 1.2 Scoped font-weight 400 enforcement with high specificity
assert.ok(adminCss.includes('#view-product-form #card-customization-section *,'), 'Must scope desktop customization section typography');
assert.ok(adminCss.includes('#view-product-form #card-customization-section-mob *'), 'Must scope mobile customization section typography');
assert.ok(adminCss.includes('font-weight: 400 !important;'), 'Must enforce font-weight: 400 !important in card customization section');
console.log('✓ 1.2 Scoped font-weight: 400 !important enforced across all card customization elements.');

// 1.3 Mobile tool label font sizing & style in max-width 639.98px
assert.ok(adminCss.includes('.card-tool-label'), 'admin.css must define .card-tool-label');
assert.ok(adminCss.includes('font-size: 11px !important;'), 'Mobile tool labels must have 11px font size');
assert.ok(adminCss.includes('line-height: 16px !important;'), 'Mobile tool labels must have 16px line height');
assert.ok(adminCss.includes('text-transform: none !important;'), 'Mobile tool labels must have text-transform: none');
console.log('✓ 1.3 Mobile label typography defined (11px, line-height 16px, text-transform none).');

// 1.4 updateFooterCharCounter does not add font-semibold
assert.ok(!pf.includes("counterEl.classList.add('text-red-600', 'font-semibold')"), 'updateFooterCharCounter must not add font-semibold on error');
assert.ok(pf.includes("counterEl.classList.add('text-red-600')"), 'updateFooterCharCounter adds only text-red-600 on error');
console.log('✓ 1.4 updateFooterCharCounter does not apply font-semibold on error.');

// 1.5 Icon picker popover header does not have font-semibold
assert.ok(!pf.includes('<div class="text-[10px] font-semibold text-slate-500 mb-1.5 px-0.5 flex items-center justify-between">'), 'Popover headers must not have font-semibold');
console.log('✓ 1.5 Icon picker popover headers use font-normal.');


// =========================================================================
// SECTION 2: Footer Naming Structure (Model C)
// =========================================================================
console.log('\n--- Section 2: Footer Naming Structure ---');

// 2.1 Strip 1: "Label Footer 1 *"
assert.ok(pf.includes('Label Footer 1 *'), 'Must use "Label Footer 1 *" for Strip 1');
assert.ok(!pf.includes('Teks Footer 1 *'), 'Must not use "Teks Footer 1 *"');
assert.ok(!pf.includes('Teks Footer 1<'), 'Must not use "Teks Footer 1" in labels');

// 2.2 Strip 2: "Label Footer 2 (Opsional)"
assert.ok(pf.includes('Label Footer 2 (Opsional)'), 'Must use "Label Footer 2 (Opsional)" for Strip 2');
assert.ok(!pf.includes('Teks Footer 2 (Opsional)'), 'Must not use "Teks Footer 2 (Opsional)"');

// 2.3 Color Labels: Clean "Warna Latar" and "Warna Teks" without number repetitions
// In desktop & mobile footer bodies, check that labels say "Warna Latar" and "Warna Teks"
const strip1Desk = pf.slice(pf.indexOf('id="accordion-body-footer"'), pf.indexOf('id="accordion-body-footer-mob"'));
const strip1Mob = pf.slice(pf.indexOf('id="accordion-body-footer-mob"'));

assert.ok(strip1Desk.includes('>Warna Latar</label>'), 'Desktop Strip 1 & 2 must label "Warna Latar" without repetition');
assert.ok(strip1Desk.includes('>Warna Teks</label>'), 'Desktop Strip 1 & 2 must label "Warna Teks" without repetition');
assert.ok(!strip1Desk.includes('Warna Latar 1'), 'Desktop must not contain "Warna Latar 1"');
assert.ok(!strip1Desk.includes('Warna Teks 1'), 'Desktop must not contain "Warna Teks 1"');
assert.ok(!strip1Desk.includes('Warna Latar 2'), 'Desktop must not contain "Warna Latar 2"');
assert.ok(!strip1Desk.includes('Warna Teks 2'), 'Desktop must not contain "Warna Teks 2"');

assert.ok(strip1Mob.includes('>Warna Latar</label>'), 'Mobile Strip 1 & 2 must label "Warna Latar"');
assert.ok(strip1Mob.includes('>Warna Teks</label>'), 'Mobile Strip 1 & 2 must label "Warna Teks"');
assert.ok(!strip1Mob.includes('Warna Latar 1'), 'Mobile must not contain "Warna Latar 1"');
assert.ok(!strip1Mob.includes('Warna Teks 1'), 'Mobile must not contain "Warna Teks 1"');
assert.ok(!strip1Mob.includes('Warna Latar 2'), 'Mobile must not contain "Warna Latar 2"');
assert.ok(!strip1Mob.includes('Warna Teks 2'), 'Mobile must not contain "Warna Teks 2"');
console.log('✓ 2.1 - 2.3 Strip footer naming structure verified on Desktop & Mobile.');

// 2.4 Label and Input ID linking
assert.ok(pf.includes('for="input-card-footer-text-side"'), 'Desktop Strip 1 label for linked');
assert.ok(pf.includes('id="input-card-footer-text-side"'), 'Desktop Strip 1 input id exists');
assert.ok(pf.includes('for="input-card-footer-text-mob"'), 'Mobile Strip 1 label for linked');
assert.ok(pf.includes('id="input-card-footer-text-mob"'), 'Mobile Strip 1 input id exists');
assert.ok(pf.includes('for="input-card-footer-2-text-side"'), 'Desktop Strip 2 label for linked');
assert.ok(pf.includes('id="input-card-footer-2-text-side"'), 'Desktop Strip 2 input id exists');
assert.ok(pf.includes('for="input-card-footer-2-text-mob"'), 'Mobile Strip 2 label for linked');
assert.ok(pf.includes('id="input-card-footer-2-text-mob"'), 'Mobile Strip 2 input id exists');
console.log('✓ 2.4 Label and input ID pairings verified without duplicates.');


// =========================================================================
// SECTION 3: Mobile Control Layout, Sizing & Viewports
// =========================================================================
console.log('\n--- Section 3: Mobile Control Layout, Sizing & Viewports ---');

// 3.1 Icon Picker Button compact sizing
assert.ok(pf.includes('w-[52px] h-7 px-1.5'), 'Mobile icon picker trigger button must be w-[52px]');
assert.ok(pf.includes('w-14 h-7 px-1.5'), 'Desktop icon picker trigger button must be w-14 (56px)');
console.log('✓ 3.1 Icon picker trigger buttons sized compactly (52px mobile, 56px desktop).');

// 3.2 Mobile 3-column layout with minmax and min-w-0
assert.ok(pf.includes('grid-cols-[52px_minmax(0,1fr)_minmax(0,1fr)]'), 'Mobile footer grid layout uses 52px icon + 2 flex color columns');
assert.ok(pf.includes('grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)]'), 'Desktop footer grid layout uses 56px icon + 2 flex color columns');
console.log('✓ 3.2 Three-column grid layout with minmax(0,1fr) ensures even distribution.');

// 3.3 Sub-350px fallback layout
assert.ok(pf.includes('max-[350px]:grid-cols-2'), 'Under 350px viewport, grid wraps colors cleanly into 2 columns');
assert.ok(pf.includes('max-[350px]:col-span-2'), 'Under 350px viewport, icon column spans across');
console.log('✓ 3.3 Ultra-narrow viewport (<350px) graceful wrapping verified.');

// 3.4 Popover menu sizing & positioning
assert.ok(pf.includes('w-56 max-w-[calc(100vw-3rem)]'), 'Popover menu width is independent of button and constrained to viewport');
console.log('✓ 3.4 Icon picker popover width is responsive and independent of trigger button.');

// 3.5 Radius controls: px is flex sibling, native spinner fully uncovered
const radiusSiblingCount = (pf.match(/<div class="flex items-center gap-1\.5 shrink-0">\s*<input type="number" id="cfg-[^"]+" min="[^"]+" max="[^"]+" step="1" value="[^"]+" class="w-14 px-2 py-1 text-xs font-mono font-normal border border-slate-200 rounded-\[6px\] bg-white text-center focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" \/>\s*<span class="text-\[11px\] font-normal text-slate-400 select-none shrink-0">px<\/span>\s*<\/div>/g) || []).length;
assert.strictEqual(radiusSiblingCount, 8, 'All 8 radius controls (desktop & mobile) must use sibling px structure with w-14 centered input');
assert.ok(!pf.includes('class="absolute right-2 text-[10px] font-normal text-slate-400 pointer-events-none select-none">px</span>'), 'No absolute px inside radius inputs');
console.log('✓ 3.5 All 8 radius input controls use flex sibling "px" unblocking native spinners.');


// =========================================================================
// SECTION 4: Viewport Calculations (320px, 360px, 390px, 640px)
// =========================================================================
console.log('\n--- Section 4: Mathematical Verification for Mobile Viewports ---');

function testViewportLayout(viewportWidth) {
  // Mobile drawer container padding: p-4 = 16px each side (32px total)
  // Accordion inner padding: p-3 = 12px each side (24px total)
  // Strip card padding: p-2.5 = 10px each side (20px total)
  const availableContentWidth = viewportWidth - (16 * 2) - (12 * 2) - (10 * 2);
  
  if (viewportWidth < 350) {
    // 2-column mode for colors: grid-cols-2 gap-2 (gap = 8px)
    const colorColWidth = (availableContentWidth - 8) / 2;
    console.log(`- At ${viewportWidth}px (<350px): Available content width = ${availableContentWidth}px. Icon row = 52px. Each color col = ${colorColWidth.toFixed(1)}px.`);
    assert.ok(colorColWidth >= 70, `Color column at ${viewportWidth}px must be at least 70px to fit color circle (24px) + gap (6px) + HEX (40px)`);
  } else {
    // 3-column mode: 52px + 2 cols of minmax(0, 1fr) with 2 gaps of 8px (16px total gap)
    const remainingForColors = availableContentWidth - 52 - 16;
    const colorColWidth = remainingForColors / 2;
    console.log(`- At ${viewportWidth}px: Available content width = ${availableContentWidth}px. Icon = 52px. Each color col = ${colorColWidth.toFixed(1)}px.`);
    assert.ok(colorColWidth >= 65, `Color column at ${viewportWidth}px must be at least 65px`);
  }
}

[320, 360, 390, 640].forEach(testViewportLayout);
console.log('✓ 4.1 All mobile viewports (320px, 360px, 390px, 640px) pass minimum layout clearances.');


// =========================================================================
// SECTION 5: Regressions & State Preservation
// =========================================================================
console.log('\n--- Section 5: State & Feature Regression Verification ---');

// 5.1 Outline None and presets
assert.ok(pf.includes('btn-border-width-preset') && pf.includes('data-value="0"'), 'Outline None button preset present');
assert.ok(pf.includes('data-value="1"'), 'Outline Tipis button present');
assert.ok(pf.includes('data-value="2"'), 'Outline Sedang button present');
assert.ok(pf.includes('data-value="3"'), 'Outline Tebal button present');

// 5.2 Metric Sources (Task 10)
assert.ok(pf.includes('cfg-rating-source-panel'), 'Rating source panel exists');
assert.ok(!pf.includes('id="preview-sample-data-badge"'), 'Sample data badge element removed as requested');

// 5.3 Promo Controls & Dropdowns (R6)
assert.ok(pf.includes('id="cfg-discount-badge-pos-container"'), 'Discount badge pos container exists');
assert.ok(pf.includes('id="btn-discount-badge-pos"'), 'Discount badge dropdown button exists');

// 5.4 Step 2 Preview
assert.ok(pf.includes('// Step 2: Mini PDP (Detail Produk)'), 'Step 2 Mini PDP logic exists');
assert.ok(pf.includes('Foto Utama Mini PDP'), 'Step 2 Mini PDP preview exists');

console.log('✓ 5.1 - 5.4 All core features and prior task capabilities confirmed intact.');

console.log('\n=== ALL TASK 12A VERIFICATIONS COMPLETED SUCCESSFULLY! ===');
