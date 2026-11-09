/**
 * Runtime Simulation Test for TASK SC-ADMIN-CARD-PROMO-CUSTOMIZATION-09C-R1
 */
const assert = require('assert');
const fs = require('fs');

console.log('--- START RUNTIME SIMULATION TEST: 09C-R1 ---');

// Mock a lightweight DOM environment
class MockClassList {
  constructor() { this.classes = new Set(); }
  add(c) { this.classes.add(c); }
  remove(c) { this.classes.delete(c); }
  contains(c) { return this.classes.has(c); }
  toggle(c, force) {
    if (force !== undefined) {
      if (force) this.classes.add(c);
      else this.classes.delete(c);
    } else {
      if (this.classes.has(c)) this.classes.delete(c);
      else this.classes.add(c);
    }
  }
}

class MockElement {
  constructor(id, tagName = 'div') {
    this.id = id;
    this.tagName = tagName;
    this.value = '';
    this.checked = false;
    this.textContent = '';
    this.innerHTML = '';
    this.className = '';
    this.classList = new MockClassList();
    this.listeners = {};
    this.dataset = {};
    this.style = {};
    this.children = [];
  }
  addEventListener(evt, fn) {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(fn);
  }
  dispatchEvent(evt) {
    const list = this.listeners[evt.type] || [];
    list.forEach(fn => fn(evt));
  }
  querySelectorAll(sel) {
    return this.children.filter(c => c.className && c.className.includes(sel.replace('.', '')));
  }
}

const elementMap = new Map();
function getOrCreateElement(id, tagName = 'div') {
  if (!elementMap.has(id)) {
    elementMap.set(id, new MockElement(id, tagName));
  }
  return elementMap.get(id);
}

// 1. Setup Promo & Diskon elements
const promoIds = [
  // 1. Harga Coret
  'cfg-show-strike', 'cfg-show-strike-mob',
  'cfg-show-strike-icon-on', 'cfg-show-strike-icon-on-mob',
  'cfg-show-strike-icon-off', 'cfg-show-strike-icon-off-mob',
  'cfg-strike-panel-desk', 'cfg-strike-panel-mob',
  'cfg-strike-color', 'cfg-strike-color-mob',
  'cfg-strike-hex', 'cfg-strike-hex-mob',

  // 2. Label Diskon
  'cfg-show-discount-badge', 'cfg-show-discount-badge-mob',
  'cfg-show-discount-badge-icon-on', 'cfg-show-discount-badge-icon-on-mob',
  'cfg-show-discount-badge-icon-off', 'cfg-show-discount-badge-icon-off-mob',
  'cfg-discount-badge-panel-desk', 'cfg-discount-badge-panel-mob',
  'cfg-discount-badge-radius', 'cfg-discount-badge-radius-mob',
  'cfg-discount-badge-radius-val', 'cfg-discount-badge-radius-val-mob',
  'cfg-discount-badge-position', 'cfg-discount-badge-position-mob',
  'cfg-discount-badge-position-group', 'cfg-discount-badge-position-group-mob',
  'cfg-discount-badge-text-color', 'cfg-discount-badge-text-color-mob',
  'cfg-discount-badge-text-hex', 'cfg-discount-badge-text-hex-mob',
  'cfg-discount-badge-bg-color', 'cfg-discount-badge-bg-color-mob',
  'cfg-discount-badge-bg-hex', 'cfg-discount-badge-bg-hex-mob',

  // 3. Ikon Tiket
  'cfg-show-ticket-icon', 'cfg-show-ticket-icon-mob',
  'cfg-show-ticket-icon-icon-on', 'cfg-show-ticket-icon-icon-on-mob',
  'cfg-show-ticket-icon-icon-off', 'cfg-show-ticket-icon-icon-off-mob',

  // 4. Countdown
  'cfg-enable-countdown', 'cfg-enable-countdown-mob',
  'cfg-enable-countdown-icon-on', 'cfg-enable-countdown-icon-on-mob',
  'cfg-enable-countdown-icon-off', 'cfg-enable-countdown-icon-off-mob',
  'cfg-countdown-panel-desk', 'cfg-countdown-panel-mob',
  'cfg-countdown-radius', 'cfg-countdown-radius-mob',
  'cfg-countdown-radius-val', 'cfg-countdown-radius-val-mob',
  'cfg-countdown-bg-color', 'cfg-countdown-bg-color-mob',
  'cfg-countdown-bg-hex', 'cfg-countdown-bg-hex-mob',
  'cfg-countdown-text-color', 'cfg-countdown-text-color-mob',
  'cfg-countdown-text-hex', 'cfg-countdown-text-hex-mob',
  'cfg-countdown-icon-color', 'cfg-countdown-icon-color-mob',
  'cfg-countdown-icon-hex', 'cfg-countdown-icon-hex-mob',
  'cfg-countdown-border-color', 'cfg-countdown-border-color-mob',
  'cfg-countdown-border-hex', 'cfg-countdown-border-hex-mob',

  // 5. Label Khusus
  'cfg-badge-container-desk', 'cfg-badge-container-mob',
  'cfg-show-badge', 'cfg-show-badge-mob',
  'cfg-show-badge-icon-on', 'cfg-show-badge-icon-on-mob',
  'cfg-show-badge-icon-off', 'cfg-show-badge-icon-off-mob',
  'cfg-badge-panel-desk', 'cfg-badge-panel-mob',
  'cfg-badge-style', 'cfg-badge-style-mob',
  'cfg-badge-style-group', 'cfg-badge-style-group-mob',
  'cfg-badge-radius', 'cfg-badge-radius-mob',
  'cfg-badge-radius-val', 'cfg-badge-radius-val-mob',
  'cfg-badge-text-color', 'cfg-badge-text-color-mob',
  'cfg-badge-text-hex', 'cfg-badge-text-hex-mob',
  'cfg-badge-bg-color', 'cfg-badge-bg-color-mob',
  'cfg-badge-bg-hex', 'cfg-badge-bg-hex-mob',
  'cfg-badge-bg-wrap', 'cfg-badge-bg-wrap-mob',
  'cfg-badge-border-color', 'cfg-badge-border-color-mob',
  'cfg-badge-border-hex', 'cfg-badge-border-hex-mob',
  'cfg-badge-border-wrap', 'cfg-badge-border-wrap-mob',

  // Other controls
  'cfg-show-rating', 'cfg-show-rating-mob',
  'cfg-show-sales', 'cfg-show-sales-mob'
];
promoIds.forEach(id => getOrCreateElement(id));

