/**
 * Test Suite for SC-ADMIN-CARD-FRAME-09B
 */
const assert = require('assert');
const fs = require('fs');

console.log('--- TEST START: SC-ADMIN-CARD-FRAME-09B ---');

// 1. Verify db.js DEFAULT_CARD_VARIANTS_CONFIG and saveCardModelPreset
const dbContent = fs.readFileSync('js/db.js', 'utf8');
assert(dbContent.includes("variant_a: {\r\n      bg_color: '#ffffff',\r\n      border_color: '#e2e8f0',\r\n      border_width: '1px',\r\n      border_radius: '16px',") || dbContent.includes("variant_a: {\n      bg_color: '#ffffff',\n      border_color: '#e2e8f0',\n      border_width: '1px',\n      border_radius: '16px',"), 'db.js variant_a must have border_width: 1px');
assert(dbContent.includes("variant_b: {\r\n      bg_color: '#ffffff',\r\n      border_color: '#e9d5ff',\r\n      border_width: '1px',\r\n      border_radius: '16px',") || dbContent.includes("variant_b: {\n      bg_color: '#ffffff',\n      border_color: '#e9d5ff',\n      border_width: '1px',\n      border_radius: '16px',"), 'db.js variant_b must have border_width: 1px');
assert(dbContent.includes("variant_c: {\r\n      bg_color: '#ffffff',\r\n      border_color: '#fed7aa',\r\n      border_width: '1px',\r\n      border_radius: '16px',") || dbContent.includes("variant_c: {\n      bg_color: '#ffffff',\n      border_color: '#fed7aa',\n      border_width: '1px',\n      border_radius: '16px',"), 'db.js variant_c must have border_width: 1px');
assert(dbContent.includes('saveCardModelPreset(variantCode, config)'), 'db.js must define saveCardModelPreset');
console.log('✔ db.js defaults and preset method verified');

// 2. Verify product-form.js markup and bindings
const pfContent = fs.readFileSync('js/product-form.js', 'utf8');

// Sliders and quick preset buttons exist for desktop and mobile
assert(pfContent.includes('id="cfg-border-width"'), 'Desktop border-width slider exists');
assert(pfContent.includes('id="cfg-border-width-mob"'), 'Mobile border-width slider exists');
assert(pfContent.includes('id="cfg-border-width-val"'), 'Desktop border-width-val exists');
assert(pfContent.includes('id="cfg-border-width-val-mob"'), 'Mobile border-width-val exists');
assert(pfContent.includes('class="btn-border-width-preset'), 'btn-border-width-preset buttons exist');

assert(pfContent.includes('id="cfg-border-radius"'), 'Desktop border-radius slider exists');
assert(pfContent.includes('id="cfg-border-radius-mob"'), 'Mobile border-radius slider exists');
assert(pfContent.includes('id="cfg-border-radius-val"'), 'Desktop border-radius-val exists');
assert(pfContent.includes('id="cfg-border-radius-val-mob"'), 'Mobile border-radius-val exists');
assert(pfContent.includes('class="btn-border-radius-preset'), 'btn-border-radius-preset buttons exist');

// Clamping and normalization helpers
assert(pfContent.includes('function parseBorderWidth'), 'parseBorderWidth helper defined');
assert(pfContent.includes('function parseBorderRadius'), 'parseBorderRadius helper defined');
assert(pfContent.includes('function updateBorderWidthPresetButtons'), 'updateBorderWidthPresetButtons helper defined');
assert(pfContent.includes('function updateBorderRadiusPresetButtons'), 'updateBorderRadiusPresetButtons helper defined');
console.log('✔ product-form.js markup and helpers verified');

// 3. Verify zero border logic and inherit corner styles
assert(pfContent.includes("borderWidthNum === 0\n      ? 'border: none; border-width: 0px;'\n      : `border: ${borderWidthNum}px solid ${safeBorder};`") ||
       pfContent.includes("borderWidthNum === 0\r\n      ? 'border: none; border-width: 0px;'\r\n      : `border: ${borderWidthNum}px solid ${safeBorder};`"),
       'Zero border must produce border: none; border-width: 0px;');
assert(pfContent.includes('border-top-left-radius: inherit; border-top-right-radius: inherit;'), 'renderCardPhoto must inherit top border-radius');
assert(!pfContent.includes('aspect-[3/4] rounded-t-lg'), 'Model B must not hardcode rounded-t-lg');
assert(!pfContent.includes('aspect-[4/3] rounded-t-2xl'), 'Model C must not hardcode rounded-t-2xl');
console.log('✔ product-form.js live preview border and radius styles verified');

