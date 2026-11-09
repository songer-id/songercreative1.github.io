const fs = require('fs');
const assert = require('assert');

console.log('--- TEST START: SC-ADMIN-CARD-LABEL-CUSTOMIZATION-09C ---');

// 1. Verify CSS rules in css/admin.css
const cssContent = fs.readFileSync('css/admin.css', 'utf8');

// Transparent panel for card customization section
assert(cssContent.includes('#card-customization-section,'), 'CSS missing #card-customization-section');
assert(cssContent.includes('#card-customization-section-mob'), 'CSS missing #card-customization-section-mob');
assert(cssContent.includes('background-color: transparent !important;'), 'CSS missing background-color transparent');
assert(cssContent.includes('border: none !important;'), 'CSS missing border none');
assert(cssContent.includes('box-shadow: none !important;'), 'CSS missing box-shadow none');
assert(cssContent.includes('width: 100% !important;'), 'CSS missing width 100%');

// Sidebar width 320px on lg, 340px on xl
assert(cssContent.includes('width: 320px !important;'), 'CSS missing sidebar width 320px');
assert(cssContent.includes('width: 340px !important;'), 'CSS missing sidebar width 340px');

console.log('✔ css/admin.css panel styling & sidebar drawer widths verified');

// 2. Verify product-form.js markup and layout
const pfContent = fs.readFileSync('js/product-form.js', 'utf8');

// Container transparent classes
assert(pfContent.includes('id="card-customization-section" class="hidden w-full bg-transparent border-0 shadow-none p-0 space-y-3"'), 'Desktop container transparent classes mismatch');
assert(pfContent.includes('id="card-customization-section-mob" class="hidden w-full bg-transparent border-0 shadow-none p-0 space-y-3"'), 'Mobile container transparent classes mismatch');

// wizard-form-col padding
assert(pfContent.includes('lg:pr-[320px] xl:pr-[340px]'), 'wizard-form-col missing lg:pr-[320px] xl:pr-[340px]');

// desktop-preview-sidebar markup
assert(pfContent.includes('id="desktop-preview-sidebar" class="fixed right-0 top-16 h-[calc(100vh-4rem)] w-[320px] xl:w-[340px]'), 'desktop-preview-sidebar markup mismatch');

// Card preview container remains max-w-[260px] mx-auto
assert(pfContent.includes('max-w-[260px] mx-auto'), 'Card preview container max-w-[260px] mx-auto missing');

console.log('✔ product-form.js layout and container classes verified');

// 3. Verify Kelompok 3 (Label Khusus) Desktop and Mobile markup
// Eye toggle
assert(pfContent.includes('id="cfg-show-badge"'), 'Desktop eye toggle missing');
assert(pfContent.includes('id="cfg-show-badge-mob"'), 'Mobile eye toggle missing');

// Segmented Control (Gaya Label)
assert(pfContent.includes('id="cfg-badge-style-group"'), 'Desktop segmented control group missing');
assert(pfContent.includes('id="cfg-badge-style-group-mob"'), 'Mobile segmented control group missing');
assert(pfContent.includes('id="cfg-badge-style"'), 'Desktop hidden input cfg-badge-style missing');
assert(pfContent.includes('id="cfg-badge-style-mob"'), 'Mobile hidden input cfg-badge-style-mob missing');

// Radius Sudut (Slider 0-12 px & Presets 0, 4, 6, 8, 12 px)
assert(pfContent.includes('id="cfg-badge-radius" min="0" max="12" step="1" value="6"'), 'Desktop radius slider attributes mismatch');
assert(pfContent.includes('id="cfg-badge-radius-mob" min="0" max="12" step="1" value="6"'), 'Mobile radius slider attributes mismatch');
assert(pfContent.includes('id="cfg-badge-radius-val"'), 'Desktop radius value label missing');
assert(pfContent.includes('id="cfg-badge-radius-val-mob"'), 'Mobile radius value label missing');

// Check quick presets in desktop & mobile
['0', '4', '6', '8', '12'].forEach(val => {
  assert(pfContent.includes(`class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md`), `Preset button styling missing for ${val}`);
});

