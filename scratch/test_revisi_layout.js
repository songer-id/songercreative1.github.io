const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== TEST SUITE: REVISI LAYOUT ADMIN (4 PERBAIKAN) ===\n');

// 1. Mock DOM Environment
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
    this.parentElement = null;
    this.attributes = {};
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.style = {};
    this.onclick = null;
    this.oninput = null;
    this.onchange = null;
    this.onkeydown = null;
    this._checked = false;
  }
  get checked() { return this._checked; }
  set checked(val) { this._checked = Boolean(val); }
  getAttribute(name) { return this.attributes[name] || null; }
  setAttribute(name, val) { this.attributes[name] = String(val); }
  removeAttribute(name) { delete this.attributes[name]; }
  focus() { this._focused = true; }
  scrollIntoView() { this._scrolled = true; }
  appendChild(child) {
    if (child.parentElement) {
      child.parentElement.removeChild(child);
    }
    this.children.push(child);
    child.parentElement = this;
    return child;
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentElement = null;
    }
    return child;
  }
  remove() {
    if (this.parentElement) {
      this.parentElement.removeChild(this);
    }
  }
  insertBefore(newNode, refNode) {
    if (newNode.parentElement) {
      newNode.parentElement.removeChild(newNode);
    }
    const idx = this.children.indexOf(refNode);
    if (idx !== -1) {
      this.children.splice(idx, 0, newNode);
    } else {
      this.children.push(newNode);
    }
    newNode.parentElement = this;
    return newNode;
  }
  querySelectorAll(sel) {
    const results = [];
    function search(node) {
      for (const child of node.children) {
        if (matchesSelector(child, sel)) {
          results.push(child);
        }
        search(child);
      }
    }
    search(this);
    return results;
  }
  querySelector(sel) {
    return this.querySelectorAll(sel)[0] || null;
  }
  contains(node) {
    let curr = node;
    while (curr) {
      if (curr === this) return true;
      curr = curr.parentElement;
    }
    return false;
  }
  dispatchEvent(evt) {
    if (evt.type === 'change' && this.onchange) {
      this.onchange({ target: this, preventDefault: () => {} });
    }
    if (evt.type === 'input' && this.oninput) {
      this.oninput({ target: this, preventDefault: () => {} });
    }
  }
}

function matchesSelector(el, sel) {
  if (sel.startsWith('#')) return el.id === sel.slice(1);
  if (sel.startsWith('.')) return el.classList.contains(sel.slice(1));
  if (sel === 'input') return el.tagName === 'INPUT';
  if (sel === 'select') return el.tagName === 'SELECT';
  if (sel === 'button') return el.tagName === 'BUTTON';
  return false;
}

const elementRegistry = new Map();

const mockDocument = {
  _listeners: {},
  addEventListener(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  },
  removeEventListener(event, cb) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter(fn => fn !== cb);
    }
  },
  getElementById(id) {
    return elementRegistry.get(id) || null;
  },
  createElement(tag) {
    return new MockElement(tag);
  },
  querySelectorAll(sel) {
    return mockBody.querySelectorAll(sel);
  },
  querySelector(sel) {
    return mockBody.querySelector(sel);
  },
  documentElement: { style: {} }
};

const mockBody = new MockElement('body', 'mock-body');
mockDocument.body = mockBody;

const mockWindow = {
  addEventListener: (e, cb) => mockDocument.addEventListener(e, cb),
  removeEventListener: (e, cb) => mockDocument.removeEventListener(e, cb),
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  }
};
mockWindow.window = mockWindow;
mockWindow.document = mockDocument;

// 2. Load product-form.js code into vm
const pfCode = fs.readFileSync(path.resolve('js/product-form.js'), 'utf8');

const context = vm.createContext({
  window: mockWindow,
  document: mockDocument,
  navigator: { userAgent: 'node' },
  localStorage: mockWindow.localStorage,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  requestAnimationFrame: (cb) => cb(),
  Event: class { constructor(type) { this.type = type; } },
  FileReader: class { readAsDataURL() {} },
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
});

vm.runInContext(pfCode, context);

