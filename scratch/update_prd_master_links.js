const fs = require('fs');

let doc = fs.readFileSync('docs/PRD_PRODUCT_MASTER.md', 'utf8');

// 1. Add Callout after line 15
const callout = `> [!NOTE]
> ### DOKUMEN LAMPIRAN TEKNIS ARSITEKTUR LENGKAP (MASTER APPENDICES)
> Untuk pendalaman detail teknis tingkat kode, telah disusun 5 dokumen lampiran spesifik yang saling terhubung:
> 1. **[PRD_PRODUCT_MASTER_DATA_DICTIONARY.md](PRD_PRODUCT_MASTER_DATA_DICTIONARY.md)**: Kamus Data Lengkap 134 properti deklarasi awal, ~40 properti dinamis runtime, 10 objek bersarang, state variasi (\`materialsState\`, \`finishingsState\`), state transien, dan matriks redundansi alias.
> 2. **[PRD_PRODUCT_MASTER_FUNCTION_CATALOG.md](PRD_PRODUCT_MASTER_FUNCTION_CATALOG.md)**: Katalog Lengkap 447 fungsi \`product-form.js\`, 120 metode \`db.js\`, 3 metode inti \`pricing-calculator.js\`, signature parameter, return values, callers/callees, side effects, bukti baris kloning fungsi internal dan lintas modul, serta sequence call graphs.
> 3. **[PRD_PRODUCT_MASTER_UI_DOM_MAP.md](PRD_PRODUCT_MASTER_UI_DOM_MAP.md)**: Peta Arsitektur UI & DOM 832 selector ID, komponen Step 1 & 7 kartu Step 2, drawer mobile, modal sandbox PxL, popover combobox saran, container error, serta analisis kritis siklus hidup penghancuran & rekonstruksi \`#step-pane-2.innerHTML = ''\`.
> 4. **[PRD_PRODUCT_MASTER_INTEGRATION_CONTRACTS.md](PRD_PRODUCT_MASTER_INTEGRATION_CONTRACTS.md)**: Kontrak Integrasi 14 Modul Konsumen Data Produk (Admin Panel, Daftar Produk, Storefront, PDP, Kasir POS, Pricing Engine, Dashboard, Afiliasi, Promo, Gudang/Stok, CRM Pelanggan, Review Moderasi, DB Engine, dan Prisma ORM Multi-Tenant).
> 5. **[PRD_PRODUCT_MASTER_ARCHITECTURE_GAPS.md](PRD_PRODUCT_MASTER_ARCHITECTURE_GAPS.md)**: Analisis Gap Arsitektur AS-IS vs TO-BE, bukti empiris nomor baris duplikasi kode, celah alur inventaris (ketiadaan auto-decrement stok pada order/POS), dan roadmap standardisasi 5 fase.

---
`;

if (!doc.includes('DOKUMEN LAMPIRAN TEKNIS ARSITEKTUR LENGKAP')) {
  doc = doc.replace(
    'Dilarang mengubah kode aplikasi, merefaktor, atau menggabungkan fungsi sebelum rencana konsolidasi disetujui.\n\n---',
    'Dilarang mengubah kode aplikasi, merefaktor, atau menggabungkan fungsi sebelum rencana konsolidasi disetujui.\n\n---\n\n' + callout
  );
}

// 2. Add TOC reference
if (!doc.includes('[DOKUMEN LAMPIRAN TEKNIS ARSITEKTUR LENGKAP]')) {
  doc = doc.replace(
    '## DAFTAR ISI\n',
    '## DAFTAR ISI\n0. [DOKUMEN LAMPIRAN TEKNIS ARSITEKTUR LENGKAP](#dokumen-lampiran-teknis-arsitektur-lengkap-master-appendices)\n'
  );
}

// 3. Section 7 & 11 (UI/UX & DOM Map)
if (!doc.includes('PRD_PRODUCT_MASTER_UI_DOM_MAP.md')) {
  doc = doc.replace(
    '## 7. SPESIFIKASI UI/UX SECARA DETAIL\n',
    `## 7. SPESIFIKASI UI/UX SECARA DETAIL

> [!TIP]
> **Rujukan Lampiran Teknis 3**: Untuk pemetaan mendalam terhadap seluruh 832 selektor elemen DOM Step 1, 7 kartu seksi Step 2, modal sandbox PxL, mobile drawer, popover combobox saran, serta aturan siklus hidup rekonstruksi DOM dinamis, silakan rujuk: [PRD_PRODUCT_MASTER_UI_DOM_MAP.md](PRD_PRODUCT_MASTER_UI_DOM_MAP.md).
\n`
  );
}