// Discount Badge Presets
const discRadiusPresets = [];
['0', '4', '6', '8', '12'].forEach(val => {
  const btn = new MockElement(`btn-disc-radius-${val}`, 'button');
  btn.className = 'btn-disc-radius-preset';
  btn.dataset.value = val;
  discRadiusPresets.push(btn);
});

// Countdown Radius Presets
const cdRadiusPresets = [];
['0', '4', '6', '8', '12'].forEach(val => {
  const btn = new MockElement(`btn-cd-radius-${val}`, 'button');
  btn.className = 'btn-countdown-radius-preset';
  btn.dataset.value = val;
  cdRadiusPresets.push(btn);
});

// Discount Badge Position Buttons (Desk & Mob)
const discPosButtonsDesk = [];
['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(pos => {
  const btn = new MockElement(`btn-disc-pos-${pos}`, 'button');
  btn.className = 'btn-disc-pos';
  btn.dataset.pos = pos;
  discPosButtonsDesk.push(btn);
});
const discPosButtonsMob = [];
['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(pos => {
  const btn = new MockElement(`btn-disc-pos-${pos}-mob`, 'button');
  btn.className = 'btn-disc-pos';
  btn.dataset.pos = pos;
  discPosButtonsMob.push(btn);
});
getOrCreateElement('cfg-discount-badge-position-group').children = discPosButtonsDesk;
getOrCreateElement('cfg-discount-badge-position-group-mob').children = discPosButtonsMob;

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { href: '', search: '' },
  innerWidth: 1024,
  innerHeight: 768
};

global.document = {
  getElementById: (id) => elementMap.get(id) || null,
  querySelectorAll: (selector) => {
    if (selector === '.btn-disc-radius-preset') return discRadiusPresets;
    if (selector === '.btn-countdown-radius-preset') return cdRadiusPresets;
    if (selector === '.btn-disc-pos') return [...discPosButtonsDesk, ...discPosButtonsMob];
    return [];
  },
  querySelector: () => null,
  addEventListener: () => {}
};

