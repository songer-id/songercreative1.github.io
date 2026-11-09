const fs = require('fs');
const assert = require('assert');

console.log('--- TEST START: SC-ADMIN-CARD-PROMO-CUSTOMIZATION-09C-R1 (STATIC & DOM) ---');

// 1. Verify product-form.js content
const pfContent = fs.readFileSync('js/product-form.js', 'utf8');

// A. No separate accordion-group-badge
assert(!pfContent.includes('id="accordion-group-badge"'), 'accordion-group-badge must not exist as separate accordion');
assert(!pfContent.includes('id="accordion-group-badge-mob"'), 'accordion-group-badge-mob must not exist as separate accordion');
assert(!pfContent.includes('id="btn-accordion-badge"'), 'btn-accordion-badge must not exist');
assert(!pfContent.includes('id="btn-accordion-badge-mob"'), 'btn-accordion-badge-mob must not exist');
console.log('✔ Verified no separate accordion-group-badge exists');

// B. Promo & Diskon accordion contains all 5 items
assert(pfContent.includes('id="accordion-group-promo"'), 'accordion-group-promo must exist');
assert(pfContent.includes('id="accordion-group-promo-mob"'), 'accordion-group-promo-mob must exist');

// 1. Harga Coret
assert(pfContent.includes('id="cfg-show-strike"'), 'cfg-show-strike must exist');
assert(pfContent.includes('id="cfg-show-strike-mob"'), 'cfg-show-strike-mob must exist');
assert(pfContent.includes('id="cfg-strike-panel-desk"'), 'cfg-strike-panel-desk must exist');
assert(pfContent.includes('id="cfg-strike-panel-mob"'), 'cfg-strike-panel-mob must exist');
assert(pfContent.includes('id="cfg-strike-color"'), 'cfg-strike-color must exist');
assert(pfContent.includes('id="cfg-strike-hex"'), 'cfg-strike-hex must exist');

// 2. Label Diskon
assert(pfContent.includes('<span>Label Diskon</span>'), 'Display name must be Label Diskon');
assert(pfContent.includes('id="cfg-show-discount-badge"'), 'cfg-show-discount-badge must exist');
assert(pfContent.includes('id="cfg-show-discount-badge-mob"'), 'cfg-show-discount-badge-mob must exist');
assert(pfContent.includes('id="cfg-discount-badge-panel-desk"'), 'cfg-discount-badge-panel-desk must exist');
assert(pfContent.includes('id="cfg-discount-badge-panel-mob"'), 'cfg-discount-badge-panel-mob must exist');
assert(pfContent.includes('id="cfg-discount-badge-radius" min="0" max="12" step="1"'), 'cfg-discount-badge-radius attributes mismatch');
assert(pfContent.includes('id="cfg-discount-badge-radius-mob" min="0" max="12" step="1"'), 'cfg-discount-badge-radius-mob attributes mismatch');
assert(pfContent.includes('id="cfg-discount-badge-radius-val"'), 'cfg-discount-badge-radius-val must exist');
assert(pfContent.includes('id="cfg-discount-badge-radius-val-mob"'), 'cfg-discount-badge-radius-val-mob must exist');
assert(pfContent.includes('id="cfg-discount-badge-position-group"'), 'cfg-discount-badge-position-group must exist');
assert(pfContent.includes('id="cfg-discount-badge-position-group-mob"'), 'cfg-discount-badge-position-group-mob must exist');
assert(pfContent.includes('data-pos="top-left"'), 'data-pos top-left must exist');
assert(pfContent.includes('data-pos="top-right"'), 'data-pos top-right must exist');
assert(pfContent.includes('data-pos="bottom-left"'), 'data-pos bottom-left must exist');
assert(pfContent.includes('data-pos="bottom-right"'), 'data-pos bottom-right must exist');

// 3. Ikon Tiket
assert(pfContent.includes('id="cfg-show-ticket-icon"'), 'cfg-show-ticket-icon must exist');
assert(pfContent.includes('id="cfg-show-ticket-icon-mob"'), 'cfg-show-ticket-icon-mob must exist');

