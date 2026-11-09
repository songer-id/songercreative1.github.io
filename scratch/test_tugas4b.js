const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- TEST TUGAS 4B: MODAL INPUT UKURAN (P X L) PADA SIMULASI HITUNG HARGA ---');

// Mock browser environment
class MockClassList {
  constructor() {
    this.classes = new Set();
  }
  add(...cls) { cls.forEach(c => this.classes.add(c)); }
  remove(...cls) { cls.forEach(c => this.classes.delete(c)); }
  contains(cls) { return this.classes.has(cls); }
  toggle(cls, force) {
    if (force !== undefined) {
      if (force) this.classes.add(cls);
      else this.classes.delete(cls);
      return force;
    }
    if (this.classes.has(cls)) {
      this.classes.delete(cls);
      return false;
    } else {
      this.classes.add(cls);
      return true;
    }
  }
}

class MockElement {
  constructor(tagName = 'div', id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.classList = new MockClassList();
    this.children = [];
    this.attributes = {};
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.style = {};
    this.onclick = null;
    this.oninput = null;
    this.onchange = null;
    this.onkeydown = null;
  }
  getAttribute(name) { return this.attributes[name] || null; }
  setAttribute(name, val) { this.attributes[name] = String(val); }
  hasAttribute(name) { return name in this.attributes; }
  removeAttribute(name) { delete this.attributes[name]; }
  focus() { this._focused = true; }
  click() {
    if (this.onclick) {
      this.onclick({
        preventDefault: () => {},
        stopPropagation: () => {},
        target: this
      });
    }
  }
  querySelector(sel) {
    return this.querySelectorAll(sel)[0] || null;
  }
  querySelectorAll(sel) {
    const res = [];
    const walk = (node) => {
      if (!node || !node.children) return;
      for (const ch of node.children) {
        if (matches(ch, sel)) res.push(ch);
        walk(ch);
      }
    };
    walk(this);
    return res;
  }
}

function matches(el, sel) {
  if (!el || !sel) return false;
  if (sel.includes(',')) {
    return sel.split(',').some(s => matches(el, s.trim()));
  }
  if (sel.startsWith('#')) return el.id === sel.slice(1);
  if (sel.startsWith('.')) return el.classList && el.classList.contains(sel.slice(1));
  return el.tagName.toLowerCase() === sel.toLowerCase();
}

const elementRegistry = new Map();

const mockDocument = {
  getElementById: (id) => elementRegistry.get(id) || null,
  querySelector: (sel) => {
    for (const el of elementRegistry.values()) {
      if (matches(el, sel)) return el;
      const found = el.querySelector(sel);
      if (found) return found;
    }
    return null;
  },
  querySelectorAll: (sel) => {
    const list = [];
    for (const el of elementRegistry.values()) {
      if (matches(el, sel)) list.push(el);
      const sub = el.querySelectorAll(sel);
      list.push(...sub);
    }
    return list;
  },
  createElement: (tag) => new MockElement(tag),
  addEventListener: () => {},
  removeEventListener: () => {}
};

const mockWindow = {
  document: mockDocument,
  lucide: { createIcons: () => {} },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  addEventListener: () => {},
  removeEventListener: () => {}
};
mockWindow.window = mockWindow;

const sandbox = {
  window: mockWindow,
  document: mockDocument,
  navigator: { userAgent: 'node' },
  localStorage: mockWindow.localStorage,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  parseFloat: parseFloat,
  parseInt: parseInt,
  isNaN: isNaN,
  Math: Math,
  Date: Date,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Array: Array,
  Object: Object,
  RegExp: RegExp,
  JSON: JSON,
  DB: {
    generateUUID: () => 'uuid-123',
    getCategories: () => [],
    getSubCategories: () => [],
    getSettings: () => ({ city: 'Surabaya' })
  },
  Utils: {
    formatDynamicSellerLocation: () => 'Surabaya'
  },
  App: {
    showToast: () => {}
  }
};

const scriptCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'product-form.js'), 'utf8');
vm.createContext(sandbox);

try {
  vm.runInContext(scriptCode, sandbox);
  console.log('✓ product-form.js loaded successfully in VM');
} catch (err) {
  console.error('✗ Failed to load product-form.js:', err);
  process.exit(1);
}

const PF = sandbox.window.ProductForm || sandbox.ProductForm;
if (!PF) {
  console.error('✗ ProductForm is undefined');
  process.exit(1);
}

console.log('✓ ProductForm exports found');

// 1. Check exports
if (typeof PF.renderSandboxDimensionModalMarkup !== 'function') {
  console.error('✗ PF.renderSandboxDimensionModalMarkup is not a function');
  process.exit(1);
}
if (typeof PF.bindSandboxDimensionModalEvents !== 'function') {
  console.error('✗ PF.bindSandboxDimensionModalEvents is not a function');
  process.exit(1);
}
if (typeof PF.getSandboxPxlState !== 'function') {
  console.error('✗ PF.getSandboxPxlState is not a function');
  process.exit(1);
}
console.log('✓ All Tugas 4B functions & state exported properly');

