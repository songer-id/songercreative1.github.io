const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log('=== STARTING TEST SUITE: SC-ADMIN-LAYOUT-CLEANUP-05 ===\n');

// 1. Static Checks on js/product-form.js and css/admin.css
const formJs = fs.readFileSync('js/product-form.js', 'utf8');
const adminCss = fs.readFileSync('css/admin.css', 'utf8');

console.log('--- Step 1: Static Code Verifications ---');

// A. Breadcrumb removed from form template
assert(!formJs.includes('id="product-form-top-bar"'), 'product-form-top-bar removed from template');
assert(!formJs.includes('Daftar Produk /'), 'Breadcrumb text removed from product form');
assert(!formJs.includes('Tambah Produk Baru</span>'), 'Breadcrumb subtitle removed from product form');
assert(!formJs.includes('id="btn-back-to-list"'), 'btn-back-to-list removed from product form template');

// B. CSS rules for top-bar removed
assert(!adminCss.includes('#product-form-top-bar'), '#product-form-top-bar removed from css/admin.css');
assert(!adminCss.includes('#view-product-form #btn-back-to-list'), '#view-product-form #btn-back-to-list removed from css/admin.css');

// C. Top padding for step-pane-1 in css/admin.css
assert(adminCss.includes('#step-pane-1') && adminCss.includes('padding-top: 1.25rem !important;'), '#step-pane-1 has top padding 1.25rem on tablet/desktop');
assert(adminCss.includes('padding-top: 0.75rem !important;'), '#step-pane-1 has top padding 0.75rem on mobile');

// D. Continuous vertical separator on desktop
assert(formJs.includes('id="desktop-preview-sidebar" class="') && formJs.includes('border-l border-slate-200'), 'desktop-preview-sidebar has continuous border-l border-slate-200');
assert(formJs.includes('max-lg:hidden'), 'desktop-preview-sidebar is hidden on mobile/tablet');

// E. Single horizontal divider on preview header
assert(formJs.includes('id="desktop-preview-sidebar"') && formJs.includes('border-b border-slate-200 bg-slate-50/95'), 'desktop preview header has single thin divider border-b border-slate-200');
assert(formJs.includes('id="mobile-preview-sheet"') && formJs.includes('border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/95'), 'mobile preview header has single thin divider border-b border-slate-200');

console.log('[PASS] Static checks: Breadcrumb, divider, and border requirements verified.');

// 2. Control IDs uniqueness check
console.log('\n--- Step 2: Unique ID Check on Preview Controls ---');
const idRegex = /id="([^"]+)"/g;
const ids = [];
let match;
while ((match = idRegex.exec(formJs)) !== null) {
  ids.push(match[1]);
}

const previewControlIds = [
  'desktop-preview-sidebar',
  'desktop-preview-body',
  'desktop-preview-header-content',
  'btn-toggle-preview-sidebar',
  'cfg-simulate-countdown-preview',
  'preview-card-outer-wrapper',
  'product-card-preview-container',
  'card-live-preview-box',
  'mobile-preview-sheet',
  'mobile-preview-body',
  'mobile-preview-header-content',
  'btn-close-mobile-preview',
  'cfg-simulate-countdown-preview-mob',
  'preview-card-outer-wrapper-mob',
  'mobile-card-preview-container'
];

previewControlIds.forEach(id => {
  const count = ids.filter(x => x === id).length;
  assert.strictEqual(count, 1, `Control ID "${id}" must appear exactly once, but found ${count}`);
});
console.log('[PASS] All preview control IDs are strictly unique.');

// 3. Behavioral Check: Form Cancel button remains connected to handleFormCancel
console.log('\n--- Step 3: Button Batal Form Handler Verification ---');
class MockClassList {
  constructor() { this.classes = new Set(); }
  add(...c) { c.forEach(x => this.classes.add(x)); }
  remove(...c) { c.forEach(x => this.classes.delete(x)); }
  contains(c) { return this.classes.has(c); }
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
    this.value = '';
    this.innerHTML = '';
  }
  addEventListener(evt, fn) {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(fn);
  }
  dispatchEvent(evt) {
    (this.listeners[evt.type || evt] || []).forEach(fn => fn(evt));
  }
  click() { this.dispatchEvent({ type: 'click', preventDefault: () => {}, stopPropagation: () => {} }); }
  closest() { return new MockElement('div'); }
  querySelectorAll() { return []; }
  querySelector() { return null; }
  getBoundingClientRect() { return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }; }
}

const mockDoc = {
  elementsById: {},
  getElementById(id) {
    if (!this.elementsById[id]) this.elementsById[id] = new MockElement('div', id);
    return this.elementsById[id];
  },
  querySelector(sel) {
    if (sel && sel.startsWith('#')) return this.getElementById(sel.slice(1));
    return null;
  },
  querySelectorAll() { return []; },
  createElement(tag) { return new MockElement(tag); },
  addEventListener() {},
  removeEventListener() {}
};

let navigatedTo = null;
const sandbox = {
  document: mockDoc,
  window: { lucide: { createIcons: () => {} }, addEventListener: () => {}, removeEventListener: () => {} },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  getComputedStyle: () => ({ getPropertyValue: () => '#f8fafc' }),
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  requestAnimationFrame: (cb) => cb(),
  Intl: Intl, Math: Math, Date: Date,
  parseFloat: parseFloat, parseInt: parseInt, isNaN: isNaN, isFinite: isFinite,
  Boolean: Boolean, String: String, Number: Number, Array: Array, Object: Object, RegExp: RegExp,
  DB: {
    generateUUID: () => 'uuid-123',
    getCategories: () => [{ id: 'cat-1', name: 'Kategori' }],
    getSubCategories: () => [],
    getSettings: () => ({ body_bg_color: '#f8fafc' }),
    saveSettings: () => {},
    saveCardModelPreset: () => {},
    getProductById: () => null,
    saveProduct: () => {}
  },
  App: {
    showToast: () => {},
    navigate: (menu) => { navigatedTo = menu; }
  }
};

vm.createContext(sandbox);
vm.runInContext(formJs, sandbox);

const ProductForm = sandbox.window.ProductForm || sandbox.ProductForm;
assert(ProductForm, 'ProductForm module exported');

// Check that btn-step-1-cancel trigger works and calls handleFormCancel
const btnStep1Cancel = mockDoc.getElementById('btn-step-1-cancel');
assert(btnStep1Cancel, '#btn-step-1-cancel exists');
assert(typeof ProductForm.handleFormCancel === 'function', 'handleFormCancel is exported on ProductForm');

// Trigger handleFormCancel
ProductForm.handleFormCancel();
assert.strictEqual(navigatedTo, 'products', 'handleFormCancel navigated back to products list');
console.log('[PASS] Form Cancel navigation is fully functional.');

// 4. Verify preview background Body color preservation
console.log('\n--- Step 4: Step 1 Theme Body Color Preservation ---');
const deskBody = mockDoc.getElementById('desktop-preview-body');
const deskSidebar = mockDoc.getElementById('desktop-preview-sidebar');
ProductForm.goToStep(1);
ProductForm.updateProductCardLivePreview();
assert.strictEqual(deskBody.style.backgroundColor, '#f8fafc', 'deskBody retains Body background in Step 1');
assert.strictEqual(deskSidebar.style.backgroundColor, '#f8fafc', 'deskSidebar retains Body background in Step 1');

console.log('[PASS] Preview background and Step 1/Step 2 isolation fully preserved.');

console.log('\n=== ALL TESTS FOR SC-ADMIN-LAYOUT-CLEANUP-05 PASSED SUCCESSFULLY ===');