// Load helper functions directly from ProductForm
const pfSource = fs.readFileSync('js/product-form.js', 'utf8');

// Extract and eval our target helpers in this sandbox context
function extractFunction(name) {
  const regex = new RegExp(`function\\s+${name}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n  \\}`);
  const match = pfSource.match(regex);
  if (!match) throw new Error(`Could not extract function ${name}`);
  return new Function(...getParamNames(match[0]), match[1]);
}

function getParamNames(fnStr) {
  const head = fnStr.slice(0, fnStr.indexOf('{'));
  const params = head.match(/\(([^)]*)\)/)[1].split(',').map(p => p.trim().split('=')[0].trim()).filter(Boolean);
  return params;
}

global.parseDiscountBadgeRadius = extractFunction('parseDiscountBadgeRadius');
const parseDiscountBadgeRadius = global.parseDiscountBadgeRadius;
global.parseCountdownRadius = extractFunction('parseCountdownRadius');
const parseCountdownRadius = global.parseCountdownRadius;

const syncFeatureSubpanels = extractFunction('syncFeatureSubpanels');
const updateDiscountBadgeRadiusPresetButtons = extractFunction('updateDiscountBadgeRadiusPresetButtons');
const setDiscountBadgePosition = extractFunction('setDiscountBadgePosition');
const getDiscountBadgePositionClass = extractFunction('getDiscountBadgePositionClass');
const updateCountdownRadiusPresetButtons = extractFunction('updateCountdownRadiusPresetButtons');

// ================= TEST SUITE =================

console.log('1. Testing Reaktif Subpanel Visibility Toggle...');

// Test 1: Harga Coret
const strikeDesk = getOrCreateElement('cfg-strike-panel-desk');
const strikeMob = getOrCreateElement('cfg-strike-panel-mob');
const strikeChk = getOrCreateElement('cfg-show-strike');

// Set true
strikeChk.checked = true;
syncFeatureSubpanels();
assert.strictEqual(strikeDesk.classList.contains('hidden'), false, 'Strike panel desk should be visible when true');
assert.strictEqual(strikeMob.classList.contains('hidden'), false, 'Strike panel mob should be visible when true');

// Set false
strikeChk.checked = false;
syncFeatureSubpanels();
assert.strictEqual(strikeDesk.classList.contains('hidden'), true, 'Strike panel desk should be hidden when false');
assert.strictEqual(strikeMob.classList.contains('hidden'), true, 'Strike panel mob should be hidden when false');

// Test 2: Label Diskon
const discDesk = getOrCreateElement('cfg-discount-badge-panel-desk');
const discMob = getOrCreateElement('cfg-discount-badge-panel-mob');
const discChk = getOrCreateElement('cfg-show-discount-badge');

// Set true
discChk.checked = true;
syncFeatureSubpanels();
assert.strictEqual(discDesk.classList.contains('hidden'), false, 'Discount badge panel desk should be visible when true');
assert.strictEqual(discMob.classList.contains('hidden'), false, 'Discount badge panel mob should be visible when true');

// Set false
discChk.checked = false;
syncFeatureSubpanels();
assert.strictEqual(discDesk.classList.contains('hidden'), true, 'Discount badge panel desk should be hidden when false');
assert.strictEqual(discMob.classList.contains('hidden'), true, 'Discount badge panel mob should be hidden when false');

// Test 3: Countdown
const cdDesk = getOrCreateElement('cfg-countdown-panel-desk');
const cdMob = getOrCreateElement('cfg-countdown-panel-mob');
const cdChk = getOrCreateElement('cfg-enable-countdown');

// Set true
cdChk.checked = true;
syncFeatureSubpanels();
assert.strictEqual(cdDesk.classList.contains('hidden'), false, 'Countdown panel desk should be visible when true');
assert.strictEqual(cdMob.classList.contains('hidden'), false, 'Countdown panel mob should be visible when true');

// Set false
cdChk.checked = false;
syncFeatureSubpanels();
assert.strictEqual(cdDesk.classList.contains('hidden'), true, 'Countdown panel desk should be hidden when false');
assert.strictEqual(cdMob.classList.contains('hidden'), true, 'Countdown panel mob should be hidden when false');

