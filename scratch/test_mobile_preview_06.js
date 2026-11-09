const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SUITE: SC-ADMIN-MOBILE-PREVIEW-06 ===\n');

// 1. Static Checks
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const css = fs.readFileSync('css/admin.css', 'utf8');

console.log('--- 1. Breadcrumb Verification ---');
assert(!pf.includes('id="product-form-top-bar"'), 'No #product-form-top-bar in js/product-form.js');
assert(!pf.includes('<i data-lucide="arrow-left" class="w-4 h-4"></i> Daftar Produk'), 'No arrow-left Daftar Produk breadcrumb');
assert(!css.includes('#product-form-top-bar'), 'No #product-form-top-bar in css/admin.css');
assert(pf.includes('id="btn-step-1-cancel"'), '#btn-step-1-cancel preserved');
assert(pf.includes('btnStep1Cancel.addEventListener(\'click\''), 'btnStep1Cancel has click listener');
console.log('[PASS] Breadcrumb completely removed, Batal button & handler preserved.');

console.log('\n--- 2. CSS Overlay & Backdrop Rules ---');
assert(css.includes('#admin-main-viewport.mobile-preview-active'), 'Viewport has mobile-preview-active rule');
assert(css.includes('z-index: 90 !important;'), 'Backdrop / viewport has z-index 90');
assert(css.includes('safe-area-inset-bottom'), 'env(safe-area-inset-bottom) present in CSS');
assert(css.includes('88dvh'), '88dvh used for mobile-preview-sheet');
assert(css.includes('-webkit-overflow-scrolling: touch'), 'touch scrolling enabled');
console.log('[PASS] CSS backdrop coverage, safe-area, and drawer max-height rules verified.');

console.log('\n--- 3. Dynamic DOM & Functionality Simulation ---');
class MockClassList {
  constructor(initial = []) { this.classes = new Set(initial); }
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
    this.attributes = {};
    this.dataset = {};
    this.listeners = {};
    this._innerHTML = '';
    this.value = '';
    this.checked = false;
  }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = val;
    const idRegex = /id=["']([^"']+)["']/g;
    let match;
    while ((match = idRegex.exec(val)) !== null) {
      const childId = match[1];
      if (!mockDoc.elementsById[childId]) {
        mockDoc.elementsById[childId] = new MockElement('div', childId);
      }
    }
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
  click() { this.dispatchEvent({ type: 'click', preventDefault: () => { }, stopPropagation: () => { } }); }
  focus() { }
  scrollIntoView() { }
  closest() { return new MockElement('div'); }
  querySelectorAll() { return []; }
  querySelector() { return null; }
  getBoundingClientRect() { return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }; }
}

