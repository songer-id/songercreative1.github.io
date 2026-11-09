const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log('=== STARTING TEST SUITE: SC-ADMIN-PREVIEW-BACKGROUND-04-R1 ===\n');

// 1. Static Code Analysis
const jsContent = fs.readFileSync('js/product-form.js', 'utf8');

console.log('--- Step 1: Static Code Verifications ---');
// Verify desktop-preview-body ID and styles
assert(jsContent.includes('id="desktop-preview-body"'), 'desktop-preview-body ID present in template');
assert(jsContent.includes('id="mobile-preview-body"'), 'mobile-preview-body ID present in template');

// Verify initial template inline background bindings for Step 1
assert(jsContent.includes('<aside id="desktop-preview-sidebar"'), 'desktop-preview-sidebar present');
assert(jsContent.includes('id="desktop-preview-sidebar" class="') &&
  jsContent.includes('style="${currentStep === 1 ? `background-color: ${getThemeBodyColor()};` : \'\'}"'),
  'desktop-preview-sidebar template has dynamic Body background for Step 1');
assert(jsContent.includes('id="mobile-preview-sheet" class="') &&
  jsContent.includes('style="${currentStep === 1 ? `background-color: ${getThemeBodyColor()};` : \'\'}"'),
  'mobile-preview-sheet template has dynamic Body background for Step 1');

// Verify scrollSelectors include the new IDs
assert(jsContent.includes("'#desktop-preview-body'"), 'scrollSelectors includes #desktop-preview-body');
assert(jsContent.includes("'#mobile-preview-body'"), 'scrollSelectors includes #mobile-preview-body');

console.log('[PASS] Static checks: Target containers, IDs, and initial template expressions verified.');

// 2. DOM & Dynamic Behavior Verification with Mock Environment
class MockClassList {
  constructor() { this.classes = new Set(); }
  add(...cls) { cls.forEach(c => this.classes.add(c)); }
  remove(...cls) { cls.forEach(c => this.classes.delete(c)); }
  contains(c) { return this.classes.has(c); }
  toggle(c, force) {
    if (force !== undefined) {
      if (force) this.classes.add(c); else this.classes.delete(c);
      return force;
    }
    if (this.classes.has(c)) { this.classes.delete(c); return false; }
    this.classes.add(c); return true;
  }
}

class MockElement {
  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.classList = new MockClassList();
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.innerHTML = '';
    this.value = '';
    this.checked = false;
    this.children = [];
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  removeAttribute(k) { delete this.attributes[k]; }
  hasAttribute(k) { return k in this.attributes; }
  addEventListener(evt, fn) {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(fn);
  }
  removeEventListener(evt, fn) {
    if (this.listeners[evt]) {
      this.listeners[evt] = this.listeners[evt].filter(f => f !== fn);
    }
  }
  dispatchEvent(evt) {
    const list = this.listeners[evt.type || evt] || [];
    list.forEach(fn => fn(evt));
  }
  click() { this.dispatchEvent({ type: 'click', preventDefault: () => {}, stopPropagation: () => {} }); }
  focus() {}
  scrollIntoView() {}
  closest(selector) { return new MockElement('div'); }
  querySelectorAll() { return []; }
  querySelector() { return null; }
  getBoundingClientRect() { return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }; }
}

const mockDoc = {
  elementsById: {},
  addEventListener() {},
  removeEventListener() {},
  getElementById(id) {
    if (!this.elementsById[id]) {
      this.elementsById[id] = new MockElement('div', id);
    }
    return this.elementsById[id];
  },
  querySelector(sel) {
    if (sel && sel.startsWith('#')) return this.getElementById(sel.slice(1));
    return null;
  },
  querySelectorAll() { return []; },
  createElement(tag) { return new MockElement(tag); }
};

let dbSettingsState = {
  primary_color: '#33b589',
  body_bg_color: '#f8fafc',
  card_variants_config: {}
};