const ProductForm = context.window.ProductForm || context.ProductForm;
console.log('ProductForm loaded successfully:', Boolean(ProductForm), '\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(cond, desc) {
  if (cond) {
    console.log(`[PASS] ${desc}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${desc}`);
    testsFailed++;
  }
}

// =============================================================================
// TEST 1: Panduan Aturan Ukuran Variasi Modal Scrollbar
// =============================================================================
console.log('--- TEST 1: Panduan Aturan Ukuran Variasi Help Modal Scrollbar ---');
const helpModalsHtml = ProductForm.renderDimensionRulesSectionHtml();

assert(helpModalsHtml.includes('id="modal-help-dimension-rule"'), 'Modal #modal-help-dimension-rule exists');
assert(helpModalsHtml.includes('rounded-2xl') && helpModalsHtml.includes('flex flex-col') && helpModalsHtml.includes('max-h-[85vh]') && helpModalsHtml.includes('overflow-hidden'), 'Modal card has flex flex-col, max-h-[85vh], overflow-hidden, rounded-2xl');
assert(helpModalsHtml.includes('shrink-0 flex items-center justify-between border-b'), 'Header is fixed/shrink-0 with border-b');
assert(helpModalsHtml.includes('flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-3.5 custom-modal-scrollbar'), 'Body is scrollable (flex-1 overflow-y-auto) with custom-modal-scrollbar');
assert(helpModalsHtml.includes('btn-close-help-rule btn-primary-brand'), 'Footer has fixed close/Mengerti button');

// =============================================================================
// TEST 2: Compact Size Guide Table on Mobile
// =============================================================================
console.log('\n--- TEST 2: Compact Size Guide Table on Mobile ---');
const sizeGuideHtml = ProductForm.renderSizeGuideSectionHtml();
assert(sizeGuideHtml.includes('id="size-guide-matrix-table"'), 'Table #size-guide-matrix-table exists');
assert(sizeGuideHtml.includes('min-w-[96px] sm:min-w-[120px]'), 'Column header has compact min-w on mobile (96px) and desktop (120px)');
assert(sizeGuideHtml.includes('h-7 sm:h-8'), 'Column header input has compact height h-7 sm:h-8');
assert(sizeGuideHtml.includes('pl-1.5 pr-6 sm:pl-2 sm:pr-7'), 'Column header input has dedicated right padding (pr-6 sm:pr-7) to prevent overlap with clear button');
assert(sizeGuideHtml.includes('btn-del-size-col w-6 h-6 sm:w-7 sm:h-7'), 'Delete column button has its own aligned space (w-6 h-6 sm:w-7 sm:h-7 shrink-0)');
assert(sizeGuideHtml.includes('size-cell-input w-full h-7 sm:h-8'), 'Table body cell input is compact (h-7 sm:h-8, text-[11px] sm:text-xs)');
assert(sizeGuideHtml.includes('btn-del-size-row w-6 h-6 sm:w-7 sm:h-7'), 'Delete row button is compact (w-6 h-6 sm:w-7 sm:h-7 shrink-0)');

// =============================================================================
// TEST 3: Restyled Dropdowns (Komponen Utama Ukuran & Satuan Ukuran *)
// =============================================================================
console.log('\n--- TEST 3: Restyled Dropdowns (Komponen Utama & Satuan Ukuran) ---');
const pState = ProductForm.getPrimaryState();
pState.has_variants = true;
const mats = ProductForm.getMaterialsState();
mats.length = 0;
mats.push({ id: 'mat-1', name: 'Bahan Spanduk 280g', price: 25000, cost_price: 15000 });

const mainCompHtml = ProductForm.renderCustomDimensionMainComponentDropdownHtml();
const unitHtml = ProductForm.renderCustomDimensionUnitDropdownHtml('cm');

assert(mainCompHtml.includes('id="custom-select-dimension-main-component"'), 'Custom select trigger for main component exists');
assert(mainCompHtml.includes('id="select-dimension-main-component" class="hidden"'), 'Hidden select for main component preserved for form/script compatibility');
assert(mainCompHtml.includes('id="dimension-main-component-popover"'), 'Custom popover for main component exists');
assert(mainCompHtml.includes('custom-dimension-main-comp-item'), 'Selection-only items exist for main component');
assert(mainCompHtml.includes('bi-chevron-down'), 'Chevron icon exists on trigger');

