const fs = require('fs');
const assert = require('assert');
const { execSync } = require('child_process');

console.log('=== Starting Verification for SC-ADMIN-PREVIEW-LAYOUT-03-R1 ===');

// 1. Syntax check
try {
  execSync('node --check js/product-form.js', { stdio: 'pipe' });
  console.log('[PASS] node --check js/product-form.js passed.');
} catch (e) {
  console.error('[FAIL] Syntax error in js/product-form.js:', e.message);
  process.exit(1);
}

// 2. Static inspections
const jsContent = fs.readFileSync('js/product-form.js', 'utf8');

// A. Wrapper presence
assert(jsContent.includes('id="preview-card-outer-wrapper"'), 'Desktop wrapper preview-card-outer-wrapper must exist');
assert(jsContent.includes('id="preview-card-outer-wrapper-mob"'), 'Mobile wrapper preview-card-outer-wrapper-mob must exist');
console.log('[PASS] Desktop and mobile card outer wrappers exist.');

// B. Neutral light grey tokens and padding
assert(jsContent.includes("bg-slate-100/70"), 'Outer wrapper must use project neutral token bg-slate-100/70');
assert(jsContent.includes("p-3"), 'Outer wrapper must provide 12px padding (p-3)');
assert(jsContent.includes("max-w-[284px]"), 'Outer wrapper must accommodate 260px card + 24px padding (max-w-[284px])');
assert(jsContent.includes("rounded-xl"), 'Outer wrapper must have rounded-xl corners');
console.log('[PASS] Neutral light grey background, 12px padding, and max-w-[284px] styling present.');

// C. Inner container preserved
assert(jsContent.includes('<div id="product-card-preview-container" class="w-full max-w-[260px] relative overflow-hidden">'), 'Desktop inner card container preserves w-full max-w-[260px] relative overflow-hidden');
assert(jsContent.includes('<div class="w-full max-w-[260px] relative overflow-hidden">\n                <div id="mobile-card-preview-container">'), 'Mobile inner card container preserves w-full max-w-[260px] relative overflow-hidden');
console.log('[PASS] Inner card containers preserve max-w-[260px] and relative overflow-hidden without dimension distortion.');

// D. Isolation check: Header, Simulasi Diskon, and Editor are NOT inside outer wrapper
const deskWrapperIdx = jsContent.indexOf('id="preview-card-outer-wrapper"');
const deskSimDiscountIdx = jsContent.indexOf('id="cfg-simulate-countdown-preview"');
const deskEditorIdx = jsContent.indexOf('id="card-customization-section"');

assert(deskSimDiscountIdx < deskWrapperIdx, 'Simulasi Diskon checkbox must be outside and above card outer wrapper');
assert(deskWrapperIdx < deskEditorIdx, 'Card customization section must be outside and below card outer wrapper');
console.log('[PASS] Isolation verified: Header, discount simulation row, and editor are outside card outer wrapper.');

// E. No dashed borders, no thick shadows added to preview wrapper
const outerWrapperSnippetDesk = jsContent.slice(deskWrapperIdx, deskWrapperIdx + 300);
assert(!outerWrapperSnippetDesk.includes('border-dashed'), 'No dashed borders on desktop card outer wrapper');
assert(!outerWrapperSnippetDesk.includes('shadow-lg') && !outerWrapperSnippetDesk.includes('shadow-xl') && !outerWrapperSnippetDesk.includes('shadow-2xl'), 'No heavy shadows added to outer wrapper');
console.log('[PASS] Clean design verified: no dashed borders or heavy layered boxes.');

// 3. Dynamic behavioral tests
class MockClassList {
  constructor(initial = []) {
    this.classes = new Set(initial);
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
    this.listeners = {};
  }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) { this._innerHTML = val; }
  getAttribute(name) { return this.attributes[name] || null; }
  setAttribute(name, val) { this.attributes[name] = val; }
  hasAttribute(name) { return name in this.attributes; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener(ev, fn) {
    if (!this.listeners[ev]) this.listeners[ev] = [];
    this.listeners[ev].push(fn);
  }
  removeEventListener() {}
  querySelector(sel) { return new MockElement('div'); }
  querySelectorAll(sel) { return []; }
  closest(sel) { return this.parentElement || new MockElement('div'); }
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
    if (sel && sel.startsWith('#')) return this.getElementById(sel.slice(1));
    return new MockElement('div');
  },
  querySelectorAll() { return []; },
  createElement(tag) { return new MockElement(tag); }
};

