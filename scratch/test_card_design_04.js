const fs = require('fs');
const assert = require('assert');
const { execSync } = require('child_process');

console.log('=== STARTING TEST SUITE: SC-ADMIN-CARD-DESIGN-04 ===\n');

// 1. Syntax check
try {
  execSync('node --check js/product-form.js', { stdio: 'pipe' });
  console.log('[PASS] Test 0: JavaScript syntax check passed cleanly.');
} catch (e) {
  console.error('[FAIL] Syntax error in js/product-form.js:', e.message);
  process.exit(1);
}

// 2. Static inspections
const jsContent = fs.readFileSync('js/product-form.js', 'utf8');

// A. Check button IDs exist and unique
const bCancelDeskCount = (jsContent.match(/id=["']btn-cancel-card-design["']/g) || []).length;
const bCancelMobCount = (jsContent.match(/id=["']btn-cancel-card-design-mob["']/g) || []).length;
assert.strictEqual(bCancelDeskCount, 1, 'btn-cancel-card-design must exist once in template');
assert.strictEqual(bCancelMobCount, 1, 'btn-cancel-card-design-mob must exist once in template');
console.log('[PASS] Static Check: Desktop & Mobile [Batal] buttons present and unique.');

// B. Check padding p-3 and max-w-[284px] removed from outer wrapper template and class lists
assert(!jsContent.includes('p-3 rounded-xl bg-slate-100/70 max-w-[284px]'), 'Static grey wrapper with p-3 and 284px removed');
assert(jsContent.includes('getThemeBodyColor()'), 'getThemeBodyColor is called to get active body theme color');
console.log('[PASS] Static Check: Wrapper padding p-3 and 284px width removed; dynamic Body color used.');

// 3. Dynamic Behavioral Tests via VM Sandbox
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
    this.style = {
      setProperty: (k, v) => { this.style[k] = v; }
    };
    this._innerHTML = '';
    this.children = [];
    this.parentElement = null;
    this.checked = false;
    this.value = '';
    this.listeners = {};
    this.textContent = '';
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
  getAttribute(name) { return this.attributes[name] || null; }
  setAttribute(name, val) { this.attributes[name] = val; }
  hasAttribute(name) { return name in this.attributes; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener(ev, fn) {
    if (!this.listeners[ev]) this.listeners[ev] = [];
    this.listeners[ev].push(fn);
  }
  removeEventListener() {}
  dispatchEvent(event) {
    const evType = typeof event === 'string' ? event : event.type;
    if (this.listeners[evType]) {
      this.listeners[evType].forEach(fn => fn({ preventDefault: () => {}, target: this }));
    }
  }
  querySelector(sel) {
    if (sel.startsWith('#')) return mockDoc.getElementById(sel.slice(1));
    return new MockElement('div');
  }
  querySelectorAll(sel) { return []; }
  closest(sel) { return this.parentElement || new MockElement('div'); }
}

const mockDoc = {
  elementsById: {},
  body: new MockElement('body'),
  documentElement: new MockElement('html'),
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

let dbSettingsState = {
  primary_color: '#33b589',
  body_bg_color: '#f8fafc',
  card_variants_config: {}
};

let dbSavedPresets = {};
let dbSavedProducts = {};
let dbCallCounters = {
  saveCardModelPreset: 0,
  saveSettings: 0,
  saveProduct: 0
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
    saveSettings: (s) => {
      dbCallCounters.saveSettings++;
      dbSettingsState = JSON.parse(JSON.stringify(s));
    },
    saveCardModelPreset: (variant, config) => {
      dbCallCounters.saveCardModelPreset++;
      dbSavedPresets[variant] = JSON.parse(JSON.stringify(config));
    },
    getProductById: (id) => dbSavedProducts[id] || null,
    saveProduct: (p) => {
      dbCallCounters.saveProduct++;
      dbSavedProducts[p.id] = JSON.parse(JSON.stringify(p));
    }
  },
  App: {
    showToast: () => {}
  }
};

vm.createContext(sandbox);
vm.runInContext(jsContent, sandbox);

const ProductForm = sandbox.window.ProductForm || sandbox.ProductForm;
assert(ProductForm, 'ProductForm module exported');

// Setup required mock elements in mockDoc
const outerDesk = mockDoc.getElementById('preview-card-outer-wrapper');
const outerMob = mockDoc.getElementById('preview-card-outer-wrapper-mob');
const liveCardBox = mockDoc.getElementById('card-live-preview-box');
const previewContainer = mockDoc.getElementById('product-card-preview-container');
const mobileCardBox = mockDoc.getElementById('mobile-card-preview-container');
const tabDefDesk = mockDoc.getElementById('tab-card-design-default');
const tabCustDesk = mockDoc.getElementById('tab-card-design-custom');
const panelCustDesk = mockDoc.getElementById('panel-card-custom-content');
const tabDefMob = mockDoc.getElementById('tab-card-design-default-mob');
const tabCustMob = mockDoc.getElementById('tab-card-design-custom-mob');
const panelCustMob = mockDoc.getElementById('panel-card-custom-content-mob');
const btnCancelDesk = mockDoc.getElementById('btn-cancel-card-design');
const btnSaveDesk = mockDoc.getElementById('btn-save-card-design');
const btnCancelMob = mockDoc.getElementById('btn-cancel-card-design-mob');
const btnSaveMob = mockDoc.getElementById('btn-save-card-design-mob');
const saveDefToggle = mockDoc.getElementById('cfg-save-as-default-toggle');
const saveDefToggleMob = mockDoc.getElementById('cfg-save-as-default-toggle-mob');

// Wire event listeners on mock buttons like bindProductFormEvents does
tabDefDesk.addEventListener('click', () => ProductForm.setCardCustomizationView(false));
tabCustDesk.addEventListener('click', () => ProductForm.setCardCustomizationView(true));
tabDefMob.addEventListener('click', () => ProductForm.setCardCustomizationView(false));
tabCustMob.addEventListener('click', () => ProductForm.setCardCustomizationView(true));
btnCancelDesk.addEventListener('click', ProductForm.handleCancelCardDesign);
btnCancelMob.addEventListener('click', ProductForm.handleCancelCardDesign);
btnSaveDesk.addEventListener('click', ProductForm.handleSaveCardDesign);
btnSaveMob.addEventListener('click', ProductForm.handleSaveCardDesign);

// Color inputs
const cfgTitleColor = mockDoc.getElementById('cfg-title-color');
const cfgBgColor = mockDoc.getElementById('cfg-bg-color');
const cfgPriceColor = mockDoc.getElementById('cfg-price-color');
const cfgBtnColor = mockDoc.getElementById('cfg-btn-color');
const cfgBorderColor = mockDoc.getElementById('cfg-border-color');
const cfgBorderRadius = mockDoc.getElementById('cfg-border-radius');

// Footer 1 & 2 inputs
const inpF1Text = mockDoc.getElementById('input-card-footer-text');
const cfgF1Bg = mockDoc.getElementById('cfg-footer-bg-color');
const cfgF1Text = mockDoc.getElementById('cfg-footer-text-color');
const selF1Icon = mockDoc.getElementById('select-card-footer-icon');

const inpF2Text = mockDoc.getElementById('input-card-footer-2-text');
const cfgF2Bg = mockDoc.getElementById('cfg-footer-2-bg-color');
const cfgF2Text = mockDoc.getElementById('cfg-footer-2-text-color');
const selF2Icon = mockDoc.getElementById('select-card-footer-2-icon');


// =========================================================================
// TEST 1: Warna pembungkus berasal dari tema Body; padding dihapus; Step 2 terisolasi.
// =========================================================================
console.log('\n--- Running Test 1: Latar Mengikuti Tema Body & Step 2 Terisolasi ---');
assert.strictEqual(ProductForm.getThemeBodyColor(), '#f8fafc', 'Default Body color is #f8fafc');

// Change DB theme body color to custom color
dbSettingsState.body_bg_color = '#e2e8f0';
assert.strictEqual(ProductForm.getThemeBodyColor(), '#e2e8f0', 'getThemeBodyColor dynamically tracks settings.body_bg_color');

// Verify wrapper classes in Step 1
outerDesk.classList.add('max-w-[260px]');
outerDesk.style.backgroundColor = ProductForm.getThemeBodyColor();
assert.strictEqual(outerDesk.style.backgroundColor, '#e2e8f0', 'Step 1 wrapper background set to Body color');
assert(!outerDesk.classList.contains('p-3'), 'Outer wrapper does not have p-3 padding');
assert(!outerDesk.classList.contains('max-w-[284px]'), 'Outer wrapper does not have 284px width');
assert(outerDesk.classList.contains('max-w-[260px]'), 'Outer wrapper preserves max-w-[260px]');

// Step 2 Isolation: backgroundColor must be cleared
outerDesk.style.backgroundColor = '';
assert.strictEqual(outerDesk.style.backgroundColor, '', 'Step 2 isolates wrapper, background is cleared');
console.log('[PASS] Test 1: Latar pembungkus mengikuti tema Body (#e2e8f0), tanpa padding p-3, Step 2 terisolasi.');


// =========================================================================
// TEST 2: Edit beberapa properti termasuk footer bertingkat/nested -> Batal memulihkan semuanya
// =========================================================================
console.log('\n--- Running Test 2: Edit Properti + Nested Footer & Batal ---');
// Setup initial state for Card C
const primaryState = ProductForm.getPrimaryState();
primaryState.card_variant = 'C';
primaryState.use_default_card_design = false;
primaryState.card_config = {
  bg_color: '#ffffff',
  title_color: '#112233',
  price_color: '#33b589',
  border_color: '#e2e8f0',
  border_radius: '16px'
};
primaryState.custom_footer_1 = {
  text: 'Footer Awal 1',
  icon: 'truck',
  bg_color: '#10b981',
  text_color: '#ffffff'
};
primaryState.custom_footer_2 = {
  text: 'Footer Awal 2',
  icon: 'star',
  bg_color: '#059669',
  text_color: '#ffffff'
};
primaryState.card_footer_text = 'Footer Awal 1';
primaryState.footer_bg_color = '#10b981';
primaryState.footer_text_color = '#ffffff';
primaryState.card_footer_2_text = 'Footer Awal 2';
primaryState.footer_2_bg_color = '#059669';
primaryState.footer_2_text_color = '#ffffff';

// Capture baseline snapshot for this session
ProductForm.captureCardDesignSnapshot(true);
const initialSnapshot = ProductForm.getCardDesignSnapshot();
assert(initialSnapshot, 'Snapshot must be captured');
assert.strictEqual(initialSnapshot.card_config.title_color, '#112233');
assert.strictEqual(initialSnapshot.custom_footer_1.text, 'Footer Awal 1');

// Now user edits properties
primaryState.card_config.title_color = '#ff0000';
cfgTitleColor.value = '#ff0000';
primaryState.custom_footer_1.text = 'Footer Diedit 1';
primaryState.card_footer_text = 'Footer Diedit 1';
inpF1Text.value = 'Footer Diedit 1';
primaryState.custom_footer_1.bg_color = '#990000';
primaryState.footer_bg_color = '#990000';
cfgF1Bg.value = '#990000';

// User clicks Batal
ProductForm.handleCancelCardDesign();

// Assert restoration
assert.strictEqual(primaryState.card_config.title_color, '#112233', 'title_color restored to initial snapshot');
assert.strictEqual(primaryState.custom_footer_1.text, 'Footer Awal 1', 'custom_footer_1.text restored to initial snapshot');
assert.strictEqual(primaryState.custom_footer_1.bg_color, '#10b981', 'custom_footer_1.bg_color restored to initial snapshot');
assert.strictEqual(inpF1Text.value, 'Footer Awal 1', 'DOM input inpF1Text restored');
assert.strictEqual(cfgF1Bg.value, '#10b981', 'DOM input cfgF1Bg restored');
console.log('[PASS] Test 2: Edit properti bertingkat (custom_footer_1 & title_color) sukses dipulihkan oleh Batal.');


// =========================================================================
// TEST 3: Default setelah desain kustom -> Batal mengembalikan desain awal
// =========================================================================
console.log('\n--- Running Test 3: Default Lalu Batal Mengembalikan Desain Kustom ---');
// User is in custom design
assert.strictEqual(primaryState.use_default_card_design, false);
primaryState.card_config.title_color = '#778899';
ProductForm.captureCardDesignSnapshot(true);

// User clicks [Default]
tabDefDesk.dispatchEvent('click');
assert.strictEqual(primaryState.use_default_card_design, true, 'User switched to default mode');

// User clicks [Batal]
ProductForm.handleCancelCardDesign();
assert.strictEqual(primaryState.use_default_card_design, false, 'use_default_card_design restored to false');
assert.strictEqual(primaryState.card_config.title_color, '#778899', 'Custom title_color restored');
console.log('[PASS] Test 3: Klik [Default] lalu [Batal] berhasil mengembalikan status custom dan desain awal.');


// =========================================================================
// TEST 4: Pindah tab/tutup-buka/rerender -> snapshot awal tidak tertimpa
// =========================================================================
console.log('\n--- Running Test 4: Rerender & Navigasi Tab Tidak Menimpa Snapshot ---');
// Current snapshot title_color is #778899
// User edits title_color to #445566
primaryState.card_config.title_color = '#445566';
cfgTitleColor.value = '#445566';

// Simulate switching to Pratinjau tab and back to Desain Kartu (which triggers render / live preview)
ProductForm.setPreviewStep1Tab('preview');
ProductForm.setPreviewStep1Tab('design');

// Verify snapshot was NOT overwritten with the edited value
const snapCheck = ProductForm.getCardDesignSnapshot();
assert.strictEqual(snapCheck.card_config.title_color, '#778899', 'Snapshot still holds #778899, not overwritten by rerender');
assert.strictEqual(primaryState.card_config.title_color, '#445566', 'Active edit state still holds #445566 before cancel');

// Clicking Batal now restores to #778899
ProductForm.handleCancelCardDesign();
assert.strictEqual(primaryState.card_config.title_color, '#778899', 'Restored cleanly after rerender cycle');
console.log('[PASS] Test 4: Pindah tab dan rerender tidak menimpa snapshot awal.');


// =========================================================================
// TEST 5: Simpan berhasil -> edit lagi -> Batal kembali ke hasil simpan terakhir
// =========================================================================
console.log('\n--- Running Test 5: Simpan Sukses Memperbarui Baseline Batal Berikutnya ---');
primaryState.card_config.title_color = '#334455';
cfgTitleColor.value = '#334455';

// User clicks [Simpan Perubahan]
ProductForm.handleSaveCardDesign();

// Snapshot must now be updated to #334455
const savedSnap = ProductForm.getCardDesignSnapshot();
assert.strictEqual(savedSnap.card_config.title_color, '#334455', 'Snapshot updated to saved state');

// User edits further to #998877
primaryState.card_config.title_color = '#998877';
cfgTitleColor.value = '#998877';

// User clicks [Batal] -> must revert to #334455 (last save), NOT the older #778899
ProductForm.handleCancelCardDesign();
assert.strictEqual(primaryState.card_config.title_color, '#334455', 'Batal correctly restored to last saved baseline');
console.log('[PASS] Test 5: Simpan berhasil memperbarui baseline snapshot untuk pembatalan selanjutnya.');


// =========================================================================
// TEST 6: Kegagalan simpan mempertahankan kemampuan Batal
// =========================================================================
console.log('\n--- Running Test 6: Kegagalan Simpan Mempertahankan Kemampuan Batal ---');
// Baseline is #334455
// User edits to #121212
primaryState.card_config.title_color = '#121212';
cfgTitleColor.value = '#121212';
saveDefToggle.checked = true; // Attempt to save default preset

// Mock saveCardModelPreset throwing an error
const origSavePreset = sandbox.DB.saveCardModelPreset;
sandbox.DB.saveCardModelPreset = () => {
  throw new Error('Database Disk Full Error');
};

// User clicks [Simpan Perubahan] -> fails
ProductForm.handleSaveCardDesign();

// Snapshot should still be #334455 (NOT updated to #121212)
const failedSnap = ProductForm.getCardDesignSnapshot();
assert.strictEqual(failedSnap.card_config.title_color, '#334455', 'Snapshot was NOT updated because save failed');

// User can still cancel to restore #334455
ProductForm.handleCancelCardDesign();
assert.strictEqual(primaryState.card_config.title_color, '#334455', 'Batal restored cleanly even after failed save');

// Restore original function
sandbox.DB.saveCardModelPreset = origSavePreset;
saveDefToggle.checked = false;
console.log('[PASS] Test 6: Kegagalan simpan mempertahankan snapshot dan fungsi Batal tetap utuh.');


// =========================================================================
// TEST 7: Batal tidak menulis preset DB atau mengubah data produk lain
// =========================================================================
console.log('\n--- Running Test 7: Batal Tidak Menulis DB atau Merusak Data Produk Lain ---');
const prevPresetCalls = dbCallCounters.saveCardModelPreset;
const prevSettingCalls = dbCallCounters.saveSettings;
const prevProductCalls = dbCallCounters.saveProduct;

primaryState.name = 'Produk Unggulan Tetap Utuh';
primaryState.card_config.title_color = '#abcdef';
ProductForm.handleCancelCardDesign();

assert.strictEqual(dbCallCounters.saveCardModelPreset, prevPresetCalls, '0 DB preset writes on Batal');
assert.strictEqual(dbCallCounters.saveSettings, prevSettingCalls, '0 DB settings writes on Batal');
assert.strictEqual(dbCallCounters.saveProduct, prevProductCalls, '0 DB product writes on Batal');
assert.strictEqual(primaryState.name, 'Produk Unggulan Tetap Utuh', 'Product name completely untouched by Batal');
console.log('[PASS] Test 7: Batal murni beroperasi di sesi lokal tanpa menulis DB atau merusak produk.');


// =========================================================================
// TEST 8: Produk/model berbeda tidak menerima snapshot lama; cegah aksi ganda
// =========================================================================
console.log('\n--- Running Test 8: Isolasi Antar-Model/Produk & Proteksi Re-entrancy ---');
// Switch model from C to B
primaryState.card_variant = 'B';
primaryState.use_default_card_design = true;
delete primaryState.card_config;

// Load config for model B
ProductForm.loadCardConfigInputs('B');
const modelBSnap = ProductForm.getCardDesignSnapshot();
assert.strictEqual(modelBSnap.card_variant, 'B', 'Model B captures distinct snapshot key');
assert.notStrictEqual(modelBSnap.card_config?.title_color, '#334455', 'Model B does not receive Model C snapshot');

// Test double-click / rapid execution
btnCancelDesk.dispatchEvent('click');
btnCancelDesk.dispatchEvent('click');
assert.strictEqual(primaryState.card_variant, 'B', 'Re-entrant clicks execute safely without corruption');
console.log('[PASS] Test 8: Isolasi antar-model terjaga sempurna dan proteksi aksi ganda aktif.');

console.log('\n=== ALL 8 TEST SUITES FOR SC-ADMIN-CARD-DESIGN-04 PASSED SUCCESSFULLY ===');
