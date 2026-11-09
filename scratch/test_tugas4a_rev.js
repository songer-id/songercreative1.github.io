/**
 * Test Suite untuk REVISI TUGAS 4A: Layout Panduan Ukuran dan Urutan Pengaturan
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('=== MEMULAI TEST SUITE REVISI TUGAS 4A ===');

class MockClassList {
  constructor() { this.classes = new Set(); }
  add(...cls) { cls.forEach(c => this.classes.add(c)); }
  remove(...cls) { cls.forEach(c => this.classes.delete(c)); }
  contains(cls) { return this.classes.has(cls); }
  toggle(cls, force) {
    if (force !== undefined) {
      if (force) this.classes.add(cls); else this.classes.delete(cls);
      return force;
    }
    if (this.classes.has(cls)) { this.classes.delete(cls); return false; }
    else { this.classes.add(cls); return true; }
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
    this._checked = false;
    this.style = {};
    this.onclick = null;
    this.oninput = null;
    this.onchange = null;
    this._focused = false;
  }
  get checked() { return this._checked; }
  set checked(val) {
    this._checked = Boolean(val);
    if (this._checked && this.tagName === 'INPUT' && this.getAttribute('name')) {
      const name = this.getAttribute('name');
      for (const el of elementRegistry.values()) {
        if (el !== this && el.tagName === 'INPUT' && el.getAttribute('name') === name) {
          el._checked = false;
        }
      }
    }
  }
  getAttribute(name) { return this.attributes[name] || null; }
  setAttribute(name, val) { this.attributes[name] = String(val); }
  hasAttribute(name) { return name in this.attributes; }
  removeAttribute(name) { delete this.attributes[name]; }
  focus() { this._focused = true; }
  scrollIntoView() { this._scrolled = true; }
  insertAdjacentHTML() {}
  click() {
    if (this.onclick) {
      this.onclick({
        preventDefault: () => {},
        stopPropagation: () => {},
        target: this
      });
    }
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
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
  closest() { return this; }
}

function matches(el, sel) {
  if (!el || !sel) return false;
  if (sel.includes(':checked')) {
    if (!el.checked) return false;
    sel = sel.replace(':checked', '').trim();
  }
  if (sel.includes(',')) {
    return sel.split(',').some(s => matches(el, s.trim()));
  }
  if (sel.startsWith('#')) return el.id === sel.slice(1);
  if (sel.startsWith('.')) return el.classList && el.classList.contains(sel.slice(1));
  if (sel.includes('[') && sel.includes(']')) {
    const tagPart = sel.split('[')[0];
    const attrPart = sel.slice(sel.indexOf('[') + 1, sel.indexOf(']'));
    if (tagPart && el.tagName.toLowerCase() !== tagPart.toLowerCase()) return false;
    const [attrName, attrValWithQuotes] = attrPart.split('=');
    const attrVal = attrValWithQuotes ? attrValWithQuotes.replace(/['"]/g, '') : null;
    if (attrVal !== null) {
      return el.getAttribute(attrName.trim()) === attrVal;
    }
    return el.hasAttribute(attrName.trim());
  }
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
  Utils: { formatDynamicSellerLocation: () => 'Surabaya' },
  App: { showToast: () => {} }
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
const primaryState = PF.getPrimaryState();

// -----------------------------------------------------------------------------
// 1. UJI STRUKTUR LAYOUT HEADER PANDUAN UKURAN (SELARAS DENGAN INPUT UKURAN P X L)
// -----------------------------------------------------------------------------
console.log('\n--- 1. Pengujian Layout Header Panduan Ukuran ---');
primaryState.size_guide = { enabled: true, type: '', template: 'pakaian' };
const headerHtml = PF.renderSizeGuideSectionHtml();

// Harus memiliki wrapper judul dan toggle yang rapi
assert(headerHtml.includes('id="card-size-guide-wrapper"'), 'Memiliki id card-size-guide-wrapper');
assert(headerHtml.includes('id="toggle-size-guide-enable"'), 'Memiliki toggle id toggle-size-guide-enable');
assert(headerHtml.includes('text-sm font-bold text-slate-900'), 'Judul Panduan Ukuran seukuran dengan Input Ukuran P x L (text-sm font-bold)');
assert(headerHtml.includes('text-xs text-slate-500'), 'Deskripsi seukuran dengan Input Ukuran P x L (text-xs text-slate-500)');

// Tidak boleh ada nested border abu-abu kotak kartu lama
assert(!headerHtml.includes('p-3 rounded-lg bg-slate-50 border border-slate-200'), 'TIDAK BOLEH ada border abu-abu / kartu pada header switch');
assert(headerHtml.includes('border-t border-slate-100'), 'Menggunakan pemisah garis sederhana border-t border-slate-100');
console.log('✔ 1. Layout Header Panduan Ukuran selaras dengan Input Ukuran (P x L) (PASS)');

// -----------------------------------------------------------------------------
// 2. UJI TIDAK ADA TIPE DEFAULT UNTUK KONFIGURASI BARU
// -----------------------------------------------------------------------------
console.log('\n--- 2. Pengujian Konfigurasi Baru (Tanpa Tipe Default) ---');
primaryState.size_guide = {
  enabled: true,
  type: '', // Baru dibuat
  template: 'pakaian',
  columns: ['Ukuran', 'Panjang'],
  rows: [['M', '70 cm']],
  image_url: '',
  linked_variation: null
};

const newCfgHtml = PF.renderSizeGuideSectionHtml();
// Kedua radio tidak boleh memiliki checked
assert(!newCfgHtml.includes('value="table" class="accent-[var(--color-primary)] cursor-pointer" checked'), 'Radio Tabel Data TIDAK BOLEH checked secara default');
assert(!newCfgHtml.includes('value="image" class="accent-[var(--color-primary)] cursor-pointer" checked'), 'Radio Upload Gambar TIDAK BOLEH checked secara default');

// Panel tabel dan panel gambar keduanya harus hidden secara default
assert(newCfgHtml.includes('id="size-guide-table-panel" class="hidden'), 'Panel Tabel Data harus hidden saat tipe belum dipilih');
assert(newCfgHtml.includes('id="size-guide-image-panel" class="hidden'), 'Panel Upload Gambar harus hidden saat tipe belum dipilih');
console.log('✔ 2. Konfigurasi baru tidak memilih tipe default dan tidak menampilkan tabel (PASS)');

// -----------------------------------------------------------------------------
// 3. UJI WAJIB PILIH VARIASI SEBELUM TIPE PANDUAN UKURAN (2-4 VARIASI AKTIF)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Pengujian Wajib Pilih Variasi Sebelum Tipe (2-4 Variasi) ---');
primaryState.has_variants = true;
primaryState.has_variation_2 = true;
primaryState.has_variation_3 = false;
primaryState.has_variation_4 = false;
primaryState.variation_labels = { label_tier_1: 'Warna', label_tier_2: 'Ukuran Baju' };
primaryState.size_guide = {
  enabled: true,
  type: '',
  columns: ['Ukuran', 'Panjang'],
  rows: [['M', '70 cm']],
  image_url: 'https://example.com/guide.jpg',
  linked_variation: '' // BELUM MEMILIH VARIASI!
};

// Buat mock elemen DOM untuk interaksi
function reg(id, tag = 'div') {
  const el = new MockElement(tag, id);
  elementRegistry.set(id, el);
  return el;
}

const toggleEnable = reg('toggle-size-guide-enable', 'input');
toggleEnable.checked = true;
const contentPanel = reg('size-guide-content-panel', 'div');
const lblTable = reg('lbl-size-guide-type-table', 'label');
const lblImage = reg('lbl-size-guide-type-image', 'label');
const radTable = reg('rad-table', 'input');
radTable.setAttribute('name', 'size_guide_type');
radTable.value = 'table';
const radImage = reg('rad-image', 'input');
radImage.setAttribute('name', 'size_guide_type');
radImage.value = 'image';

lblTable.children.push(radTable);
lblImage.children.push(radImage);

const tablePanel = reg('size-guide-table-panel', 'div');
tablePanel.classList.add('hidden');
const imagePanel = reg('size-guide-image-panel', 'div');
imagePanel.classList.add('hidden');

const typeErr = reg('size-guide-type-error', 'div');
typeErr.classList.add('hidden');
const linkErr = reg('size-guide-linked-variation-error', 'div');
linkErr.classList.add('hidden');

const triggerVar = reg('custom-select-size-guide-linked-variation', 'div');
const popoverVar = reg('size-guide-variation-popover', 'div');
popoverVar.classList.add('hidden');
const chevronVar = reg('size-guide-variation-chevron', 'i');
const hiddenVarInput = reg('select-size-guide-linked-variation', 'input');
hiddenVarInput.value = '';

// Bind event listeners
PF.bindSizeGuideEvents();

console.log('lblTable.onclick is:', typeof lblTable.onclick);

// Seller mencoba mengklik Tabel Data sebelum memilih variasi
console.log('Uji klik Tipe Panduan Ukuran sebelum memilih variasi...');
lblTable.click();

// 1. Radio tidak boleh aktif
assert.strictEqual(radTable.checked, false, 'Radio table tidak boleh checked');
assert.strictEqual(primaryState.size_guide.type, '', 'State type tidak boleh berubah menjadi table');
// 2. Table panel tetap hidden
assert.strictEqual(tablePanel.classList.contains('hidden'), true, 'Table panel tetap hidden');
// 3. Pesan petunjuk singkat muncul: "Pilih variasi terlebih dahulu."
assert.strictEqual(typeErr.textContent, 'Pilih variasi terlebih dahulu.', 'Pesan error harus "Pilih variasi terlebih dahulu."');
assert.strictEqual(typeErr.classList.contains('hidden'), false, 'Pesan error harus terlihat');
// 4. Fokus dan scroll diarahkan ke dropdown trigger
assert.strictEqual(triggerVar._focused, true, 'Trigger dropdown variasi harus menerima fokus');
assert.strictEqual(triggerVar._scrolled, true, 'Trigger dropdown variasi harus di-scroll into view');
// 5. Popover daftar pilihan variasi terbuka otomatis
assert.strictEqual(popoverVar.classList.contains('hidden'), false, 'Popover pilihan variasi terbuka otomatis');
console.log('✔ 3A: Klik tipe sebelum memilih variasi ditolak dan membuka dropdown variasi (PASS)');

// Seller mencoba mengklik Upload Gambar sebelum memilih variasi
lblImage.click();
assert.strictEqual(radImage.checked, false, 'Radio image tidak boleh checked');
assert.strictEqual(primaryState.size_guide.type, '', 'State type tidak boleh berubah menjadi image');
assert.strictEqual(imagePanel.classList.contains('hidden'), true, 'Image panel tetap hidden');
console.log('✔ 3B: Klik upload gambar sebelum memilih variasi juga ditolak (PASS)');

// -----------------------------------------------------------------------------
// 4. SETELAH VARIASI DIPILIH, TIPE PANDUAN UKURAN DAPAT DIGUNAKAN
// -----------------------------------------------------------------------------
console.log('\n--- 4. Pengujian Pemilihan Tipe Setelah Variasi Dipilih ---');
// Simulasikan seller memilih Variasi 2 (tier2)
primaryState.size_guide.linked_variation = 'tier2';
hiddenVarInput.value = 'tier2';
typeErr.classList.add('hidden');

// Sekarang seller mengklik Tabel Data
lblTable.click();
radTable.checked = true;
if (radTable.onchange) radTable.onchange();

assert.strictEqual(primaryState.size_guide.type, 'table', 'Tipe size guide berhasil menjadi table');
assert.strictEqual(tablePanel.classList.contains('hidden'), false, 'Table panel sekarang tampil (tidak hidden)');
assert.strictEqual(imagePanel.classList.contains('hidden'), true, 'Image panel tetap hidden');
console.log('✔ 4A: Setelah variasi dipilih, Tabel Data berhasil diaktifkan (PASS)');

// Seller beralih ke Upload Gambar
console.log('Before switch, primaryState.size_guide.type:', primaryState.size_guide.type);
console.log('radImage.value is:', radImage.value);
console.log('radImage.onchange is:', typeof radImage.onchange);
lblImage.click();
radImage.checked = true;
if (radImage.onchange) radImage.onchange({ target: radImage });
console.log('After switch, primaryState.size_guide.type:', primaryState.size_guide.type);

assert.strictEqual(primaryState.size_guide.type, 'image', 'Tipe size guide berhasil beralih ke image');
assert.strictEqual(imagePanel.classList.contains('hidden'), false, 'Image panel sekarang tampil (tidak hidden)');
assert.strictEqual(tablePanel.classList.contains('hidden'), true, 'Table panel menjadi hidden');
// Periksa data tabel tidak terhapus
assert(primaryState.size_guide.columns.length > 0, 'Data kolom tabel tidak boleh terhapus saat berpindah tipe');
console.log('✔ 4B: Berpindah ke Upload Gambar berhasil tanpa menghapus data tabel (PASS)');

// -----------------------------------------------------------------------------
// 5. PADA 0 ATAU 1 VARIASI, TIPE DAPAT LANGSUNG DIPILIH (PENGATURAN OTOMATIS)
// -----------------------------------------------------------------------------
console.log('\n--- 5. Pengujian 0 atau 1 Variasi Aktif (Langsung Bisa Pilih Tipe) ---');
// 1 variasi aktif
primaryState.has_variants = true;
primaryState.has_variation_2 = false;
primaryState.size_guide = { enabled: true, type: '', linked_variation: 'tier1' };

lblTable.click();
radTable.checked = true;
if (radTable.onchange) radTable.onchange();

assert.strictEqual(primaryState.size_guide.type, 'table', 'Pada 1 variasi, tipe table langsung aktif');
console.log('✔ 5A: Pada 1 variasi, tipe dapat langsung dipilih tanpa dropdown (PASS)');

// 0 variasi aktif (produk tunggal tanpa variasi)
primaryState.has_variants = false;
primaryState.size_guide = { enabled: true, type: '', linked_variation: null };

lblImage.click();
radImage.checked = true;
if (radImage.onchange) radImage.onchange();

assert.strictEqual(primaryState.size_guide.type, 'image', 'Pada produk tanpa variasi, tipe image langsung aktif');
console.log('✔ 5B: Pada produk tanpa variasi, tipe dapat langsung dipilih (PASS)');

// -----------------------------------------------------------------------------
// 6. PRODUK LAMA (EDIT MODE) TETAP MEMUAT KONFIGURASI DAN DATA SEBELUMNYA
// -----------------------------------------------------------------------------
console.log('\n--- 6. Pengujian Edit Produk Lama (Data Dipertahankan) ---');
const oldProd = {
  id: 'prod-old-123',
  name: 'Kemeja Flanel Premium',
  product_type: 'physical',
  price: 150000,
  has_variants: true,
  has_variation_2: true,
  variation_labels: { label_tier_1: 'Warna', label_tier_2: 'Ukuran' },
  size_guide: {
    enabled: true,
    type: 'table',
    template: 'pakaian',
    columns: ['Ukuran', 'Panjang', 'Lebar Dada'],
    rows: [['M', '70 cm', '50 cm'], ['L', '72 cm', '52 cm']],
    linked_variation: 'tier2',
    image_url: ''
  }
};

PF.loadProductForEdit(oldProd);
const loadedPrimary = PF.getPrimaryState();

assert.strictEqual(loadedPrimary.size_guide.enabled, true, 'Enabled dipertahankan');
assert.strictEqual(loadedPrimary.size_guide.type, 'table', 'Tipe table dipertahankan');
assert.strictEqual(loadedPrimary.size_guide.linked_variation, 'tier2', 'Linked variation tier2 dipertahankan');
assert.strictEqual(loadedPrimary.size_guide.columns.length, 3, 'Data 3 kolom dipertahankan');
assert.strictEqual(loadedPrimary.size_guide.rows.length, 2, 'Data 2 baris dipertahankan');
console.log('✔ 6. Produk lama tetap memuat konfigurasi dan data lengkap (PASS)');

// -----------------------------------------------------------------------------
// 7. UJI VALIDASI SIMPAN LENGKAP & VALID
// -----------------------------------------------------------------------------
console.log('\n--- 7. Pengujian Validasi Simpan Form ---');
loadedPrimary.name = 'Kemeja Flanel Premium';
loadedPrimary.category_id = 'cat-1';
loadedPrimary.product_type = 'physical';
loadedPrimary.price = 150000;
loadedPrimary.stock = 50;
loadedPrimary.size_guide.enabled = true;

// Kasus 7A: Ada 2 variasi, tapi belum memilih variasi terkait
console.log('Active tiers for size guide:', PF.getActiveVariationTiersForSizeGuide());
loadedPrimary.size_guide.linked_variation = '';
hiddenVarInput.value = '';
let errs = PF.validateForm(false);
console.log('Validation errors:', errs);
assert(errs.some(e => e.includes('Pilih variasi yang dikaitkan dengan Tabel Ukuran.')), 'Wajib tolak jika variasi belum dipilih');
console.log('✔ 7A: Validasi tolak simpan jika variasi belum dipilih (PASS)');

// Kasus 7B: Variasi dipilih, tapi tipe panduan ukuran kosong
loadedPrimary.size_guide.linked_variation = 'tier2';
hiddenVarInput.value = 'tier2';
loadedPrimary.size_guide.type = '';
radTable.checked = false;
radImage.checked = false;
errs = PF.validateForm(false);
assert(errs.some(e => e.includes('Pilih tipe panduan ukuran (Tabel Data atau Upload Gambar).')), 'Wajib tolak jika tipe panduan belum dipilih');
console.log('✔ 7B: Validasi tolak simpan jika tipe belum dipilih (PASS)');

// Kasus 7C: Tipe image tapi belum upload gambar
radImage.checked = true;
loadedPrimary.size_guide.type = 'image';
loadedPrimary.size_guide.image_url = '';
errs = PF.validateForm(false);
assert(errs.some(e => e.includes('Unggah foto bagan panduan ukuran')), 'Wajib tolak jika tipe image belum ada gambar');
console.log('✔ 7C: Validasi tolak simpan jika tipe image tanpa foto bagan (PASS)');

// Kasus 7D: Konfigurasi valid lengkap (tipe table dengan data)
radTable.checked = true;
loadedPrimary.size_guide.type = 'table';
errs = PF.validateForm(false);
const sizeGuideErrors = errs.filter(e => e.includes('Tabel Ukuran') || e.includes('panduan ukuran'));
assert.strictEqual(sizeGuideErrors.length, 0, 'Tidak boleh ada error size guide saat konfigurasi lengkap');
console.log('✔ 7D: Validasi lolos saat konfigurasi lengkap dan valid (PASS)');

console.log('\n=========================================');
console.log('SELURUH PENGUJIAN REVISI TUGAS 4A LULUS! ✓');
console.log('=========================================');