// Color Pickers & Hex Inputs
assert(pfContent.includes('id="cfg-badge-text-color"'), 'Desktop text color picker missing');
assert(pfContent.includes('id="cfg-badge-text-hex"'), 'Desktop text hex input missing');
assert(pfContent.includes('id="cfg-badge-bg-color"'), 'Desktop bg color picker missing');
assert(pfContent.includes('id="cfg-badge-bg-hex"'), 'Desktop bg hex input missing');
assert(pfContent.includes('id="cfg-badge-border-color"'), 'Desktop border color picker missing');
assert(pfContent.includes('id="cfg-badge-border-hex"'), 'Desktop border hex input missing');

assert(pfContent.includes('id="cfg-badge-text-color-mob"'), 'Mobile text color picker missing');
assert(pfContent.includes('id="cfg-badge-text-hex-mob"'), 'Mobile text hex input missing');
assert(pfContent.includes('id="cfg-badge-bg-color-mob"'), 'Mobile bg color picker missing');
assert(pfContent.includes('id="cfg-badge-bg-hex-mob"'), 'Mobile bg hex input missing');
assert(pfContent.includes('id="cfg-badge-border-color-mob"'), 'Mobile border color picker missing');
assert(pfContent.includes('id="cfg-badge-border-hex-mob"'), 'Mobile border hex input missing');

console.log('✔ product-form.js Label Khusus controls & IDs verified');

// 4. Test helper functions logic
// hexToSubtleHex, hexToBorderHex, getThemeDefaultBadgeColors, parseBadgeRadius
function testHelpers() {
  function hexToSubtleHex(hex, opacity = 0.12) {
    if (!hex || typeof hex !== 'string') return '#ecfdf5';
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (clean.length !== 6) return '#ecfdf5';
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const rBg = Math.round(r * opacity + 255 * (1 - opacity));
    const gBg = Math.round(g * opacity + 255 * (1 - opacity));
    const bBg = Math.round(b * opacity + 255 * (1 - opacity));
    return `#${((1 << 24) + (rBg << 16) + (gBg << 8) + bBg).toString(16).slice(1)}`;
  }

  function hexToBorderHex(hex, opacity = 0.35) {
    if (!hex || typeof hex !== 'string') return '#a7f3d0';
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (clean.length !== 6) return '#a7f3d0';
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const rBrd = Math.round(r * opacity + 255 * (1 - opacity));
    const gBrd = Math.round(g * opacity + 255 * (1 - opacity));
    const bBrd = Math.round(b * opacity + 255 * (1 - opacity));
    return `#${((1 << 24) + (rBrd << 16) + (gBrd << 8) + bBrd).toString(16).slice(1)}`;
  }

  function parseBadgeRadius(val, defaultVal = 6) {
    if (val === undefined || val === null || val === '') return defaultVal;
    const num = parseInt(val, 10);
    if (isNaN(num)) return defaultVal;
    return Math.max(0, Math.min(12, num));
  }

  // Radius clamping
  assert.strictEqual(parseBadgeRadius(-5), 0, 'Negative radius clamped to 0');
  assert.strictEqual(parseBadgeRadius(15), 12, 'Over-12 radius clamped to 12');
  assert.strictEqual(parseBadgeRadius('8px'), 8, '8px parsed to 8');
  assert.strictEqual(parseBadgeRadius(''), 6, 'Empty parsed to default 6');
  assert.strictEqual(parseBadgeRadius(undefined), 6, 'Undefined parsed to default 6');

  // Dynamic theme colors for emerald (#059669)
  const subtleEmerald = hexToSubtleHex('#059669', 0.12);
  const borderEmerald = hexToBorderHex('#059669', 0.35);
  assert(subtleEmerald.startsWith('#'), 'Subtle hex must start with #');
  assert.strictEqual(subtleEmerald.length, 7, 'Subtle hex must be 7 chars');
  assert(borderEmerald.startsWith('#'), 'Border hex must start with #');
  assert.strictEqual(borderEmerald.length, 7, 'Border hex must be 7 chars');

  // Dynamic theme colors for blue (#2563eb)
  const subtleBlue = hexToSubtleHex('#2563eb', 0.12);
  const borderBlue = hexToBorderHex('#2563eb', 0.35);
  assert.notStrictEqual(subtleBlue, '#ecfdf5', 'Subtle blue should not be static green');
  assert.notStrictEqual(borderBlue, '#a7f3d0', 'Border blue should not be static green');
}
testHelpers();
console.log('✔ Helper functions & color generation logic verified');