// Test 4: Label Khusus
const badgeDesk = getOrCreateElement('cfg-badge-panel-desk');
const badgeMob = getOrCreateElement('cfg-badge-panel-mob');
const badgeChk = getOrCreateElement('cfg-show-badge');

// Set true
badgeChk.checked = true;
syncFeatureSubpanels();
assert.strictEqual(badgeDesk.classList.contains('hidden'), false, 'Badge panel desk should be visible when true');
assert.strictEqual(badgeMob.classList.contains('hidden'), false, 'Badge panel mob should be visible when true');

// Set false
badgeChk.checked = false;
syncFeatureSubpanels();
assert.strictEqual(badgeDesk.classList.contains('hidden'), true, 'Badge panel desk should be hidden when false');
assert.strictEqual(badgeMob.classList.contains('hidden'), true, 'Badge panel mob should be hidden when false');

console.log('✔ All 4 subpanels reactively toggle hidden/visible based on eye checkbox state');

// 2. Testing Label Diskon Radius Slider & Presets
console.log('2. Testing Label Diskon Radius & Presets...');
assert.strictEqual(parseDiscountBadgeRadius(0), 0);
assert.strictEqual(parseDiscountBadgeRadius('6px'), 6);
assert.strictEqual(parseDiscountBadgeRadius(8), 8);
assert.strictEqual(parseDiscountBadgeRadius(12), 12);
assert.strictEqual(parseDiscountBadgeRadius(25), 12); // Clamped
assert.strictEqual(parseDiscountBadgeRadius(-5), 0); // Clamped

updateDiscountBadgeRadiusPresetButtons(6);
assert.strictEqual(getOrCreateElement('cfg-discount-badge-radius-val').textContent, '6 px');
assert.strictEqual(getOrCreateElement('cfg-discount-badge-radius-val-mob').textContent, '6 px');
const activePreset = discRadiusPresets.find(p => p.dataset.value === '6');
assert.ok(activePreset.className.includes('border-emerald-500'), 'Preset 6 should be active');
const inactivePreset = discRadiusPresets.find(p => p.dataset.value === '0');
assert.ok(inactivePreset.className.includes('border-slate-200'), 'Preset 0 should be inactive');

console.log('✔ Label Diskon radius parsing, bounds, and preset buttons work');

// 3. Testing Label Diskon 4 Positions
console.log('3. Testing Label Diskon 4 Positions...');
assert.strictEqual(getDiscountBadgePositionClass('top-left'), 'top-2 left-2');
assert.strictEqual(getDiscountBadgePositionClass('top-right'), 'top-2 right-2');
assert.strictEqual(getDiscountBadgePositionClass('bottom-left'), 'bottom-2 left-2');
assert.strictEqual(getDiscountBadgePositionClass('bottom-right'), 'bottom-2 right-2');
assert.strictEqual(getDiscountBadgePositionClass('invalid'), 'top-2 right-2'); // fallback

setDiscountBadgePosition('bottom-left');
assert.strictEqual(getOrCreateElement('cfg-discount-badge-position').value, 'bottom-left');
assert.strictEqual(getOrCreateElement('cfg-discount-badge-position-mob').value, 'bottom-left');
const activePosBtn = discPosButtonsDesk.find(b => b.dataset.pos === 'bottom-left');
assert.ok(activePosBtn.className.includes('bg-white text-slate-800'), 'Active pos button should have white bg');
const inactivePosBtn = discPosButtonsDesk.find(b => b.dataset.pos === 'top-right');
assert.ok(inactivePosBtn.className.includes('text-slate-500'), 'Inactive pos button should have slate text');

console.log('✔ Label Diskon 4 positions mapping and segmented control work');

// 4. Testing Countdown Radius Slider & Presets
console.log('4. Testing Countdown Radius Slider & Presets...');
assert.strictEqual(parseCountdownRadius(0), 0);
assert.strictEqual(parseCountdownRadius('4px'), 4);
assert.strictEqual(parseCountdownRadius(6), 6);
assert.strictEqual(parseCountdownRadius(8), 8);
assert.strictEqual(parseCountdownRadius(12), 12);
assert.strictEqual(parseCountdownRadius('9999px'), 12); // Sanitized legacy
assert.strictEqual(parseCountdownRadius(20), 12); // Clamped

