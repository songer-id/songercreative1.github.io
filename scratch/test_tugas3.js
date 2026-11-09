/**
 * Test Suite untuk REVISI TUGAS 3B: Konsistensi Teks, Warna Tabel Ukuran, dan Pengaitan Variasi
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== MEMULAI TEST SUITE REVISI TUGAS 3B ===');

// Setup minimal mock environment DOM & globals
const mockWindow = {
  addEventListener: () => {},
  removeEventListener: () => {},
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  }
};
mockWindow.window = mockWindow;

const mockDocument = {
  getElementById: (id) => null,
  querySelector: (selector) => null,
  querySelectorAll: (selector) => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  documentElement: { style: {} }
};

// Sandbox execution
const pfCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'product-form.js'), 'utf8');
const vm = require('vm');
const context = vm.createContext({
  window: mockWindow,
  document: mockDocument,
  navigator: { userAgent: 'node' },
  localStorage: mockWindow.localStorage,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  requestAnimationFrame: (cb) => cb(),
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
const PF = context.window.ProductForm || context.ProductForm;

assert(PF, 'ProductForm harus terdefinisi');
console.log('✔ ProductForm loaded successfully in sandbox');

// Verifikasi ekspor fungsi
assert(typeof PF.renderProductSizeGuideContentHtml === 'function', 'renderProductSizeGuideContentHtml harus tersedia');
assert(typeof PF.buildProductSizeGuideDrawerHtml === 'function', 'buildProductSizeGuideDrawerHtml harus tersedia');
assert(typeof PF.openProductSizeGuideDrawer === 'function', 'openProductSizeGuideDrawer harus tersedia');
assert(typeof PF.closeProductSizeGuideDrawer === 'function', 'closeProductSizeGuideDrawer harus tersedia');
assert(typeof PF.getActiveVariationTiersForSizeGuide === 'function', 'getActiveVariationTiersForSizeGuide harus tersedia');
assert(typeof PF.getEffectiveLinkedVariation === 'function', 'getEffectiveLinkedVariation harus tersedia');
assert(typeof PF.renderSizeGuideVariationLinkMarkup === 'function', 'renderSizeGuideVariationLinkMarkup harus tersedia');
assert(typeof PF.bindCustomSizeGuideVariationSelect === 'function', 'bindCustomSizeGuideVariationSelect harus tersedia');
assert(typeof PF.validateForm === 'function', 'validateForm harus tersedia');
console.log('✔ Seluruh fungsi ekspor penting terverifikasi');

const primaryState = PF.getPrimaryState();

// -----------------------------------------------------------------------------
// BAGIAN 1: Samakan Tipografi Tabel Ukuran dan Spesifikasi pada Detail Produk Utama
// -----------------------------------------------------------------------------
console.log('\n--- 1. Pengujian Konsistensi Tipografi Tabel Ukuran & Spesifikasi ---');
assert(pfCode.includes('<span class="text-xs font-medium text-slate-700 leading-normal">Tabel Ukuran</span>'), 'Label Tabel Ukuran harus menggunakan text-xs font-medium text-slate-700 leading-normal');
assert(pfCode.includes('<span class="text-xs font-medium text-slate-700 leading-normal">Spesifikasi</span>'), 'Label Spesifikasi harus menggunakan text-xs font-medium text-slate-700 leading-normal');
console.log('✔ Tipografi Tabel Ukuran dan Spesifikasi 100% konsisten (font size, weight, color, leading) (PASS)');

// -----------------------------------------------------------------------------
// BAGIAN 2: Perkecil Nilai Tabel Ukuran dan Terapkan Warna Brand
// -----------------------------------------------------------------------------
console.log('\n--- 2. Pengujian Nilai Tabel Ukuran (10px & Warna Brand Primary) ---');
primaryState.size_guide = {
  enabled: true,
  type: 'table',
  template: 'pakaian',
  columns: ['Ukuran', 'Panjang', 'Lebar Dada', 'Bahu'],
  rows: [
    ['S', '68 cm', '48 cm', '42 cm'],
    ['M', '70 cm', '50 cm', '44 cm']
  ]
};

const tableContentHtml = PF.renderProductSizeGuideContentHtml();
assert(tableContentHtml.includes('text-[10px]'), 'Sel tabel harus menggunakan teks kecil text-[10px]');
assert(tableContentHtml.includes('style="color: var(--color-primary);"'), 'Nilai sel tabel harus menggunakan warna brand var(--color-primary)');
assert(tableContentHtml.includes('text-center'), 'Seluruh kolom dan sel harus rata tengah (text-center)');
assert(tableContentHtml.includes('rounded-none'), 'Tabel dan kontainer harus tanpa rounded (rounded-none)');
assert(tableContentHtml.includes('var(--color-primary-subtle)'), 'Header tabel harus berlatar var(--color-primary-subtle)');
assert(tableContentHtml.includes('divide-y divide-slate-100'), 'Pemisah baris harus divide-slate-100 halus');
assert(tableContentHtml.includes('overflow-x-auto') && tableContentHtml.includes('scrollbar-thin'), 'Harus mendukung scroll horizontal ringkas');
console.log('✔ Nilai tabel ukuran menggunakan text-[10px], warna brand primary, dan rata tengah (PASS)');

// -----------------------------------------------------------------------------
// BAGIAN 3: Perbaiki Akses Tabel Ukuran pada Header Variasi
// -----------------------------------------------------------------------------
console.log('\n--- 3. Pengujian Akses Tabel Ukuran pada Header Variasi ---');
// Verifikasi bahwa header variasi tidak menampilkan Tabel Ukuran saat opsi belum dipilih
assert(pfCode.includes("effectiveLinkedTier === 'tier1' && selectedMat && selectedMat.name"), 'Variasi 1 hanya menampilkan Tabel Ukuran jika opsi variasi telah dipilih');
assert(pfCode.includes("effectiveLinkedTier === 'tier2' && selectedV2 && selectedV2.name"), 'Variasi 2 hanya menampilkan Tabel Ukuran jika opsi variasi telah dipilih');
console.log('✔ Header variasi yang belum dipilih tidak menampilkan akses Tabel Ukuran (PASS)');

// -----------------------------------------------------------------------------
// BAGIAN 4: Dropdown Kustom Bergaya Input/Pilih (Tanpa Native Select)
// -----------------------------------------------------------------------------
console.log('\n--- 4. Pengujian Dropdown Kustom Bergaya Input/Pilih & Validasi ---');

// Case 4A: 0 variasi aktif
primaryState.has_variants = false;
primaryState.has_variations = false;
primaryState.has_variation_2 = false;
primaryState.has_variation_3 = false;
primaryState.has_variation_4 = false;
primaryState.size_guide = { enabled: true, type: 'table', linked_variation: null };

assert.strictEqual(PF.getActiveVariationTiersForSizeGuide().length, 0);
assert.strictEqual(PF.renderSizeGuideVariationLinkMarkup(primaryState.size_guide), '', '0 variasi aktif tidak menampilkan dropdown');
assert.strictEqual(PF.getEffectiveLinkedVariation(), null, '0 variasi aktif menghasilkan effective linked null');
console.log('✔ 4A: 0 variasi aktif -> tidak ada dropdown (PASS)');

// Case 4B: 1 variasi aktif
primaryState.has_variants = true;
primaryState.has_variations = true;
primaryState.has_variation_2 = false;
primaryState.variation_labels = { label_tier_1: 'Ukuran Baju' };

assert.strictEqual(PF.getActiveVariationTiersForSizeGuide().length, 1);
assert.strictEqual(PF.renderSizeGuideVariationLinkMarkup(primaryState.size_guide), '', '1 variasi aktif tidak menampilkan dropdown');
assert.strictEqual(PF.getEffectiveLinkedVariation(), 'tier1', '1 variasi aktif otomatis dikaitkan ke variasi tersebut (tier1)');
console.log('✔ 4B: 1 variasi aktif -> otomatis tier1 tanpa dropdown (PASS)');

// Case 4C: 2-4 variasi aktif -> dropdown kustom input/pilih, tanpa native <select>, tanpa opsi umum
primaryState.has_variation_2 = true;
primaryState.has_variation_3 = true;
primaryState.variation_labels = {
  label_tier_1: 'Warna Kaos',
  label_tier_2: 'Ukuran Kaos',
  label_extra_1: 'Sablon'
};
primaryState.size_guide = { enabled: true, type: 'table', linked_variation: null };

const dropdownMarkup = PF.renderSizeGuideVariationLinkMarkup(primaryState.size_guide);
assert(dropdownMarkup.includes('custom-select-size-guide-linked-variation'), 'Harus menggunakan komponen trigger kustom, bukan select native');
assert(!dropdownMarkup.includes('<select'), 'TIDAK BOLEH menggunakan tag <select> bawaan browser');
assert(dropdownMarkup.includes('Pilih variasi'), 'Harus memiliki placeholder "Pilih variasi"');
assert(!dropdownMarkup.includes('Tidak dikaitkan (Tampilkan Umum)'), 'Opsi "Tidak dikaitkan (Tampilkan Umum)" HARUS dihapus');
assert(dropdownMarkup.includes('Warna Kaos'), 'Menampilkan label dinamis seller variasi 1');
assert(dropdownMarkup.includes('Ukuran Kaos'), 'Menampilkan label dinamis seller variasi 2');
assert(dropdownMarkup.includes('Sablon'), 'Menampilkan label dinamis seller variasi 3');
assert(dropdownMarkup.includes('size-guide-linked-variation-error'), 'Harus menyertakan penampung error validasi');
console.log('✔ 4C: 2-4 variasi aktif -> komponen kustom bergaya Input/Pilih tanpa <select> native (PASS)');

// Case 4D: Validasi form submit wajib pilih variasi saat 2-4 variasi aktif
primaryState.name = 'Kaos Polos Premium Cotton';
primaryState.product_type = 'physical';
primaryState.images = ['test.jpg'];
primaryState.price = 75000;
primaryState.stock = 100;
primaryState.size_guide.enabled = true;
primaryState.size_guide.linked_variation = ''; // Kosong / belum memilih

let validationErrors = PF.validateForm(false);
const sizeGuideErr = validationErrors.find(e => e.includes('Pilih variasi yang dikaitkan dengan Tabel Ukuran.'));
assert(sizeGuideErr, 'validateForm harus menolak simpan jika variasi belum dipilih saat size guide aktif dan 2-4 variasi aktif');
console.log('✔ 4D: Validasi form menolak simpan dengan pesan tepat saat variasi belum dipilih (PASS)');

// Case 4E: Validasi berhasil saat seller memilih variasi
primaryState.size_guide.linked_variation = 'tier2';
validationErrors = PF.validateForm(false);
const sizeGuideErrAfter = validationErrors.find(e => e.includes('Pilih variasi yang dikaitkan dengan Tabel Ukuran.'));
assert(!sizeGuideErrAfter, 'validateForm tidak boleh menghasilkan error size guide setelah variasi dipilih');
assert.strictEqual(PF.getEffectiveLinkedVariation(), 'tier2', 'Effective linked variation harus tier2');
console.log('✔ 4E: Validasi lolos saat variasi dipilih (PASS)');

// Case 4F: Jika size guide dinonaktifkan, validasi tidak memblokir
primaryState.size_guide.enabled = false;
primaryState.size_guide.linked_variation = '';
validationErrors = PF.validateForm(false);
const sizeGuideErrDisabled = validationErrors.find(e => e.includes('Pilih variasi yang dikaitkan dengan Tabel Ukuran.'));
assert(!sizeGuideErrDisabled, 'Jika size guide nonaktif, tidak boleh ada validasi keterkaitan variasi');
console.log('✔ 4F: Size guide nonaktif tidak memicu validasi (PASS)');

console.log('\n=== SELURUH TEST SUITE REVISI TUGAS 3B BERHASIL LULUS (ALL PASS) ===');