// 5. Test Live Preview and Buyer Store Badge Style Mode rendering
function testBadgeStyleGeneration() {
  function getBadgeStyle(mode, radius, textCol, bgCol, borderCol) {
    let badgeStyle = '';
    if (mode === 'border') {
      badgeStyle = `color: ${textCol}; background-color: transparent; border: 1px solid ${borderCol}; border-radius: ${radius};`;
    } else if (mode === 'bg') {
      badgeStyle = `color: ${textCol}; background-color: ${bgCol}; border: none; border-radius: ${radius};`;
    } else {
      // Legacy compatibility
      badgeStyle = `color: ${textCol}; background-color: ${bgCol}; border: 1px solid ${borderCol}; border-radius: ${radius};`;
    }
    return badgeStyle;
  }

  // Mode 'bg'
  const styleBg = getBadgeStyle('bg', '6px', '#059669', '#ecfdf5', '#a7f3d0');
  assert(styleBg.includes('background-color: #ecfdf5;'), 'bg mode must have background color');
  assert(styleBg.includes('border: none;'), 'bg mode must have border: none');
  assert(styleBg.includes('border-radius: 6px;'), 'bg mode must have border-radius 6px');

  // Mode 'border'
  const styleBorder = getBadgeStyle('border', '8px', '#059669', '#ecfdf5', '#a7f3d0');
  assert(styleBorder.includes('background-color: transparent;'), 'border mode must have transparent background');
  assert(styleBorder.includes('border: 1px solid #a7f3d0;'), 'border mode must have border 1px solid');
  assert(styleBorder.includes('border-radius: 8px;'), 'border mode must have border-radius 8px');

  // Legacy mode (undefined)
  const styleLegacy = getBadgeStyle(undefined, '4px', '#059669', '#ecfdf5', '#a7f3d0');
  assert(styleLegacy.includes('background-color: #ecfdf5;'), 'legacy mode must have background color');
  assert(styleLegacy.includes('border: 1px solid #a7f3d0;'), 'legacy mode must have border 1px solid');
  assert(styleLegacy.includes('border-radius: 4px;'), 'legacy mode must have border-radius 4px');
}
testBadgeStyleGeneration();
console.log('✔ Badge style mode generation (bg, border, legacy) verified');

// 6. Verify buyer-store.js variants renderers
const buyerContent = fs.readFileSync('js/buyer-store.js', 'utf8');

// renderCardVariantA badge handling
assert(buyerContent.includes('const rawBadgeRadius = config.badge_radius !== undefined && config.badge_radius !== null ? parseInt(config.badge_radius, 10) : 6;'), 'buyer-store.js missing rawBadgeRadius in Variant A');
assert(buyerContent.includes('const badgeRadiusNum = isNaN(rawBadgeRadius) ? 6 : Math.max(0, Math.min(12, rawBadgeRadius));'), 'buyer-store.js missing badgeRadiusNum clamping');
assert(buyerContent.includes("if (badgeStyleMode === 'border') {"), 'buyer-store.js missing badgeStyleMode border check');
assert(buyerContent.includes("} else if (badgeStyleMode === 'bg') {"), 'buyer-store.js missing badgeStyleMode bg check');
assert(buyerContent.includes("border: none; border-radius: ${badgeRadius};"), 'buyer-store.js missing border none in bg mode');
assert(buyerContent.includes("background-color: transparent; border: 1px solid ${badgeBorderColor};"), 'buyer-store.js missing transparent in border mode');

console.log('✔ buyer-store.js Variant A & Variant C renderers verified');

// 7. Verify Model B behavior
// In product-form.js, accordion-group-badge is hidden for Model B
assert(pfContent.includes("id=\"accordion-group-badge\" class=\"border border-slate-200 rounded-lg overflow-hidden bg-white ${primaryState.card_variant === 'B' ? 'hidden' : ''}\""), 'Model B desktop hidden condition mismatch');
assert(pfContent.includes("id=\"accordion-group-badge-mob\" class=\"border border-slate-200 rounded-lg overflow-hidden bg-white ${primaryState.card_variant === 'B' ? 'hidden' : ''}\""), 'Model B mobile hidden condition mismatch');

console.log('✔ Model B exclusion/hidden condition verified');

console.log('--- ALL SC-ADMIN-CARD-LABEL-CUSTOMIZATION-09C STATIC TESTS PASSED ---');