assert(unitHtml.includes('id="custom-select-dimension-unit"'), 'Custom select trigger for dimension unit exists');
assert(unitHtml.includes('id="select-dimension-unit" class="hidden"'), 'Hidden select for dimension unit preserved for form/script compatibility');
assert(unitHtml.includes('id="dimension-unit-popover"'), 'Custom popover for dimension unit exists');
assert(unitHtml.includes('custom-dimension-unit-item'), 'Selection-only items exist for dimension unit');
assert(unitHtml.includes('id="custom-dimension-unit-error"'), 'Validation error container exists');

// =============================================================================
// TEST 4: Simulasi Hitung Harga as Popup Modal
// =============================================================================
console.log('\n--- TEST 4: Simulasi Hitung Harga as Popup Modal ---');
const modalSimulatorHtml = ProductForm.renderSandboxSimulatorModalMarkup();
assert(modalSimulatorHtml.includes('id="modal-sandbox-pxl-simulator"'), 'Modal #modal-sandbox-pxl-simulator exists');
assert(modalSimulatorHtml.includes('fixed inset-0 z-[100]'), 'Modal has fixed inset-0 and top z-index');
assert(modalSimulatorHtml.includes('btn-close-sandbox-simulator'), 'Modal has close button .btn-close-sandbox-simulator');
assert(modalSimulatorHtml.includes('id="sandbox-input-dim-p"'), 'Modal has direct input Panjang (P) #sandbox-input-dim-p');
assert(modalSimulatorHtml.includes('id="sandbox-input-dim-l"'), 'Modal has direct input Lebar (L) #sandbox-input-dim-l');
assert(modalSimulatorHtml.includes('id="sandbox-select-main-option"'), 'Modal has main option select #sandbox-select-main-option');
assert(modalSimulatorHtml.includes('id="sandbox-finishing-options-list"'), 'Modal has finishing options list');
assert(modalSimulatorHtml.includes('id="sandbox-calc-results-breakdown"'), 'Modal has calculation results breakdown #sandbox-calc-results-breakdown');

// Test Open and Close function behavior
const pxlState = ProductForm.getSandboxPxlState();
pxlState.simLength = 120;
pxlState.simWidth = 80;

// Create dummy elements for modal testing
const mockModal = new MockElement('div', 'modal-sandbox-pxl-simulator');
mockModal.classList.add('hidden');
elementRegistry.set('modal-sandbox-pxl-simulator', mockModal);
mockBody.appendChild(mockModal);

const sInputP = new MockElement('input', 'sandbox-input-dim-p');
mockModal.appendChild(sInputP);
elementRegistry.set('sandbox-input-dim-p', sInputP);

const sInputL = new MockElement('input', 'sandbox-input-dim-l');
mockModal.appendChild(sInputL);
elementRegistry.set('sandbox-input-dim-l', sInputL);

const sBreakdown = new MockElement('div', 'sandbox-calc-results-breakdown');
mockModal.appendChild(sBreakdown);
elementRegistry.set('sandbox-calc-results-breakdown', sBreakdown);

// Open modal
ProductForm.openSandboxSimulatorModal();
assert(pxlState.isOpen === true, 'openSandboxSimulatorModal sets pxlState.isOpen = true');
assert(!mockModal.classList.contains('hidden'), 'Modal has hidden class removed');
assert(mockModal.style.display === 'flex', 'Modal display set to flex');
assert(sInputP.value === 120, 'Panjang input initialized to 120 from pxlState');
assert(sInputL.value === 80, 'Lebar input initialized to 80 from pxlState');

// Close modal
ProductForm.closeSandboxSimulatorModal();
assert(pxlState.isOpen === false, 'closeSandboxSimulatorModal sets pxlState.isOpen = false');
assert(mockModal.classList.contains('hidden'), 'Modal has hidden class added');
assert(mockModal.style.display === 'none', 'Modal display set to none');
assert(pxlState.simLength === 120, 'simLength value preserved across close');
assert(pxlState.simWidth === 80, 'simWidth value preserved across close');

console.log(`\n=== SUMMARY: ${testsPassed} passed, ${testsFailed} failed ===`);
if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY!');
}