// 4. Countdown
assert(pfContent.includes('id="cfg-enable-countdown"'), 'cfg-enable-countdown must exist');
assert(pfContent.includes('id="cfg-enable-countdown-mob"'), 'cfg-enable-countdown-mob must exist');
assert(pfContent.includes('id="cfg-countdown-panel-desk"'), 'cfg-countdown-panel-desk must exist');
assert(pfContent.includes('id="cfg-countdown-panel-mob"'), 'cfg-countdown-panel-mob must exist');
assert(pfContent.includes('id="cfg-countdown-radius" min="0" max="12" step="1"'), 'cfg-countdown-radius attributes mismatch');
assert(pfContent.includes('id="cfg-countdown-radius-mob" min="0" max="12" step="1"'), 'cfg-countdown-radius-mob attributes mismatch');
assert(pfContent.includes('id="cfg-countdown-radius-val"'), 'cfg-countdown-radius-val must exist');
assert(pfContent.includes('id="cfg-countdown-radius-val-mob"'), 'cfg-countdown-radius-val-mob must exist');

// 5. Label Khusus
assert(pfContent.includes('id="cfg-badge-container-desk"'), 'cfg-badge-container-desk must exist inside promo');
assert(pfContent.includes('id="cfg-badge-container-mob"'), 'cfg-badge-container-mob must exist inside promo');
assert(pfContent.includes('id="cfg-show-badge"'), 'cfg-show-badge must exist');
assert(pfContent.includes('id="cfg-show-badge-mob"'), 'cfg-show-badge-mob must exist');
assert(pfContent.includes('id="cfg-badge-panel-desk"'), 'cfg-badge-panel-desk must exist');
assert(pfContent.includes('id="cfg-badge-panel-mob"'), 'cfg-badge-panel-mob must exist');
assert(pfContent.includes('id="cfg-badge-style-group"'), 'cfg-badge-style-group must exist');
assert(pfContent.includes('id="cfg-badge-radius" min="0" max="12" step="1"'), 'cfg-badge-radius attributes mismatch');

console.log('✔ All 5 Promo & Diskon features verified with IDs and subpanels');

// C. Helper functions exist
assert(pfContent.includes('function syncFeatureSubpanels()'), 'syncFeatureSubpanels helper must exist');
assert(pfContent.includes('function parseDiscountBadgeRadius('), 'parseDiscountBadgeRadius helper must exist');
assert(pfContent.includes('function updateDiscountBadgeRadiusPresetButtons('), 'updateDiscountBadgeRadiusPresetButtons helper must exist');
assert(pfContent.includes('function setDiscountBadgePosition('), 'setDiscountBadgePosition helper must exist');
assert(pfContent.includes('function getDiscountBadgePositionClass('), 'getDiscountBadgePositionClass helper must exist');
assert(pfContent.includes('function parseCountdownRadius('), 'parseCountdownRadius helper must exist');
assert(pfContent.includes('function updateCountdownRadiusPresetButtons('), 'updateCountdownRadiusPresetButtons helper must exist');

console.log('✔ Helper functions verified in product-form.js');

// 2. Verify buyer-store.js content
const bsContent = fs.readFileSync('js/buyer-store.js', 'utf8');

// Check strike_price_color in variant A, B, C
assert(bsContent.includes('strikePriceColor'), 'buyer-store.js missing strikePriceColor');
assert(bsContent.includes('style="color: ${strikePriceColor};"'), 'buyer-store.js missing strikePriceColor style in strike span');

// Check discount badge position in variant A, B, C
assert(bsContent.includes('discPosClass'), 'buyer-store.js missing discPosClass');
assert(bsContent.includes('class="absolute ${discPosClass}'), 'buyer-store.js missing dynamic discPosClass on image');

console.log('✔ buyer-store.js strike_price_color and discount position verified');

// 3. Verify db.js defaults
const dbContent = fs.readFileSync('js/db.js', 'utf8');
assert(dbContent.includes("strike_price_color: '#94a3b8'"), 'db.js missing strike_price_color default');
assert(dbContent.includes("discount_badge_position: 'top-right'"), 'db.js missing discount_badge_position default');

console.log('✔ db.js default configs verified');

console.log('--- ALL STATIC ASSERTIONS PASSED ---');

