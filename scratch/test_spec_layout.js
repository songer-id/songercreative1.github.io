const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('=== TEST SUITE: SC-ADMIN-LAYOUT-SPEC-01 ===\n');

// 1. Mock DOM Environment
class MockClassList {
  constructor(initStr = '') {
    this.classes = new Set(initStr ? initStr.split(/\s+/).filter(Boolean) : []);
  }
  add(...cls) { cls.forEach(c => c && this.classes.add(c)); }
  remove(...cls) { cls.forEach(c => c && this.classes.delete(c)); }
  contains(cls) { return this.classes.has(cls); }
  toString() { return Array.from(this.classes).join(' '); }
}

const elementRegistry = new Map();

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
    this._innerHTML = '';
    this.style = {};
    this.onclick = null;
    this.oninput = null;
    this.disabled = false;
    if (id) elementRegistry.set(id, this);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(html) {
    this._innerHTML = html;
    if (html.includes('custom-spec-row')) {
      const tr = new MockElement('tr');
      tr.classList.add('custom-spec-row');
      const titleInp = new MockElement('input');
      titleInp.classList.add('input-spec-title');
      const valInp = new MockElement('input');
      valInp.classList.add('input-spec-value');
      const delBtn = new MockElement('button');
      delBtn.classList.add('btn-delete-spec-row');
      tr.appendChild(titleInp);
      tr.appendChild(valInp);
      tr.appendChild(delBtn);
      this.children = [tr];
      tr.parentElement = this;
    } else {
      this.children = [];
    }
  }

  get firstElementChild() {
    return this.children[0] || null;
  }

  getAttribute(name) { return this.attributes[name] || null; }
  setAttribute(name, val) {
    this.attributes[name] = String(val);
    if (name === 'class') this.classList = new MockClassList(String(val));
    if (name === 'id') {
      this.id = String(val);
      elementRegistry.set(this.id, this);
    }
  }
  removeAttribute(name) { delete this.attributes[name]; }

  appendChild(child) {
    if (child.parentElement) {
      child.parentElement.removeChild(child);
    }
    this.children.push(child);
    child.parentElement = this;
    if (child.id) elementRegistry.set(child.id, child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentElement = null;
      if (child.id) elementRegistry.delete(child.id);
    }
    return child;
  }

  remove() {
    if (this.parentElement) {
      this.parentElement.removeChild(this);
    }
  }

  querySelectorAll(selector) {
    const results = [];
    const walk = (node) => {
      for (const child of node.children) {
        if (selector === 'tr.custom-spec-row' && child.classList.contains('custom-spec-row')) {
          results.push(child);
        } else if (selector === '.input-spec-title' && child.classList.contains('input-spec-title')) {
          results.push(child);
        } else if (selector === '.input-spec-value' && child.classList.contains('input-spec-value')) {
          results.push(child);
        } else if (selector === '.btn-delete-spec-row' && child.classList.contains('btn-delete-spec-row')) {
          results.push(child);
        }
        walk(child);
      }
    };
    walk(this);
    return results;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all[0] || null;
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (selector === 'tr.custom-spec-row' && curr.classList.contains('custom-spec-row')) return curr;
      if (selector === '.btn-delete-spec-row' && curr.classList.contains('btn-delete-spec-row')) return curr;
      curr = curr.parentElement;
    }
    return null;
  }

  matches(sel) {
    if (sel.includes('.input-spec-title') && this.classList.contains('input-spec-title')) return true;
    if (sel.includes('.input-spec-value') && this.classList.contains('input-spec-value')) return true;
    return false;
  }
}

// Global mocks
const mockDocument = {
  _listeners: {},
  addEventListener: (evt, cb) => {
    mockDocument._listeners[evt] = mockDocument._listeners[evt] || [];
    mockDocument._listeners[evt].push(cb);
  },
  removeEventListener: (evt, cb) => {
    if (!mockDocument._listeners[evt]) return;
    mockDocument._listeners[evt] = mockDocument._listeners[evt].filter(c => c !== cb);
  },
  getElementById: (id) => elementRegistry.get(id) || null,
  querySelector: (sel) => {
    if (sel.startsWith('#')) return elementRegistry.get(sel.slice(1)) || null;
    for (const el of elementRegistry.values()) {
      const match = el.querySelector(sel);
      if (match) return match;
    }
    return null;
  },
  querySelectorAll: (sel) => {
    const res = [];
    for (const el of elementRegistry.values()) {
      res.push(...el.querySelectorAll(sel));
    }
    return res;
  },
  createElement: (tag) => new MockElement(tag),
  body: new MockElement('body', 'body')
};

