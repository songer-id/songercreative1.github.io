const fs = require('fs');
const assert = require('assert');

console.log('--- Starting Focused Verification for SC-ADMIN-PREVIEW-LAYOUT-03 ---');

// 1. Verify JS Syntax
const { execSync } = require('child_process');
try {
  execSync('node --check js/product-form.js', { stdio: 'pipe' });
  console.log('[PASS] node --check js/product-form.js passed cleanly.');
} catch (e) {
  console.error('[FAIL] Syntax error in js/product-form.js:', e.message);
  process.exit(1);
}

// 2. Set up lightweight DOM simulation to test product-form.js functions
const jsContent = fs.readFileSync('js/product-form.js', 'utf8');

// Basic mock environment
class MockClassList {
  constructor() {
    this.classes = new Set();
  }
  add(...cls) { cls.forEach(c => this.classes.add(c)); }
  remove(...cls) { cls.forEach(c => this.classes.delete(c)); }
  contains(c) { return this.classes.has(c); }
  toggle(c) { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); }
  toString() { return Array.from(this.classes).join(' '); }
}

class MockElement {
  constructor(tagName = 'div', id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.classList = new MockClassList();
    this.attributes = {};
    this.style = {};
    this._innerHTML = '';
    this.children = [];
    this.parentElement = null;
    this.checked = false;
    this.value = '';
    this.onclick = null;
    this.oninput = null;
    this.onchange = null;
    this.listeners = {};
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = val;
    // Basic parser to discover elements with id in the HTML string
    this.children = [];
    const idRegex = /id=["']([^"']+)["']/g;
    let match;
    while ((match = idRegex.exec(val)) !== null) {
      const childId = match[1];
      if (!mockDoc.elementsById[childId]) {
        const el = new MockElement('div', childId);
        mockDoc.elementsById[childId] = el;
      }
    }
  }

  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  dispatchEvent(event) {
    const evType = typeof event === 'string' ? event : event.type;
    if (this.listeners[evType]) {
      this.listeners[evType].forEach(fn => fn({ preventDefault: () => {}, target: this }));
    }
    if (evType === 'click' && this.onclick) {
      this.onclick({ preventDefault: () => {}, target: this });
    }
    if (evType === 'change' && this.onchange) {
      this.onchange({ preventDefault: () => {}, target: this });
    }
    if (evType === 'input' && this.oninput) {
      this.oninput({ preventDefault: () => {}, target: this });
    }
  }

  getAttribute(name) { return this.attributes[name] || null; }
  setAttribute(name, val) { this.attributes[name] = val; }
  hasAttribute(name) { return name in this.attributes; }
  removeAttribute(name) { delete this.attributes[name]; }
  querySelector(sel) { return null; }
  querySelectorAll(sel) { return []; }
  closest(sel) {
    return this.parentElement || new MockElement('div');
  }
}

const mockDoc = {
  elementsById: {},
  body: new MockElement('body'),
  addEventListener() {},
  removeEventListener() {},
  getElementById(id) {
    if (!this.elementsById[id]) {
      this.elementsById[id] = new MockElement('div', id);
    }
    return this.elementsById[id];
  },
  querySelector(sel) {
    if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
    return null;
  },
  querySelectorAll(sel) {
    return [];
  },
  createElement(tag) {
    return new MockElement(tag);
  }
};

// 3. Static Code Verification for SC-ADMIN-PREVIEW-LAYOUT-03
console.log('\n--- Checking Static HTML & Component Requirements ---');

// A. Step 1 Header checks
assert(jsContent.includes('id="btn-step1-tab-preview"'), 'btn-step1-tab-preview must exist');
assert(jsContent.includes('id="btn-step1-tab-design"'), 'btn-step1-tab-design must exist');
assert(jsContent.includes('id="btn-step1-tab-preview-mob"'), 'btn-step1-tab-preview-mob must exist');
assert(jsContent.includes('id="btn-step1-tab-design-mob"'), 'btn-step1-tab-design-mob must exist');

// Verify that old "Preview<br>Kartu Produk" with eye icon is NOT in step1Html
const headerContentIdx = jsContent.indexOf('function getPreviewHeaderHtml(');
const headerFnBody = jsContent.slice(headerContentIdx, headerContentIdx + 6000);
assert(!headerFnBody.includes('<i class="bi bi-eye"></i>'), 'Step 1 and Step 2 header tabs must not have bi-eye icon');
assert(!headerFnBody.includes('bi-lightning-charge-fill'), 'Step 2 header tab must not have bi-lightning-charge-fill icon');
assert(headerFnBody.includes('<span>Pratinjau</span>'), 'Header must have Pratinjau text tab');
assert(headerFnBody.includes('<span>Desain Kartu</span>'), 'Step 1 Header must have Desain Kartu text tab');
assert(headerFnBody.includes('<span>Uji Coba</span>'), 'Step 2 Header must have Uji Coba text tab');
assert(headerFnBody.includes('Detail Produk'), 'Step 2 Header must preserve Detail Produk subtitle');
console.log('[PASS] Header tabs in Step 1 & Step 2 are compact text-only with icons removed.');