const mockDoc = {
  elementsById: {},
  body: new MockElement('body', 'mock-body'),
  addEventListener() { },
  removeEventListener() { },
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

let dbSettings = {
  primary_color: '#33b589',
  body_bg_color: '#e0f2fe',
  card_variants_config: {}
};

const sandbox = {
  document: mockDoc,
  window: {
    lucide: { createIcons: () => { } },
    addEventListener: () => { },
    removeEventListener: () => { }
  },
  localStorage: { getItem: () => null, setItem: () => { }, removeItem: () => { } },
  getComputedStyle: () => ({
    getPropertyValue: (prop) => {
      if (prop === '--color-primary') return dbSettings.primary_color;
      if (prop === '--color-body-bg') return dbSettings.body_bg_color;
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
  Map: Map,
  Set: Set,
  JSON: JSON,
  DB: {
    getSettings: () => dbSettings,
    getCategories: () => [{ id: 'cat-1', name: 'Kaos' }],
    getSubCategories: () => [],
    getProducts: () => [],
    generateUUID: () => 'uuid-' + Math.random().toString(36).slice(2)
  },
  Utils: {
    formatIDR: (n) => `Rp ${n}`,
    hexToRgba: (h, a) => `rgba(0,0,0,${a})`
  },
  App: { showToast: () => { } }
};

const vm = require('vm');
vm.createContext(sandbox);
vm.runInContext(pf, sandbox);

const ProductForm = sandbox.window.ProductForm || sandbox.ProductForm;
assert(ProductForm, 'ProductForm module initialized');

// Initialize form
ProductForm.initCreate();

const deskBody = mockDoc.getElementById('desktop-preview-body');
const mobBody = mockDoc.getElementById('mobile-preview-body');
const deskSidebar = mockDoc.getElementById('desktop-preview-sidebar');
const mobSheet = mockDoc.getElementById('mobile-preview-sheet');
const mobBackdrop = mockDoc.getElementById('mobile-preview-backdrop');
const vp = mockDoc.getElementById('admin-main-viewport');

// 1. Initial Step 1 Test
ProductForm.goToStep(1);
const primaryState = ProductForm.getPrimaryState();
primaryState.is_active = true;
primaryState.card_variant = 'A';

ProductForm.updateProductCardLivePreview();

assert.strictEqual(mobBody.style.backgroundColor, '#e0f2fe', 'mobBody receives active body color #e0f2fe');
assert.strictEqual(mobSheet.style.backgroundColor, '#e0f2fe', 'mobSheet receives active body color #e0f2fe');
assert(!mobSheet.classList.contains('bg-white'), 'mobSheet has bg-white removed in Step 1');
console.log('[PASS] Step 1: Mobile drawer body & sheet adopt store body theme color.');

// 2. Open / Close Mobile Preview
ProductForm.openMobilePreview();
assert(vp.classList.contains('mobile-preview-active'), 'vp has mobile-preview-active class when drawer open');
assert(vp.classList.contains('overflow-hidden'), 'vp has overflow-hidden when drawer open');
assert(!mobBackdrop.classList.contains('hidden'), 'backdrop visible when drawer open');
assert(!mobSheet.classList.contains('translate-y-full'), 'sheet visible when drawer open');

ProductForm.closeMobilePreview();
assert(!vp.classList.contains('mobile-preview-active'), 'vp removes mobile-preview-active when drawer closed');
assert(!vp.classList.contains('overflow-hidden'), 'vp restores overflow when drawer closed');
assert(mobBackdrop.classList.contains('hidden'), 'backdrop hidden when drawer closed');
assert(mobSheet.classList.contains('translate-y-full'), 'sheet translates out when drawer closed');
console.log('[PASS] Drawer open/close transitions, backdrop toggling, and viewport class verified.');

// 3. Tab switching between Pratinjau and Desain Kartu
ProductForm.setPreviewStep1Tab('design');
ProductForm.updateProductCardLivePreview();
assert.strictEqual(mobBody.style.backgroundColor, '#e0f2fe', 'mobBody retains body color on Desain Kartu tab');
assert.strictEqual(mobSheet.style.backgroundColor, '#e0f2fe', 'mobSheet retains body color on Desain Kartu tab');

ProductForm.setPreviewStep1Tab('preview');
ProductForm.updateProductCardLivePreview();
assert.strictEqual(mobBody.style.backgroundColor, '#e0f2fe', 'mobBody retains body color on Pratinjau tab');
assert.strictEqual(mobSheet.style.backgroundColor, '#e0f2fe', 'mobSheet retains body color on Pratinjau tab');
console.log('[PASS] Step 1 Tab switching cleanly maintains theme body background.');

// 4. Step 2 Total Isolation
primaryState.product_type = 'physical';
primaryState.images = ['data:image/png;base64,mock'];
primaryState.name = 'Produk Uji Coba';
ProductForm.goToStep(2);
ProductForm.updateProductCardLivePreview();

assert.strictEqual(mobBody.style.backgroundColor, '', 'mobBody background cleared in Step 2');
assert.strictEqual(mobSheet.style.backgroundColor, '', 'mobSheet background cleared in Step 2');
assert(mobSheet.classList.contains('bg-white'), 'mobSheet reverts to bg-white in Step 2');
console.log('[PASS] Step 2 total isolation verified: mobile drawer reverts to standard bg-white.');

// 5. Return to Step 1
ProductForm.goToStep(1);
ProductForm.updateProductCardLivePreview();
assert.strictEqual(mobBody.style.backgroundColor, '#e0f2fe', 'mobBody restores body color when returning to Step 1');
assert.strictEqual(mobSheet.style.backgroundColor, '#e0f2fe', 'mobSheet restores body color when returning to Step 1');
console.log('[PASS] Returning to Step 1 restores dynamic store body color.');

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