// 2. Test renderCustomDimensionCard output
const primary = PF.getPrimaryState();
primary.has_custom_dimension = true;
primary.custom_dimension_label = 'Ukuran Custom';
primary.dimension_unit = 'cm';

const cardHtml = PF.renderCustomDimensionCard();

// Verify Trigger button presence
if (!cardHtml.includes('id="btn-open-sandbox-dim-modal"')) {
  console.error('✗ Card HTML missing #btn-open-sandbox-dim-modal');
  process.exit(1);
}
if (!cardHtml.includes('id="sandbox-dim-summary-text"')) {
  console.error('✗ Card HTML missing #sandbox-dim-summary-text');
  process.exit(1);
}
if (!cardHtml.includes('id="sandbox-input-dim-p"')) {
  console.error('✗ Card HTML missing hidden #sandbox-input-dim-p');
  process.exit(1);
}
if (!cardHtml.includes('id="sandbox-input-dim-l"')) {
  console.error('✗ Card HTML missing hidden #sandbox-input-dim-l');
  process.exit(1);
}
// Verify Modal presence in HTML
if (!cardHtml.includes('id="modal-sandbox-dim-input"')) {
  console.error('✗ Card HTML missing #modal-sandbox-dim-input');
  process.exit(1);
}
if (!cardHtml.includes('id="modal-sandbox-input-p"')) {
  console.error('✗ Modal missing #modal-sandbox-input-p');
  process.exit(1);
}
if (!cardHtml.includes('id="modal-sandbox-input-l"')) {
  console.error('✗ Modal missing #modal-sandbox-input-l');
  process.exit(1);
}
if (!cardHtml.includes('id="btn-cancel-sandbox-dim-modal"')) {
  console.error('✗ Modal missing #btn-cancel-sandbox-dim-modal');
  process.exit(1);
}
if (!cardHtml.includes('id="btn-apply-sandbox-dim-modal"')) {
  console.error('✗ Modal missing #btn-apply-sandbox-dim-modal');
  process.exit(1);
}
console.log('✓ Card HTML and Modal Markup contain all required IDs, buttons, and inputs');

// 3. Test interactive behavior of modal
// Create mock DOM nodes
function registerEl(id, tag = 'div') {
  const el = new MockElement(tag, id);
  elementRegistry.set(id, el);
  return el;
}

const btnOpen = registerEl('btn-open-sandbox-dim-modal', 'button');
const summarySpan = registerEl('sandbox-dim-summary-text', 'span');
summarySpan.textContent = 'Masukkan Ukuran (P x L)';
const hiddenP = registerEl('sandbox-input-dim-p', 'input');
const hiddenL = registerEl('sandbox-input-dim-l', 'input');

const modal = registerEl('modal-sandbox-dim-input', 'div');
modal.classList.add('hidden');

const modalBox = new MockElement('div');
modal.children.push(modalBox);

const btnCloseHeader = new MockElement('button');
btnCloseHeader.classList.add('btn-close-sandbox-dim-modal');
modalBox.children.push(btnCloseHeader);

const inputP = registerEl('modal-sandbox-input-p', 'input');
const inputL = registerEl('modal-sandbox-input-l', 'input');
const unitP = new MockElement('span');
unitP.classList.add('modal-sandbox-unit-p');
const unitL = new MockElement('span');
unitL.classList.add('modal-sandbox-unit-l');
modalBox.children.push(inputP, inputL, unitP, unitL);

const errEl = registerEl('modal-sandbox-dim-error', 'div');
errEl.classList.add('hidden');
modalBox.children.push(errEl);

const btnCancel = registerEl('btn-cancel-sandbox-dim-modal', 'button');
btnCancel.classList.add('btn-close-sandbox-dim-modal');
const btnApply = registerEl('btn-apply-sandbox-dim-modal', 'button');
modalBox.children.push(btnCancel, btnApply);

// Initialize state
const pxlState = PF.getSandboxPxlState();
pxlState.simLength = '';
pxlState.simWidth = '';

// Bind modal events
PF.bindSandboxDimensionModalEvents();

// Scenario A: Open modal
console.log('\n--- Scenario A: Open Modal ---');
btnOpen.click();
if (modal.classList.contains('hidden')) {
  console.error('✗ Modal should not be hidden after opening');
  process.exit(1);
}
if (!inputP._focused) {
  console.error('✗ inputP should have been focused on open');
  process.exit(1);
}
console.log('unitP.textContent:', JSON.stringify(unitP.textContent));
console.log('unitL.textContent:', JSON.stringify(unitL.textContent));
if (unitP.textContent !== 'cm' || unitL.textContent !== 'cm') {
  console.error('✗ Dynamic unit text should be updated to "cm"');
  process.exit(1);
}
console.log('✓ Scenario A: Modal opens, unit updated, input focused');