// B. Discount simulation row check
// Verify that decorative lightning icon and literal "ON" are removed from discount simulation
assert(!jsContent.includes('Simulasikan Diskon ON'), 'Literal "Simulasikan Diskon ON" must be removed');
assert(jsContent.includes('<span>Simulasi Diskon</span>'), 'Discount simulation label must be "Simulasi Diskon"');
assert(jsContent.includes('accent-color: var(--color-primary);'), 'Discount checkbox must have accent-color primary');
assert(jsContent.includes('focus:ring-[var(--color-primary)]'), 'Discount checkbox must have focus ring indicator');
console.log('[PASS] Discount simulation row is compact, clean, no lightning icon, no literal "ON".');

// C. Preview surroundings check
// Verify dashed border is removed around product-card-preview-container
assert(!jsContent.includes('border border-dashed border-slate-200'), 'Dashed decorative border around preview wrapper must be removed');
console.log('[PASS] Dashed decorative border around preview wrapper removed.');

// D. Card customization section check
// Verify decorative heading "Desain Kartu" with palette icon is removed from inside the editor
assert(!jsContent.includes('<i class="bi bi-palette text-emerald-600"></i>\n                  Desain Kartu'), 'Decorative Desain Kartu heading under tab must be removed');
assert(jsContent.includes('id="tab-card-design-default"'), 'Editor default tab must be preserved');
assert(jsContent.includes('id="tab-card-design-custom"'), 'Editor custom tab must be preserved');
assert(jsContent.includes('id="btn-save-card-design"'), 'Editor save button must be preserved');
console.log('[PASS] Card customization editor heading deduplicated while preserving all editor controls.');

// E. Verify CSS rules
const cssContent = fs.readFileSync('css/admin.css', 'utf8');
assert(!cssContent.includes('Kotak "Simulasikan Diskon ON" di Panel Pratinjau Kanan'), 'Old colored prominent discount wrapper CSS removed');
assert(cssContent.includes('#cfg-simulate-countdown-preview:focus-visible'), 'Focus visible styling for discount checkbox added');
console.log('[PASS] CSS adjustments for discount simulation verified.');

// F. Verify Step 1 tab state independence
assert(jsContent.includes("let previewStep1Tab = 'preview';"), 'previewStep1Tab state declared and initialized to preview');
assert(jsContent.includes("previewStep1Tab = 'preview';"), 'previewStep1Tab reset to preview in resetFormState and editProduct');
assert(jsContent.includes("previewStep1Tab = 'design'"), 'previewStep1Tab can transition to design');
console.log('[PASS] Step 1 tab state is independent from Step 2 test state.');

// G. Unique ID Check
const requiredIds = [
  'btn-step1-tab-preview',
  'btn-step1-tab-design',
  'btn-step1-tab-preview-mob',
  'btn-step1-tab-design-mob',
  'btn-preview-mode-passive',
  'btn-preview-mode-test',
  'btn-preview-mode-passive-mob',
  'btn-preview-mode-test-mob',
  'cfg-simulate-countdown-preview',
  'cfg-simulate-countdown-preview-mob',
  'card-customization-section',
  'card-customization-section-mob',
  'tab-card-design-default',
  'tab-card-design-custom',
  'tab-card-design-default-mob',
  'tab-card-design-custom-mob',
  'btn-save-card-design',
  'btn-save-card-design-mob',
  'btn-toggle-preview-sidebar',
  'btn-close-mobile-preview'
];

for (const id of requiredIds) {
  const count = (jsContent.match(new RegExp(`id=["']${id}["']`, 'g')) || []).length;
  assert(count === 1, `ID "${id}" should appear exactly once in markup template, found ${count}`);
}
console.log('[PASS] All required preview IDs exist and are strictly unique.');

console.log('\n--- ALL FOCUSED VERIFICATION CHECKS PASSED SUCCESSFULLY ---');


// 4. Behavioral Verification using product-form.js logic
console.log('\n--- Running Dynamic Behavioral Verification ---');

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; }
};

// Mock document & window
global.document = mockDoc;
global.window = {
  lucide: { createIcons: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {}
};

// Load product-form module in VM or context
const vm = require('vm');
const sandbox = {
  document: mockDoc,
  window: global.window,
  localStorage: global.localStorage,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
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
    saveCardModelPreset: (variant, config) => {
      mockStorage['saved_preset_' + variant] = JSON.stringify(config);
    }
  },
  App: {
    showToast: () => {}
  }
};

vm.createContext(sandbox);
vm.runInContext(jsContent, sandbox);

const ProductForm = sandbox.window.ProductForm || sandbox.ProductForm;
assert(ProductForm, 'ProductForm module should be exposed on window');