const sandbox = {
  document: mockDoc,
  window: {
    lucide: { createIcons: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  getComputedStyle: () => ({
    getPropertyValue: (prop) => {
      if (prop === '--color-primary') return dbSettingsState.primary_color;
      if (prop === '--color-body-bg') return dbSettingsState.body_bg_color;
      return '';
    }
  }),
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  requestAnimationFrame: (cb) => cb(),
  Intl: Intl,
  Math: Math,
  Date: Date,
  parseFloat: parseFloat,
  parseInt: parseInt,
  isNaN: isNaN,
  isFinite: isFinite,
  Boolean: Boolean,
  String: String,
  Number: Number,
  Array: Array,
  Object: Object,
  RegExp: RegExp,
  DB: {
    getCategories: () => [{ id: 'cat-1', name: 'Percetakan' }],
    getSubCategories: () => [],
    getSettings: () => JSON.parse(JSON.stringify(dbSettingsState)),
    saveSettings: (s) => { dbSettingsState = JSON.parse(JSON.stringify(s)); },
    saveCardModelPreset: () => {},
    getProductById: () => null,
    saveProduct: () => {}
  },
  App: { showToast: () => {} }
};

vm.createContext(sandbox);
vm.runInContext(jsContent, sandbox);

const ProductForm = sandbox.window.ProductForm || sandbox.ProductForm;
assert(ProductForm, 'ProductForm module exported');

// Elements
const deskBody = mockDoc.getElementById('desktop-preview-body');
const mobBody = mockDoc.getElementById('mobile-preview-body');
const deskSidebar = mockDoc.getElementById('desktop-preview-sidebar');
const mobSheet = mockDoc.getElementById('mobile-preview-sheet');
const outerWrapDesk = mockDoc.getElementById('preview-card-outer-wrapper');
const outerWrapMob = mockDoc.getElementById('preview-card-outer-wrapper-mob');
const liveCardBox = mockDoc.getElementById('card-live-preview-box');

console.log('\n--- Step 2: Dynamic Body Color Application in Step 1 ---');
// Set custom store body color
dbSettingsState.body_bg_color = '#e0f2fe'; // Sky 100
assert.strictEqual(ProductForm.getThemeBodyColor(), '#e0f2fe', 'getThemeBodyColor returns #e0f2fe');

// Initialize to Step 1
ProductForm.goToStep(1);
const primaryState = ProductForm.getPrimaryState();
primaryState.is_active = true;
primaryState.card_variant = 'A';

// Trigger live preview update
ProductForm.updateProductCardLivePreview();

// Verify that desktop-preview-body and mobile-preview-body received the Body color
assert.strictEqual(deskBody.style.backgroundColor, '#e0f2fe', 'deskBody receives store Body color #e0f2fe');
assert.strictEqual(mobBody.style.backgroundColor, '#e0f2fe', 'mobBody receives store Body color #e0f2fe');
assert.strictEqual(deskSidebar.style.backgroundColor, '#e0f2fe', 'deskSidebar receives store Body color #e0f2fe');
assert.strictEqual(mobSheet.style.backgroundColor, '#e0f2fe', 'mobSheet receives store Body color #e0f2fe');

// Verify that preview-card-outer-wrapper has NO background box
assert.strictEqual(outerWrapDesk.style.backgroundColor, '', 'outerWrapDesk background cleared (transparent)');
assert.strictEqual(outerWrapMob.style.backgroundColor, '', 'outerWrapMob background cleared (transparent)');
assert(!outerWrapDesk.classList.contains('p-3'), 'No p-3 padding on wrapper');
assert(!outerWrapDesk.classList.contains('max-w-[284px]'), 'No 284px width compensation on wrapper');
console.log('[PASS] Step 1: Content body and sidebar/sheet receive dynamic body color; wrapper is transparent.');

console.log('\n--- Step 3: Card Internal Background Isolation ---');
// Card itself should have its own background color (default #ffffff), not the body color
assert(liveCardBox.innerHTML.includes('background-color: #ffffff;'), 'Card itself retains white background (#ffffff)');
console.log('[PASS] Card internal styling is untouched; white cards stay white.');

console.log('\n--- Step 4: Step 2 Total Isolation ---');
// Populate valid Step 1 values so goToStep(2) validation passes
primaryState.product_type = 'physical';
primaryState.is_active = true;
primaryState.card_variant = 'A';
primaryState.images = ['data:image/png;base64,mock'];
primaryState.name = 'Produk Uji Coba Step 2';
primaryState.show_badge = false;

// Move to Step 2
ProductForm.goToStep(2);
// In Step 2, updateProductCardLivePreview resets background colors to ''
ProductForm.updateProductCardLivePreview();

assert.strictEqual(deskBody.style.backgroundColor, '', 'deskBody background cleared in Step 2');
assert.strictEqual(mobBody.style.backgroundColor, '', 'mobBody background cleared in Step 2');
assert.strictEqual(deskSidebar.style.backgroundColor, '', 'deskSidebar background cleared in Step 2 (reverts to bg-white)');
assert.strictEqual(mobSheet.style.backgroundColor, '', 'mobSheet background cleared in Step 2 (reverts to bg-white)');
assert.strictEqual(outerWrapDesk.style.backgroundColor, '', 'outerWrapDesk background cleared in Step 2');
assert.strictEqual(outerWrapMob.style.backgroundColor, '', 'outerWrapMob background cleared in Step 2');
console.log('[PASS] Step 2: Total isolation verified. All preview background overrides cleared.');

console.log('\n--- Step 5: Returning to Step 1 Restores Dynamic Body Color ---');
ProductForm.goToStep(1);
ProductForm.updateProductCardLivePreview();

assert.strictEqual(deskBody.style.backgroundColor, '#e0f2fe', 'deskBody background restored in Step 1');
assert.strictEqual(mobBody.style.backgroundColor, '#e0f2fe', 'mobBody background restored in Step 1');
assert.strictEqual(deskSidebar.style.backgroundColor, '#e0f2fe', 'deskSidebar background restored in Step 1');
assert.strictEqual(mobSheet.style.backgroundColor, '#e0f2fe', 'mobSheet background restored in Step 1');
console.log('[PASS] Returning to Step 1 cleanly restores dynamic body color.');

console.log('\n--- Step 6: Step 1 Tab Switching (Pratinjau <-> Desain Kartu) ---');
ProductForm.setPreviewStep1Tab('design');
ProductForm.updateProductCardLivePreview();
assert.strictEqual(deskBody.style.backgroundColor, '#e0f2fe', 'deskBody background remains active on Desain Kartu tab');
assert.strictEqual(mobBody.style.backgroundColor, '#e0f2fe', 'mobBody background remains active on Desain Kartu tab');

ProductForm.setPreviewStep1Tab('preview');
ProductForm.updateProductCardLivePreview();
assert.strictEqual(deskBody.style.backgroundColor, '#e0f2fe', 'deskBody background remains active on Pratinjau tab');
assert.strictEqual(mobBody.style.backgroundColor, '#e0f2fe', 'mobBody background remains active on Pratinjau tab');
console.log('[PASS] Step 1 Tab switching maintains body background.');

console.log('\n=== ALL TESTS FOR SC-ADMIN-PREVIEW-BACKGROUND-04-R1 PASSED SUCCESSFULLY ===');