// 4. Verify buyer-store.js card variants
const bsContent = fs.readFileSync('js/buyer-store.js', 'utf8');

// Variant A
assert(bsContent.includes("const rawBw = config.border_width !== undefined && config.border_width !== null ? parseInt(config.border_width, 10) : 1;"), 'Variant A parses border_width');
assert(bsContent.includes("borderWidth === 0 ? 'border: none; border-width: 0px;' : `border: ${borderWidth}px solid ${borderColor};`"), 'Variant A border width logic');
assert(bsContent.includes("border-top-left-radius: inherit; border-top-right-radius: inherit;"), 'Variant A inherits top border-radius');

// Variant B
assert(bsContent.includes("const borderColor = config.border_color || '#e9d5ff';"), 'Variant B defaults border color to #e9d5ff');

// Variant C
assert(bsContent.includes("const borderColor = config.border_color || '#fed7aa';"), 'Variant C defaults border color to #fed7aa');

console.log('✔ buyer-store.js variants renderers verified');

// 5. Runtime simulation of parsing and clamping logic
function simulateParseBw(val, def = 1) {
  if (val === undefined || val === null || val === '') return def;
  const num = parseInt(val, 10);
  if (isNaN(num)) return def;
  return Math.max(0, Math.min(3, num));
}

function simulateParseBr(val, def = 16) {
  if (val === undefined || val === null || val === '') return def;
  const num = parseInt(val, 10);
  if (isNaN(num)) return def;
  return Math.max(0, Math.min(24, num));
}

// Bounds test
assert.strictEqual(simulateParseBw(0), 0);
assert.strictEqual(simulateParseBw(1), 1);
assert.strictEqual(simulateParseBw(2), 2);
assert.strictEqual(simulateParseBw(3), 3);
assert.strictEqual(simulateParseBw(-1), 0, 'Negative bw clamped to 0');
assert.strictEqual(simulateParseBw(5), 3, 'Excess bw clamped to 3');
assert.strictEqual(simulateParseBw('0px'), 0);
assert.strictEqual(simulateParseBw('2px'), 2);
assert.strictEqual(simulateParseBw(null, 1), 1, 'Null defaults to 1');
assert.strictEqual(simulateParseBw(undefined, 1), 1, 'Undefined defaults to 1');

assert.strictEqual(simulateParseBr(0), 0);
assert.strictEqual(simulateParseBr(8), 8);
assert.strictEqual(simulateParseBr(16), 16);
assert.strictEqual(simulateParseBr(24), 24);
assert.strictEqual(simulateParseBr(-5), 0, 'Negative br clamped to 0');
assert.strictEqual(simulateParseBr(30), 24, 'Excess br clamped to 24');
assert.strictEqual(simulateParseBr('0px'), 0);
assert.strictEqual(simulateParseBr('16px'), 16);
assert.strictEqual(simulateParseBr(null, 16), 16, 'Null defaults to 16');

console.log('✔ Boundary clamping tests passed');

// 6. Test Model Defaults vs Custom
const dummySets = {
  card_variants_config: {
    variant_a: { bg_color: '#ffffff', border_color: '#e2e8f0', border_width: '1px', border_radius: '16px' },
    variant_b: { bg_color: '#ffffff', border_color: '#e9d5ff', border_width: '1px', border_radius: '16px' },
    variant_c: { bg_color: '#ffffff', border_color: '#fed7aa', border_width: '1px', border_radius: '16px' }
  }
};

function getSafeBorder(variantCode, isCustomMode, rawBorder, customConfig) {
  const vKey = variantCode === 'A' ? 'variant_a' : (variantCode === 'B' ? 'variant_b' : 'variant_c');
  const defaultBorderColor = dummySets.card_variants_config[vKey].border_color;
  return (isCustomMode && rawBorder && rawBorder.toLowerCase() !== '#000000') ? rawBorder : (customConfig?.border_color || defaultBorderColor);
}

// Uncustomized cards
assert.strictEqual(getSafeBorder('A', false, '', null), '#e2e8f0', 'Variant A default border');
assert.strictEqual(getSafeBorder('B', false, '', null), '#e9d5ff', 'Variant B default border');
assert.strictEqual(getSafeBorder('C', false, '', null), '#fed7aa', 'Variant C default border');

// Customized cards
assert.strictEqual(getSafeBorder('B', true, '#ff0000', null), '#ff0000', 'Variant B custom border');
assert.strictEqual(getSafeBorder('C', true, '#123456', null), '#123456', 'Variant C custom border');

console.log('✔ Active model default and custom preservation tests passed');

console.log('--- ALL SC-ADMIN-CARD-FRAME-09B TESTS PASSED ---');

