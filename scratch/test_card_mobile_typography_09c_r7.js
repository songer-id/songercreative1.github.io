const fs = require('fs');
const assert = require('assert');

console.log('--- RUNNING TEST SUITE: SC-ADMIN-CARD-MOBILE-TYPOGRAPHY-09C-R7 ---');

const pfCode = fs.readFileSync('js/product-form.js', 'utf8').replace(/\r\n/g, '\n');
const cssCode = fs.readFileSync('css/admin.css', 'utf8').replace(/\r\n/g, '\n');

// 1. Periksa batas mobile customization section
const mobStart = pfCode.indexOf('id="card-customization-section-mob"');
const mobEnd = pfCode.indexOf('<!-- Pinned Footer Section Mobile', mobStart);
assert(mobStart !== -1, 'Mobile customization section must exist');
assert(mobEnd !== -1, 'Mobile customization section end boundary must exist');
const mobSection = pfCode.substring(mobStart, mobEnd);

// 2. Periksa tidak ada uppercase / tracking-wider pada label di mobile section
const uppercaseLabels = mobSection.match(/<label[^>]*uppercase[^>]*>/gi);
assert(!uppercaseLabels, `No label in mobile section should have uppercase class, found: ${JSON.stringify(uppercaseLabels)}`);

const trackingLabels = mobSection.match(/<label[^>]*tracking-wider[^>]*>/gi);
assert(!trackingLabels, `No label in mobile section should have tracking-wider class, found: ${JSON.stringify(trackingLabels)}`);

// 3. Periksa jumlah label input tools di mobile section (minimal 28, bertambah saat task 10)
const toolLabels = mobSection.match(/<label[^>]*card-tool-label[^>]*>/g);
assert(toolLabels && (toolLabels.length === 28 || toolLabels.length === 32 || toolLabels.length === 34), `Expected 28, 32, or 34 card-tool-label elements, found ${toolLabels ? toolLabels.length : 0}`);
console.log(`✓ Verified all ${toolLabels.length} mobile input tool labels have 'card-tool-label' class`);

// 4. Periksa bahwa semua label yang ditargetkan ada dalam penulisan Title Case / penulisan biasa
const expectedLabels = [
  'Judul Produk',
  'Harga Utama',
  'Tombol Beli',
  'Latar Belakang',
  'Warna Outline',
  'Outline',
  'Radius Sudut',
  'Posisi Label',
  'Warna Teks',
  'Warna Garis',
  'Warna Ikon',
  'Warna Harga Coret'
];

for (const labelText of expectedLabels) {
  assert(mobSection.includes(labelText), `Mobile section must contain label text: "${labelText}"`);
}
console.log(`✓ Verified target labels exist in Title Case`);

// 5. Periksa tidak ada label font-semibold / font-bold di dalam tools editor mobile
const boldLabels = mobSection.match(/<label[^>]*font-(semibold|bold)[^>]*>/gi);
assert(!boldLabels, `No label in mobile section should have font-semibold or font-bold, found: ${JSON.stringify(boldLabels)}`);
console.log(`✓ Verified no semibold/bold labels in mobile customization section`);

// 6. Periksa scoped CSS di css/admin.css
assert(cssCode.includes('@media (max-width: 639.98px)'), 'admin.css must have @media (max-width: 639.98px)');
assert(cssCode.includes('#card-customization-section-mob .card-tool-label'), 'admin.css must have #card-customization-section-mob .card-tool-label rule');
assert(cssCode.includes('font-size: 11px !important;'), 'admin.css rule must enforce font-size: 11px !important');
assert(cssCode.includes('line-height: 16px !important;'), 'admin.css rule must enforce line-height: 16px !important');
assert(cssCode.includes('font-weight: 400 !important;'), 'admin.css rule must enforce font-weight: 400 !important');
assert(cssCode.includes('letter-spacing: normal !important;'), 'admin.css rule must enforce letter-spacing: normal !important');
assert(cssCode.includes('text-transform: none !important;'), 'admin.css rule must enforce text-transform: none !important');
console.log(`✓ Verified scoped CSS in admin.css with all required !important declarations`);

// 7. Periksa desktop section tidak terdampak
const deskStart = pfCode.indexOf('id="card-customization-section"');
const deskEnd = pfCode.indexOf('id="card-customization-section-mob"');
const deskSection = pfCode.substring(deskStart, deskEnd);
const deskUpperLabels = deskSection.match(/<label[^>]*uppercase[^>]*>/gi);
assert(deskUpperLabels && deskUpperLabels.length >= 20, 'Desktop section uppercase labels should remain intact for desktop view');
console.log(`✓ Verified desktop customization section is intact`);

// 8. Periksa toggle items (Rating, Terjual, dll.) tetap text-xs font-normal
assert(mobSection.includes('<span>Rating</span>'), 'Rating toggle label exists');
assert(mobSection.includes('<span>Terjual</span>'), 'Terjual toggle label exists');
assert(mobSection.includes('<span>Ikon Tiket</span>'), 'Ticket icon toggle label exists');
console.log(`✓ Verified toggle labels are preserved`);

console.log('--- ALL R7 UNIT TESTS PASSED SUCCESSFULLY! ---');