const sandbox = {
  window: {
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} })
  },
  document: mockDocument,
  console: console,
  navigator: { userAgent: 'Node' },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  DB: {
    generateUUID: () => 'uuid-' + Math.random().toString(36).slice(2),
    getProducts: () => [],
    getCategories: () => [],
    getSettings: () => ({ shop_city: 'Surabaya', shop_district: 'Wonokromo' })
  }
};
sandbox.window.document = mockDocument;

const productFormCode = fs.readFileSync(path.join(__dirname, '../js/product-form.js'), 'utf8');
vm.createContext(sandbox);
vm.runInContext(productFormCode, sandbox);

const ProductForm = sandbox.window.ProductForm || sandbox.ProductForm;
console.log('✓ ProductForm successfully loaded in sandbox:', typeof ProductForm);

// ==========================================
// TEST 1: STATIC HTML INSPECTION & EMPTY STATE
// ==========================================
console.log('\n--- TEST 1: Static HTML & Empty State ---');
const emptyHtml = ProductForm.renderCustomSpecsTableHtml();

// 1.1 Remove decorative icon beside "Atribut & Keterangan Spesifikasi Tambahan"
assert(
  !emptyHtml.includes('bi-card-checklist'),
  'Decorative icon bi-card-checklist must be removed'
);
assert(
  emptyHtml.includes('Atribut & Keterangan Spesifikasi Tambahan'),
  'Title text must remain intact'
);
console.log('✓ Decorative icon bi-card-checklist removed, title preserved');

// 1.2 Add-row button: ONE existing plus icon + text "Tambah Baris Spesifikasi" (no literal "+")
assert(
  emptyHtml.includes('<i class="bi bi-plus-lg"></i>'),
  'Plus icon bi-plus-lg must be preserved'
);
assert(
  emptyHtml.includes('<span>Tambah Baris Spesifikasi</span>'),
  'Text must be "Tambah Baris Spesifikasi" without literal "+"'
);
assert(
  !emptyHtml.includes('<span>+ Tambah Baris Spesifikasi</span>'),
  'Literal "+" must be removed from button text'
);
console.log('✓ Add-row button has ONE plus icon + "Tambah Baris Spesifikasi" without literal "+"');

// 1.3 Column headings: Judul, Keterangan, Aksi inside thead
assert(
  emptyHtml.includes('id="custom-specs-thead"'),
  'custom-specs-thead ID must exist'
);
assert(
  emptyHtml.includes('<thead id="custom-specs-thead" class="hidden">'),
  'thead must have class "hidden" in empty state'
);
assert(
  emptyHtml.includes('Judul') && emptyHtml.includes('Keterangan') && emptyHtml.includes('Aksi'),
  'Headings Judul, Keterangan, Aksi must exist'
);
assert(
  emptyHtml.includes('<th class="py-1.5 pl-2 w-10 text-center font-semibold">Aksi</th>'),
  '"Aksi" column header must be centered with text-center'
);
console.log('✓ In empty state: headings are hidden (class="hidden"), Aksi is centered');

// ==========================================
// TEST 2: DYNAMIC FIRST ROW ADDED
// ==========================================
console.log('\n--- TEST 2: Dynamic Add First Row ---');

// Setup mock DOM for specs table
const theadEl = new MockElement('thead', 'custom-specs-thead');
theadEl.classList.add('hidden');
const tbodyEl = new MockElement('tbody', 'custom-specs-tbody');
const btnAddEl = new MockElement('button', 'btn-add-spec-row');
const counterEl = new MockElement('span', 'custom-specs-counter');

// Bind events
ProductForm.bindCustomSpecsEvents();

// Initially empty check
assert(theadEl.classList.contains('hidden'), 'thead must initially have hidden class');
assert.strictEqual(counterEl.textContent, '0 / 10', 'Counter must show 0 / 10');

// Click add row
btnAddEl.onclick();

assert.strictEqual(tbodyEl.children.length, 1, 'tbody must have 1 row after click');
assert(!theadEl.classList.contains('hidden'), 'thead must NOT have hidden class after first row added');
assert.strictEqual(counterEl.textContent, '1 / 10', 'Counter must show 1 / 10');
console.log('✓ First row added: thead is visible (hidden removed), counter = 1 / 10');