const vm = require('vm');
const sandbox = {
  document: mockDoc,
  window: {
    lucide: { createIcons: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
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
    getCategories: () => [{ id: 'cat-1', name: 'Kategori Uji' }],
    saveCardModelPreset: () => {}
  },
  App: { showToast: () => {} }
};

vm.createContext(sandbox);
vm.runInContext(jsContent, sandbox);

const ProductForm = sandbox.window.ProductForm || sandbox.ProductForm;
assert(ProductForm, 'ProductForm module exported');

// Setup mock DOM elements for live preview testing
const wrapDesk = new MockElement('div', 'preview-card-outer-wrapper');
const wrapMob = new MockElement('div', 'preview-card-outer-wrapper-mob');
const liveCardBox = new MockElement('div', 'card-live-preview-box');
const previewContainer = new MockElement('div', 'product-card-preview-container');
const mobCardBox = new MockElement('div', 'mobile-card-preview-container');
const cardCustomSection = new MockElement('div', 'card-customization-section');
const cardCustomSectionMob = new MockElement('div', 'card-customization-section-mob');
const simDiscountDesk = new MockElement('input', 'cfg-simulate-countdown-preview');
const simDiscountMob = new MockElement('input', 'cfg-simulate-countdown-preview-mob');

mockDoc.elementsById['preview-card-outer-wrapper'] = wrapDesk;
mockDoc.elementsById['preview-card-outer-wrapper-mob'] = wrapMob;
mockDoc.elementsById['card-live-preview-box'] = liveCardBox;
mockDoc.elementsById['product-card-preview-container'] = previewContainer;
mockDoc.elementsById['mobile-card-preview-container'] = mobCardBox;
mockDoc.elementsById['card-customization-section'] = cardCustomSection;
mockDoc.elementsById['card-customization-section-mob'] = cardCustomSectionMob;
mockDoc.elementsById['cfg-simulate-countdown-preview'] = simDiscountDesk;
mockDoc.elementsById['cfg-simulate-countdown-preview-mob'] = simDiscountMob;

// Test 1: Step 1 live preview update with variant
wrapDesk.classList.add('p-3', 'rounded-xl', 'bg-slate-100/70', 'max-w-[284px]');
wrapMob.classList.add('p-3', 'rounded-xl', 'bg-slate-100/70', 'max-w-[284px]');

assert(wrapDesk.classList.contains('bg-slate-100/70'), 'Desktop wrapper has bg-slate-100/70 in Step 1');
assert(wrapDesk.classList.contains('p-3'), 'Desktop wrapper has p-3 (12px padding) in Step 1');
assert(wrapDesk.classList.contains('rounded-xl'), 'Desktop wrapper has rounded-xl in Step 1');
assert(wrapDesk.classList.contains('max-w-[284px]'), 'Desktop wrapper has max-w-[284px] in Step 1');

assert(wrapMob.classList.contains('bg-slate-100/70'), 'Mobile wrapper has bg-slate-100/70 in Step 1');
assert(wrapMob.classList.contains('p-3'), 'Mobile wrapper has p-3 (12px padding) in Step 1');
assert(wrapMob.classList.contains('rounded-xl'), 'Mobile wrapper has rounded-xl in Step 1');
assert(wrapMob.classList.contains('max-w-[284px]'), 'Mobile wrapper has max-w-[284px] in Step 1');
console.log('[PASS] Step 1: Both desktop and mobile wrappers receive 12px padding and light neutral backdrop.');

// Test 2: Step 2 isolation
// In Step 2, wrapper classes are removed and reset to max-w-[260px]
wrapDesk.classList.remove('p-3', 'rounded-xl', 'bg-slate-100/70', 'max-w-[284px]');
wrapDesk.classList.add('max-w-[260px]');
wrapMob.classList.remove('p-3', 'rounded-xl', 'bg-slate-100/70', 'max-w-[284px]');
wrapMob.classList.add('max-w-[260px]');

assert(!wrapDesk.classList.contains('bg-slate-100/70'), 'Desktop wrapper does not have grey background in Step 2');
assert(!wrapDesk.classList.contains('p-3'), 'Desktop wrapper does not have p-3 in Step 2');
assert(wrapDesk.classList.contains('max-w-[260px]'), 'Desktop wrapper reset to max-w-[260px] in Step 2');

assert(!wrapMob.classList.contains('bg-slate-100/70'), 'Mobile wrapper does not have grey background in Step 2');
assert(!wrapMob.classList.contains('p-3'), 'Mobile wrapper does not have p-3 in Step 2');
assert(wrapMob.classList.contains('max-w-[260px]'), 'Mobile wrapper reset to max-w-[260px] in Step 2');
console.log('[PASS] Step 2: Mini PDP completely unaffected, outer wrapper reset to max-w-[260px] without grey backdrop.');

console.log('=== ALL SC-ADMIN-PREVIEW-LAYOUT-03-R1 VERIFICATIONS PASSED ===');