updateCountdownRadiusPresetButtons(4);
assert.strictEqual(getOrCreateElement('cfg-countdown-radius-val').textContent, '4 px');
assert.strictEqual(getOrCreateElement('cfg-countdown-radius-val-mob').textContent, '4 px');
const activeCdPreset = cdRadiusPresets.find(p => p.dataset.value === '4');
assert.ok(activeCdPreset.className.includes('border-emerald-500'), 'Countdown preset 4 should be active');

console.log('✔ Countdown radius parsing and preset buttons work');

// 5. Testing Buyer Store Output (Variant A, B, C)
console.log('5. Testing Buyer Store rendering with customized tokens...');
const buyerStoreCode = fs.readFileSync('js/buyer-store.js', 'utf8');

// Load BuyerStore in a sandbox
const BuyerStoreSandbox = {};
const mockProduct = {
  id: 'prod-123',
  name: 'Test Product Promo',
  price: 150000,
  compare_price: 200000,
  discount_percent: 25,
  rating: 4.8,
  sales_count: 50,
  category_name: 'Fashion',
  custom_labels: ['PROMO SPESIAL'],
  image_url: 'https://example.com/test.jpg',
  effective_discount: {
    has_discount: true,
    discount_percent: 25,
    original_price: 200000,
    final_price: 150000
  }
};

const customCardConfig = {
  strike_price_color: '#ef4444',
  discount_badge_position: 'bottom-right',
  discount_badge_radius: '12px',
  discount_badge_text_color: '#ffffff',
  discount_badge_bg_color: '#dc2626',
  countdown_radius: '6px',
  badge_style: 'border',
  badge_radius: '4px',
  badge_text_color: '#059669',
  badge_border_color: '#059669',
  show_strikethrough_price: true,
  show_discount_badge: true,
  show_badge: true
};

const storeSettings = {
  card_variant: 'A',
  card_variants_config: {
    variant_a: customCardConfig
  }
};

// Evaluate buyer store with mock settings and helpers
const fnSandbox = new Function(
  'window', 'document', 'settings',
  `
    ${buyerStoreCode}
    return BuyerStore;
  `
);

const mockWindow = {
  ...global.window,
  SettingsStore: {
    get: () => storeSettings
  },
  ProductStore: {
    getById: () => mockProduct
  }
};

const MockBuyerStore = fnSandbox(
  mockWindow,
  global.document,
  storeSettings
);

// Variant A HTML
const htmlA = MockBuyerStore.renderCardVariantA(mockProduct, customCardConfig);
assert.ok(htmlA.includes('style="color: #ef4444;"'), 'Variant A should render custom strike_price_color');
assert.ok(htmlA.includes('bottom-2 right-2'), 'Variant A should render bottom-right position class for discount badge');
assert.ok(htmlA.includes('border-radius: 12px;'), 'Variant A should render 12px discount_badge_radius');
assert.ok(htmlA.includes('border: 1px solid #059669;'), 'Variant A should render border badge style');

// Variant B HTML (Minimalist - hides badge)
const htmlB = MockBuyerStore.renderCardVariantB(mockProduct, customCardConfig);
assert.ok(htmlB.includes('style="color: #ef4444;"'), 'Variant B should render custom strike_price_color');
assert.ok(htmlB.includes('bottom-2 right-2'), 'Variant B should render bottom-right position class for discount badge');

// Variant C HTML (Detail)
const htmlC = MockBuyerStore.renderCardVariantC(mockProduct, customCardConfig);
assert.ok(htmlC.includes('style="color: #ef4444;"'), 'Variant C should render custom strike_price_color');
assert.ok(htmlC.includes('bottom-2 right-2'), 'Variant C should render bottom-right position class for discount badge');
assert.ok(htmlC.includes('border-radius: 12px;'), 'Variant C should render 12px discount_badge_radius');

console.log('✔ BuyerStore Variant A, B, C properly output custom strike color, discount badge position & radius, and badge styles');

console.log('--- ALL RUNTIME SIMULATION TESTS PASSED SUCCESSFULLY! ---');