// ==========================================
// TEST 3: PRESERVATION OF ENTERED VALUES
// ==========================================
console.log('\n--- TEST 3: Preservation of Entered Values ---');

// Set values on row 1
const row1 = tbodyEl.children[0];
const title1 = row1.querySelectorAll('.input-spec-title')[0];
const val1 = row1.querySelectorAll('.input-spec-value')[0];
title1.value = 'Material';
val1.value = 'Akrilik Bening 3mm';

// Add row 2
btnAddEl.onclick();
assert.strictEqual(tbodyEl.children.length, 2, 'tbody must have 2 rows');
assert(!theadEl.classList.contains('hidden'), 'thead must remain visible');
assert.strictEqual(counterEl.textContent, '2 / 10', 'Counter must show 2 / 10');

const row2 = tbodyEl.children[1];
const title2 = row2.querySelectorAll('.input-spec-title')[0];
const val2 = row2.querySelectorAll('.input-spec-value')[0];
title2.value = 'Berat';
val2.value = '150 gram';

// Call syncStateFromDOM
ProductForm.syncStateFromDOM();

// Verify values preserved in DOM and inputs
assert.strictEqual(title1.value, 'Material');
assert.strictEqual(val1.value, 'Akrilik Bening 3mm');
assert.strictEqual(title2.value, 'Berat');
assert.strictEqual(val2.value, '150 gram');
console.log('✓ Entered values for row 1 and row 2 are preserved correctly');

// ==========================================
// TEST 4: DYNAMIC DELETE ROWS (LAST ROW DELETED)
// ==========================================
console.log('\n--- TEST 4: Dynamic Delete Rows ---');

// Delete row 2
const delBtn2 = row2.querySelectorAll('.btn-delete-spec-row')[0];
tbodyEl.onclick({ target: delBtn2 });

assert.strictEqual(tbodyEl.children.length, 1, 'tbody must have 1 row left');
assert(!theadEl.classList.contains('hidden'), 'thead must remain visible with 1 row left');
assert.strictEqual(counterEl.textContent, '1 / 10', 'Counter must show 1 / 10');
console.log('✓ Row 2 deleted: 1 row remains, thead still visible, counter = 1 / 10');

// Delete row 1 (last row)
const delBtn1 = row1.querySelectorAll('.btn-delete-spec-row')[0];
tbodyEl.onclick({ target: delBtn1 });

assert.strictEqual(tbodyEl.children.length, 0, 'tbody must be empty');
assert(theadEl.classList.contains('hidden'), 'thead must have hidden class when last row deleted');
assert.strictEqual(counterEl.textContent, '0 / 10', 'Counter must show 0 / 10');
assert.strictEqual(btnAddEl.disabled, false, 'Add button must remain enabled');
console.log('✓ Last row deleted: thead is hidden again, counter = 0 / 10, add-row button remains active');

// ==========================================
// TEST 5: EDITING PRODUCT WITH EXISTING ROWS
// ==========================================
console.log('\n--- TEST 5: Editing Product With Existing Rows ---');

const dummyExistingSpecs = [
  { title: 'Dimensi (PxLxT)', value: '20 x 10 x 5 cm' },
  { title: 'Bahan', value: 'Kayu Mahoni' },
  { title: 'Finishing', value: 'Pernis Natural Doff' }
];

// Set in primaryState via loadProductForEdit
const testProd = {
  name: 'Kotak Tissue Kayu',
  product_type: 'custom',
  price: 50000,
  custom_specs: dummyExistingSpecs
};
ProductForm.loadProductForEdit(testProd);

const editHtml = ProductForm.renderCustomSpecsTableHtml();

// Check thead in editHtml
assert(
  !editHtml.includes('<thead id="custom-specs-thead" class="hidden">'),
  'thead must NOT be hidden when editing a product with existing specs'
);
assert(
  editHtml.includes('20 x 10 x 5 cm'),
  'Existing value 1 must be present in rendered HTML'
);
assert(
  editHtml.includes('Kayu Mahoni'),
  'Existing value 2 must be present in rendered HTML'
);
assert(
  editHtml.includes('Pernis Natural Doff'),
  'Existing value 3 must be present in rendered HTML'
);
assert(
  editHtml.includes('3 / 10'),
  'Counter must render 3 / 10'
);
console.log('✓ Editing product with existing rows: headings appear immediately, values populated, counter = 3 / 10');

console.log('\n=========================================');
console.log('ALL SC-ADMIN-LAYOUT-SPEC-01 TESTS PASSED! ✓');
console.log('=========================================');