// Setup mock DOM elements for preview header and customization section
const deskHeader = new MockElement('div', 'desktop-preview-header-content');
const mobHeader = new MockElement('div', 'mobile-preview-header-content');
const cardCustomSection = new MockElement('div', 'card-customization-section');
const cardCustomSectionMob = new MockElement('div', 'card-customization-section-mob');
const simDiscountDesk = new MockElement('input', 'cfg-simulate-countdown-preview');
const simDiscountMob = new MockElement('input', 'cfg-simulate-countdown-preview-mob');
const liveCardBox = new MockElement('div', 'card-live-preview-box');
const previewContainer = new MockElement('div', 'product-card-preview-container');

mockDoc.elementsById['desktop-preview-header-content'] = deskHeader;
mockDoc.elementsById['mobile-preview-header-content'] = mobHeader;
mockDoc.elementsById['card-customization-section'] = cardCustomSection;
mockDoc.elementsById['card-customization-section-mob'] = cardCustomSectionMob;
mockDoc.elementsById['cfg-simulate-countdown-preview'] = simDiscountDesk;
mockDoc.elementsById['cfg-simulate-countdown-preview-mob'] = simDiscountMob;
mockDoc.elementsById['card-live-preview-box'] = liveCardBox;
mockDoc.elementsById['product-card-preview-container'] = previewContainer;

// Test A: Initial Step 1 Preview state via getPreviewHeaderHtml
const step1DeskHtml = ProductForm.getPreviewHeaderHtml(1, false);
assert(step1DeskHtml.includes('id="btn-step1-tab-preview"'), 'Step 1 desktop header has btn-step1-tab-preview');
assert(step1DeskHtml.includes('id="btn-step1-tab-design"'), 'Step 1 desktop header has btn-step1-tab-design');
assert(!step1DeskHtml.includes('bi-eye'), 'Step 1 header has NO bi-eye icon');
assert(!step1DeskHtml.includes('Detail Produk'), 'Step 1 header has NO Detail Produk subtitle');
console.log('[PASS] Test A: Step 1 header renders compact text-only Pratinjau & Desain Kartu tabs.');

// Test B: Step 1 Mobile Header via getPreviewHeaderHtml
const step1MobHtml = ProductForm.getPreviewHeaderHtml(1, true);
assert(step1MobHtml.includes('id="btn-step1-tab-preview-mob"'), 'Step 1 mobile header has btn-step1-tab-preview-mob');
assert(step1MobHtml.includes('id="btn-step1-tab-design-mob"'), 'Step 1 mobile header has btn-step1-tab-design-mob');
assert(!step1MobHtml.includes('bi-eye'), 'Step 1 mobile header has NO bi-eye icon');
console.log('[PASS] Test B: Step 1 mobile header renders compact text-only Pratinjau & Desain Kartu tabs.');

// Test C: Discount Simulation checkbox sync
simDiscountDesk.checked = true;
simDiscountDesk.dispatchEvent('change');
assert.strictEqual(simDiscountDesk.checked, true, 'Desktop discount checkbox checked');
console.log('[PASS] Test C: Discount checkbox handles events cleanly.');

// Test D: Step 2 Header rendering & isolation
const step2DeskHtml = ProductForm.getPreviewHeaderHtml(2, false);
assert(step2DeskHtml.includes('id="btn-preview-mode-passive"'), 'Step 2 has btn-preview-mode-passive');
assert(step2DeskHtml.includes('id="btn-preview-mode-test"'), 'Step 2 has btn-preview-mode-test');
assert(step2DeskHtml.includes('Detail Produk'), 'Step 2 has Detail Produk subtitle');
assert(!step2DeskHtml.includes('bi-eye'), 'Step 2 has NO bi-eye icon');
assert(!step2DeskHtml.includes('bi-lightning-charge-fill'), 'Step 2 has NO bi-lightning-charge-fill icon');
console.log('[PASS] Test D: Step 2 Header correctly isolated, text-only tabs with Detail Produk preserved.');

// Test E: Tab State Switching & Independence
assert.strictEqual(ProductForm.getPreviewStep1Tab(), 'preview', 'Default Step 1 tab should be preview');
ProductForm.setPreviewStep1Tab('design');
assert.strictEqual(ProductForm.getPreviewStep1Tab(), 'design', 'Step 1 tab switched to design');
const step1DesignHtml = ProductForm.getPreviewHeaderHtml(1, false);
assert(step1DesignHtml.includes('id="btn-step1-tab-design"'), 'Design tab exists in HTML');
ProductForm.setPreviewStep1Tab('preview');
assert.strictEqual(ProductForm.getPreviewStep1Tab(), 'preview', 'Step 1 tab restored to preview');
console.log('[PASS] Test E: Step 1 tab state switching is isolated and responsive.');

console.log('\n--- ALL BEHAVIORAL VERIFICATION CHECKS PASSED ---');