// 4. Section 8 (Kamus Data)
if (!doc.includes('PRD_PRODUCT_MASTER_DATA_DICTIONARY.md')) {
  doc = doc.replace(
    '## 8. KAMUS VARIABEL DAN STATE\n',
    `## 8. KAMUS VARIABEL DAN STATE

> [!TIP]
> **Rujukan Lampiran Teknis 1**: Untuk kamus data komprehensif yang mencakup seluruh 134 properti terdeklarasi awal, ~40 properti runtime dinamis, 10 objek bersarang (\`shipping_config\`, \`admin_card_preview_metrics\`, dll), struktur \`materialsState\`, partisi \`finishingsState\`, dan tabel klasifikasi redundansi, silakan rujuk: [PRD_PRODUCT_MASTER_DATA_DICTIONARY.md](PRD_PRODUCT_MASTER_DATA_DICTIONARY.md).
\n`
  );
}

// 5. Section 9 & 10 (Kamus Fungsi & Call Graphs)
if (!doc.includes('PRD_PRODUCT_MASTER_FUNCTION_CATALOG.md')) {
  doc = doc.replace(
    '## 9. KAMUS FUNGSI\n',
    `## 9. KAMUS FUNGSI

> [!TIP]
> **Rujukan Lampiran Teknis 2**: Untuk katalog fungsi lengkap dari 447 fungsi formulir produk (\`js/product-form.js\`), 120 metode \`js/db.js\`, 3 metode universal \`PricingCalculator\`, parameter, kembalian, callers, callees, efek samping, dan diagram alur pemanggilan (call graphs), silakan rujuk: [PRD_PRODUCT_MASTER_FUNCTION_CATALOG.md](PRD_PRODUCT_MASTER_FUNCTION_CATALOG.md).
\n`
  );
}

// 6. Section 15 (Kontrak Integrasi)
if (!doc.includes('PRD_PRODUCT_MASTER_INTEGRATION_CONTRACTS.md')) {
  doc = doc.replace(
    '## 15. KONTRAK INTEGRASI ADMIN PANEL\n',
    `## 15. KONTRAK INTEGRASI ADMIN PANEL

> [!TIP]
> **Rujukan Lampiran Teknis 4**: Untuk dokumen kontrak integrasi formal dari seluruh 14 modul ekosistem (Admin, Daftar Produk, Storefront, PDP, Kasir POS, Pricing Engine, Dashboard, Afiliasi, Promo, Inventaris/Gudang, CRM Pelanggan, Review Moderasi, DB Engine, dan Prisma ORM Multi-Tenant), silakan rujuk: [PRD_PRODUCT_MASTER_INTEGRATION_CONTRACTS.md](PRD_PRODUCT_MASTER_INTEGRATION_CONTRACTS.md).
\n`
  );
}

// 7. Section 23 (Duplikasi & Gaps)
if (!doc.includes('PRD_PRODUCT_MASTER_ARCHITECTURE_GAPS.md')) {
  doc = doc.replace(
    '## 23. AUDIT DUPLIKASI VARIABEL DAN FUNGSI\n',
    `## 23. AUDIT DUPLIKASI VARIABEL DAN FUNGSI

> [!TIP]
> **Rujukan Lampiran Teknis 5**: Untuk analisis perbandingan mendalam AS-IS vs TO-BE, bukti empiris nomor baris kode duplikasi internal dan lintas file, celah alur stok pesanan, dan roadmap 5 fase standardisasi, silakan rujuk: [PRD_PRODUCT_MASTER_ARCHITECTURE_GAPS.md](PRD_PRODUCT_MASTER_ARCHITECTURE_GAPS.md).
\n`
  );
}

// Clean trailing spaces on every line
doc = doc.split('\n').map(line => line.trimEnd()).join('\n');

fs.writeFileSync('docs/PRD_PRODUCT_MASTER.md', doc);
console.log('Successfully updated docs/PRD_PRODUCT_MASTER.md with cross-links to all 5 appendices');