// Scenario B: Cancel preserves previous values
console.log('\n--- Scenario B: Cancel preserves previous values ---');
inputP.value = '999';
inputL.value = '888';
btnCancel.click();

if (!modal.classList.contains('hidden')) {
  console.error('✗ Modal should be hidden after cancel');
  process.exit(1);
}
if (pxlState.simLength === 999 || pxlState.simLength === '999') {
  console.error('✗ State should NOT change on cancel');
  process.exit(1);
}
// Reopen and check values reset to empty
btnOpen.click();
if (inputP.value !== '' || inputL.value !== '') {
  console.error('✗ Reopening modal should reset unapplied inputs to last state, got:', inputP.value, inputL.value);
  process.exit(1);
}
console.log('✓ Scenario B: Cancel correctly discarded unapplied changes');

// Scenario C: Validation on invalid inputs (0, negative, non-numeric)
console.log('\n--- Scenario C: Validation on invalid inputs ---');
inputP.value = '0';
inputL.value = '-10';
btnApply.click();

if (errEl.classList.contains('hidden')) {
  console.error('✗ Validation error message should be visible');
  process.exit(1);
}
if (!inputP.classList.contains('border-red-500') || !inputL.classList.contains('border-red-500')) {
  console.error('✗ Invalid inputs should have red border');
  process.exit(1);
}
if (!modal.classList.contains('hidden') === false) {
  console.error('✗ Modal should stay open on validation error');
  process.exit(1);
}
console.log('✓ Scenario C: Validation caught invalid inputs and showed error');

// Scenario D: Apply valid size (e.g. 120 x 80 cm)
console.log('\n--- Scenario D: Apply valid size (120 x 80 cm) ---');
inputP.value = '120';
inputL.value = '80';
btnApply.click();

if (!modal.classList.contains('hidden')) {
  console.error('✗ Modal should close after successful apply');
  process.exit(1);
}
if (pxlState.simLength !== 120 || pxlState.simWidth !== 80) {
  console.error('✗ State should be updated: expected 120 and 80, got:', pxlState.simLength, pxlState.simWidth);
  process.exit(1);
}
if (hiddenP.value != 120 || hiddenL.value != 80) {
  console.error('✗ Hidden inputs should be updated: expected 120 and 80, got:', hiddenP.value, hiddenL.value);
  process.exit(1);
}
if (summarySpan.textContent !== '120 × 80 cm') {
  console.error('✗ Summary text should be "120 × 80 cm", got:', summarySpan.textContent);
  process.exit(1);
}
if (!summarySpan.className.includes('text-slate-900 font-bold')) {
  console.error('✗ Summary text styling should be bold, got:', summarySpan.className);
  process.exit(1);
}
console.log('✓ Scenario D: Successfully applied 120 × 80 cm, updated state, hidden inputs, and summary button');

// Scenario E: Reopening displays last applied values
console.log('\n--- Scenario E: Reopening displays last applied values ---');
btnOpen.click();
if (inputP.value != 120 || inputL.value != 80) {
  console.error('✗ Reopened modal should display last applied values 120 and 80, got:', inputP.value, inputL.value);
  process.exit(1);
}
if (!errEl.classList.contains('hidden')) {
  console.error('✗ Error element should be hidden upon reopen');
  process.exit(1);
}

// Modify to 150 x 90 cm and apply
inputP.value = '150';
inputL.value = '90';
btnApply.click();
if (pxlState.simLength !== 150 || pxlState.simWidth !== 90) {
  console.error('✗ State should be 150 and 90');
  process.exit(1);
}
if (summarySpan.textContent !== '150 × 90 cm') {
  console.error('✗ Summary text should be "150 × 90 cm", got:', summarySpan.textContent);
  process.exit(1);
}
console.log('✓ Scenario E: Reopen loaded last values, updating to 150 × 90 cm succeeded');

// Scenario F: Enter key triggers apply, Escape key closes
console.log('\n--- Scenario F: Keyboard Enter and Escape ---');
btnOpen.click();
inputP.value = '200';
inputL.value = '100';

// Press Enter on inputL
let enterPrevented = false;
inputL.onkeydown({
  key: 'Enter',
  preventDefault: () => { enterPrevented = true; }
});
if (!enterPrevented || pxlState.simLength !== 200 || pxlState.simWidth !== 100) {
  console.error('✗ Enter key should have applied values');
  process.exit(1);
}
console.log('✓ Enter key correctly applies values');

btnOpen.click();
inputP.value = '555';
let escPrevented = false;
inputP.onkeydown({
  key: 'Escape',
  preventDefault: () => { escPrevented = true; }
});
if (!escPrevented || !modal.classList.contains('hidden') || pxlState.simLength === 555) {
  console.error('✗ Escape key should cancel and close without updating state');
  process.exit(1);
}
console.log('✓ Escape key correctly cancels and closes modal');

console.log('\n=========================================');
console.log('ALL TUGAS 4B TESTS PASSED SUCCESSFULLY! ✓');
console.log('=========================================');
