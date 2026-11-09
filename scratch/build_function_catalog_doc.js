const fs = require('fs');

const content = `# KATALOG FUNGSI LENGKAP ARSITEKTUR PRODUK & EKOSISTEM
## Lampiran Teknis 2: PRD_PRODUCT_MASTER_FUNCTION_CATALOG
**Songer Creative POS & E-Commerce Platform**  
*Single Source of Truth (SSOT) — Inventarisasi, Tanda Tangan, Efek Samping, dan Relasi Pemanggilan Fungsi*

---

## 1. IKHTISAR & STANDAR METODOLOGI INVENTARISASI

Dokumen ini mendokumentasikan katalog lengkap fungsi (functions/methods) yang beroperasi di dalam modul formulir produk (\`js/product-form.js\`), mesin basis data (\`js/db.js\`), mesin kalkulator harga (\`js/pricing-calculator.js\`), pustaka utilitas (\`js/utils.js\`), dan modul hilir terkait (\`js/admin-app.js\`, \`js/buyer-store.js\`, \`js/pdp.js\`, \`js/category-manager.js\`, \`js/promo-manager.js\`).

### Metrik Inventarisasi Fungsi
- **Total Fungsi Terdaftar di \`js/product-form.js\`**: 447 fungsi.
- **Total Metode Terdaftar di \`js/db.js\`**: 120 fungsi/metode.
- **Metode Inti \`js/pricing-calculator.js\`**: 3 metode inti universal (UMD).
- **Fungsi Pembantu \`js/utils.js\`**: 11 fungsi utilitas global.
- **Fungsi Terkait Produk di Modul Konsumen**: 90 di \`admin-app.js\`, 126 di \`buyer-store.js\`, 25 di \`pdp.js\`.

Setiap fungsi dianalisis berdasarkan:
1. **Nama & Lokasi**: Nama identifier dan posisi baris awal pada kode sumber.
2. **Signature & Parameter**: Daftar parameter input beserta tipe data yang diharapkan.
3. **Return Value**: Tipe data dan semantik nilai kembalian.
4. **Callers & Callees**: Siapa yang memicu pemanggilan dan fungsi apa yang dipanggil di dalamnya.
5. **Side Effects**: Mutasi terhadap state memori (\`primaryState\`, \`materialsState\`, dll), manipulasi DOM, atau pengiriman event.
6. **Otoritas (Authority Status)**: *Single Source of Truth (SSOT) Writer*, *Read-Only Inspector*, atau *Proxy/Wrapper*.

---

## 2. SUBSISTEM A: INISIALISASI, SIKLUS HIDUP & NAVIGASI STEP WIZARD

Subsistem ini mengendalikan siklus hidup pembukaan form, transisi antar langkah (Step 1 $\\leftrightarrow$ Step 2), pemuatan data edit, reset form, serta konfirmasi pembatalan.

| Nama Fungsi | File & Baris | Parameter | Return | Callers / Callees | Efek Samping & Mutasi State | Otoritas |
|---|---|---|---|---|---|---|
| \`initCreate\` | \`js/product-form.js\` L31345 | None | \`void\` | Dipanggil oleh menu routing Admin saat "Tambah Produk" diklik. Memanggil: \`resetFormState()\`, \`loadDraftFromStorage()\`, \`renderForm()\`. | Mengatur \`formMode = 'create'\`, \`currentEditingId = null\`, memuat draf dari \`localStorage\`, merender ulang DOM Step 1. | SSOT Entry Point Create |
| \`initEdit\` | \`js/product-form.js\` L31353 | \`idOrProduct\` (String/Object) | \`Promise<boolean>\` | Dipanggil oleh daftar produk Admin saat tombol "Edit" diklik. Memanggil: \`loadProductForEdit(idOrProduct)\`. | Wrapper proxy dari \`loadProductForEdit\`. | Proxy Wrapper |
| \`loadProductForEdit\` | \`js/product-form.js\` L1924 | \`idOrProduct\` (String/Object) | \`Promise<boolean>\` | Dipanggil oleh \`initEdit\`. Memanggil: \`DB.getProductById()\`, \`resetFormState()\`, \`renderForm()\`, \`updateProductCardLivePreview()\`. | Mengatur \`formMode = 'edit'\`, \`currentEditingId\`, mengisi \`primaryState\` dengan data produk tersimpan, mengambil snapshot \`initialEditSnapshot\`, mengunci tab preview. | SSOT Loader Edit |
| \`goToStep\` | \`js/product-form.js\` L21736 | \`step\` (Number: 1 atau 2) | \`void\` | Dipanggil oleh tombol navigasi wizard ("Lanjut ke Detail", tombol tab subnav wizard). Memanggil: \`isStep1Complete()\`, \`syncStateFromDOM()\`, \`renderStep2Content()\`, \`updateStepVisibility()\`. | Memeriksa validasi Step 1 sebelum izinkan ke Step 2. Jika valid: menyinkronkan nilai DOM Step 1 ke \`primaryState\`, menghapus konten DOM step lama, merender DOM Step 2 dari scratch. | SSOT Navigator |
| \`updateStepVisibility\` | \`js/product-form.js\` L21640 | \`step\` (Number) | \`void\` | Dipanggil oleh \`goToStep()\`. Memanipulasi kelas CSS \`hidden\` pada \`#step-pane-1\` dan \`#step-pane-2\`. | Memperbarui kelas active/completed pada tab stepper subnavbar (\`#step-indicator-1\`, \`#step-indicator-2\`), mengatur scroll window ke \`(0, 0)\`. | UI State Synchronizer |
| \`resetFormState\` | \`js/product-form.js\` L1497 | None | \`void\` | Dipanggil oleh \`initCreate()\`, \`init()\`, \`resetDraft()\`. | Mereset seluruh 134 properti \`primaryState\` ke nilai default awal pabrik, mengosongkan \`materialsState\` (kembali ke 1 opsi default), mengosongkan \`finishingsState\`, mereset \`dirtyFlags\`. | SSOT State Cleaner |
| \`handleFormCancel\` | \`js/product-form.js\` L1889 | None | \`void\` | Dipanggil saat tombol "Batal" / breadcrumb kembali diklik. | Memeriksa \`hasEditProductChanged()\` atau \`hasAnyNewProductData()\`. Jika ada perubahan: memunculkan modal konfirmasi (\`#modal-confirm-cancel\`). Jika tidak: kembali ke tabel daftar produk. | Safety Guard |
| \`hasEditProductChanged\` | \`js/product-form.js\` L1774 | None | \`Boolean\` | Dipanggil oleh \`handleFormCancel()\`. | Melakukan perbandingan deep JSON hash antara state aktif saat ini dengan \`initialEditSnapshot\`. Mengembalikan \`true\` jika terdapat perubahan sekecil apa pun. | Inspector (Pure) |
| \`hasAnyNewProductData\` | \`js/product-form.js\` L1858 | None | \`Boolean\` | Dipanggil oleh \`handleFormCancel()\` pada mode create. | Memeriksa apakah nama produk, harga, foto, atau varian telah diisi oleh penjual dibanding default kosong. | Inspector (Pure) |
| \`updateStepPaneHeader\` | \`js/product-form.js\` L21670 | None | \`void\` | Dipanggil oleh \`updateStepVisibility()\`. | Memperbarui teks judul header subnav wizard ("Tambah Produk Baru" vs "Edit Produk: [Nama]") dan status badge kustomisasi. | DOM Synchronizer |

---

## 3. SUBSISTEM B: RENDERING & KONSTRUKSI DOM STEP 1 & STEP 2

Subsistem ini bertanggung jawab menghasilkan string HTML dinamis dan menyuntikkannya ke dalam dokumen, serta mengatur pemusnahan (*teardown*) dan rekonstruksi elemen saat perpindahan langkah.

| Nama Fungsi | File & Baris | Parameter | Return | Callers / Callees | Efek Samping & Mutasi DOM |
|---|---|---|---|---|---|
| \`renderForm\` | \`js/product-form.js\` L2422 | None | \`void\` | Dipanggil oleh \`initCreate()\`, \`resetDraft()\`, \`loadProductForEdit()\`. Memanggil: \`renderStep1Content()\`, \`renderStep2Content()\`, \`bindFormEvents()\`. | Mengisi \`#step-pane-1\` dengan form builder Step 1, mengatur container preview Step 1, memicu bind event listener utama. |
| \`renderStep2Content\` | \`js/product-form.js\` L14594 | None | \`void\` | Dipanggil oleh \`goToStep(2)\`. Memanggil: \`renderMaterialsRows()\`, \`renderFinishingRows()\`, \`renderWholesaleTable()\`, \`renderCustomDimensionCard()\`, \`renderSizeGuideSectionHtml()\`, \`renderCustomSpecsTableHtml()\`. | Membangun seluruh 7 kartu seksi Step 2: Info Produk, Penjualan & Variasi, Pengiriman, Promo & Afiliasi, Deskripsi, Spesifikasi Teknis, dan Pengaturan Lainnya. |
| \`renderWholesaleTable\` | \`js/product-form.js\` L20114 | \`variantId\` (String \\| null) | \`void\` | Dipanggil oleh toggle mode grosir (\`#toggle-wholesale\`) dan saat menambah/menghapus baris grosir. | Menyuntikkan baris tabel rentang kuantitas grosir (\`#wholesale-rows-container\`), menghitung label diskon dinamis, memvalidasi tier minimal pesanan. |
| \`renderOrderMultipleSection\` | \`js/product-form.js\` L20255 | None | \`void\` | Dipanggil saat jenis harga \`price_type == 7\` (Kombinasi Step) dipilih. | Merender input kelipatan kuantitas batch (\`step_quantity\`) dan tabel bantuan kalkulasi batch pesanan. |
| \`renderCustomDimensionCard\` | \`js/product-form.js\` L18505 | None | \`void\` | Dipanggil saat \`price_type == 2\` (Meteran / Luas PxL) atau toggle PxL dicentang. | Merender opsi batas dimensi minimum/maksimum ($P \\times L$), modal sandbox kalkulator simulasi hitung, dan opsi satuan (cm/m). |
| \`renderCustomSpecsTableHtml\` | \`js/product-form.js\` L13382 | None | \`String\` (HTML) | Dipanggil di dalam \`renderStep2Content()\`. | Menghasilkan baris tabel spesifikasi kustom (\`custom_specs\`) gabungan (spesifikasi bawaan sistem + spesifikasi dinamis buatan penjual, maks 10 baris). |
| \`renderSizeGuideSectionHtml\` | \`js/product-form.js\` L14481 | None | \`String\` (HTML) | Dipanggil di dalam \`renderStep2Content()\`. | Merender panel konfigurasi panduan ukuran (tipe tabel vs tipe gambar ilustrasi), tombol pemilih template (pakaian/sepatu), dan tabel editor matriks dimensi. |
| \`renderMaterialsRows\` | \`js/product-form.js\` L20678 | None | \`void\` | Dipanggil saat opsi bahan Variasi 1 ditambah, dihapus, atau diubah namanya. | Menyuntikkan seluruh baris input Variasi 1 ke container \`#materials-container\`. Memperbarui indeks nomor baris dan tombol hapus. |
| \`renderFinishingRows\` | \`js/product-form.js\` L20799 | \`tier\` (String: \`'main'\`, \`'extra_1'\`, dll) | \`void\` | Dipanggil saat opsi variasi level 2–4 ditambah atau dihapus. | Menyuntikkan baris opsi finishing ke container partisi masing-masing, mengikat selektor variasi spesifik jika \`scope == 'spesifik'\`. |

---

## 4. SUBSISTEM C: KALKULASI HARGA, DIMENSI PXL & FORMULA MATEMATIKA

Subsistem ini mengelola rumus penetapan harga pada formulir admin, simulator modal PxL, serta konsistensinya terhadap modul universal \`PricingCalculator\`.

| Nama Fungsi | File & Baris | Parameter | Return | Deskripsi Algoritma & Perilaku | Otoritas |
|---|---|---|---|---|---|
| \`PricingCalculator.calculateProductPrice\` | \`js/pricing-calculator.js\` L146 | \`params\` (Object: \`{ product, selectedVariations, customDimensions, qty, extras }\`) | \`Object\` (\`{ unitPrice, billedArea, grossTotal, discountAmount, finalTotal, hppTotal, margin }\`) | Mengimplementasikan 6 rumus inti Songer Creative: Penjumlahan Varian 1-4, Satuan Meter ($m^2$ dibulatkan ke atas minimal 1.0 $m^2$), Bobot Riil (Kg/Lt), Kombinasi Step (kelipatan kuantitas), Paket Hemat, dan Biaya Layanan Ekstra Mandiri. Mendukung diskon grosir bertingkat (*tiered*) vs normal. | SSOT Formula Universal |
| \`calculateBilledArea\` | \`js/pricing-calculator.js\` L118 | \`lengthCm\`, \`widthCm\`, \`minBilledArea\` | \`Number\` ($m^2$) | Menghitung luas riil $(P \\times L) / 10.000$ dan menerapkan batas lantai minimal (default $1.0 m^2$). Mendukung aturan pembulatan desimal khusus printing. | SSOT Area Billed |
| \`updateSandboxCalculation\` | \`js/product-form.js\` L16876 *(Duplikat di L23185)* | None | \`void\` | Mengambil nilai panjang, lebar, pilihan bahan, dan finishing pada modal simulasi PxL. Menghitung estimasi harga jual dan estimasi modal HPP, lalu memperbarui elemen display modal (\`#sandbox-calc-price\`, \`#sandbox-calc-cost\`, \`#sandbox-calc-margin\`). | Admin Sandbox Helper |
| \`validateSinglePrice\` | \`js/product-form.js\` L21427 | \`price\`, \`costPrice\` | \`Object\` (\`{ valid: boolean, error: string }\`) | Memvalidasi bahwa harga jual $\\ge 0$ dan memberikan peringatan apabila harga jual lebih rendah daripada HPP modal (margin negatif). | Validator Keuangan |
| \`computeWarrantyPeriod\` | \`js/product-form.js\` L13650 | \`value\` (Number), \`unit\` (String) | \`String\` | Menggabungkan angka dan satuan garansi (cth: "7 Hari", "1 Bulan", "1 Tahun", "Seumur Hidup") untuk ditampilkan pada spesifikasi kartu. | Formatter Helper |

---

## 5. SUBSISTEM D: MATRIKS VARIASI 1–4 & LAYANAN EKSTRA

Subsistem ini mengelola struktur variasi hierarkis, validasi keunikan nama opsi, cakupan opsi (*variation scopes*), serta penyesuaian HPP dan harga dinamis.

| Nama Fungsi | File & Baris | Parameter | Return | Deskripsi Teknis & Validasi |
|---|---|---|---|---|
| \`checkOptionNameDuplicate\` | \`js/product-form.js\` L20360 | \`tier\` (String), \`name\` (String), \`excludeId\` | \`Boolean\` | Memeriksa apakah nama opsi varian sudah pernah digunakan pada tingkatan tier yang sama (case-insensitive, trimmed). Mencegah opsi kembar seperti "Merah" dan "merah". |
| \`refreshOptionDuplicateErrors\` | \`js/product-form.js\` L20393 | None | \`void\` | Memindai seluruh baris opsi di Variasi 1 s/d 4. Menandai border merah dan memunculkan label pesan error inline jika ditemukan nama ganda di dalam tingkatan yang sama. |
| \`validateVariationGroupLabels\` | \`js/product-form.js\` L20672 | None | \`Object\` (\`{ valid, errors }\`) | Memvalidasi nama label kelompok variasi (\`variation_labels\`). Memastikan label tier yang aktif tidak dibiarkan kosong atau whitespace semata. |
| \`handleVariationLabelInput\` | \`js/product-form.js\` L20720 | \`e\` (Event), \`tierKey\` (String) | \`void\` | Menangkap pengetikan nama label variasi, menyinkronkan ke \`primaryState.variation_labels[tierKey]\`, dan secara reaktif memperbarui placeholder serta header tabel varian terkait. |
| \`syncVariationToggles\` | \`js/product-form.js\` L22180 | None | \`void\` | Menyesuaikan visibilitas container kartu Variasi 2, 3, 4, dan Layanan Ekstra berdasarkan status checkbox toggle aktif masing-masing (\`has_variation_2..4\`, \`has_extra_service\`). |
| \`resolveVariationScope\` | \`js/product-form.js\` L22350 | \`parentMaterialId\`, \`tier\` | \`Array\` | Mengembalikan daftar opsi finishing yang valid untuk bahan dasar tertentu jika mode cakupan diset ke \`'spesifik'\`. |

---

## 6. SUBSISTEM E: LOGISTIK, PENGEMASAN & PENGIRIMAN

Subsistem ini mengonfigurasi dimensi kemasan pengiriman, perhitungan berat volumetrik ekspedisi, serta aturan pengiriman kurir lokal armada toko.

| Nama Fungsi | File & Baris | Parameter | Return | Deskripsi Fungsional |
|---|---|---|---|---|
| \`getStoreDefaultLocalShipping\` | \`js/product-form.js\` L178 | None | \`Object\` | Mengambil konfigurasi default pengiriman lokal toko dari basis data profil toko (\`DB.getStoreSettings()\`) untuk diisi otomatis pada produk baru. |
| \`calculateVolumetricWeight\` | \`js/product-form.js\` L13010 | \`l\`, \`w\`, \`h\` (cm) | \`Number\` (gram) | Menghitung rumus berat volumetrik standar ekspedisi Indonesia: $(L \\times W \\times H) \\div 6.000 \\times 1.000$ gram. |
| \`validateShippingConfig\` | \`js/product-form.js\` L30650 | \`shippingConfig\` | \`Object\` (\`{ valid, errors }\`) | Memastikan berat produk diisi $> 0$, minimal satu jenis kurir diaktifkan, dan jika COD ekspedisi aktif maka kurir reguler wajib dipilih. |
| \`syncShippingStateFromDOM\` | \`js/product-form.js\` L29960 | None | \`void\` | Membaca seluruh checkbox kurir (\`#check-courier-pickup\`, \`#check-courier-local\`, dll), radio COD, dan input dimensi kemasan paket, lalu menuliskan ke \`primaryState.shipping_config\`. |

---

## 7. SUBSISTEM F: PROMO, DISKON & AFILIASI

Subsistem ini menangani komisi afiliasi berjenjang (tiers), partisipasi diskon harian/bulanan, dan badge promo diskon pada kartu produk.

| Nama Fungsi | File & Baris | Parameter | Return | Deskripsi Fungsional |
|---|---|---|---|---|
| \`bindAffiliateCommissionEvents\` | \`js/product-form.js\` L13225 | None | \`void\` | Mengikat event listener penambahan/penghapusan tier komisi afiliasi, perpindahan mode (% vs Rp), dan validasi tangga kuantitas tier berikutnya ($min_{n} = max_{n-1} + 1$). |
| \`renderAffiliateTiers\` | \`js/product-form.js\` L13290 | None | \`void\` | Merender daftar baris tier komisi afiliasi ke container DOM \`#affiliate-tiers-container\`. |
| \`validateAffiliateTiers\` | \`js/product-form.js\` L30720 | None | \`Boolean\` | Memastikan nilai komisi afiliasi tidak melebihi batas wajar (maks 100% atau tidak melebihi margin laba produk). |
| \`calculateEffectiveDiscount\` | \`js/promo-manager.js\` L140 | \`product\`, \`basePrice\` | \`Object\` | Menghitung potongan harga bersih berdasarkan event promo yang sedang aktif di toko (Promo Bulanan, Flash Sale, Voucher). |

---

## 8. SUBSISTEM G: DESAIN KARTU, SUBNAV & LIVE PREVIEW MOCKUP

Subsistem ini mengelola pratinjau langsung kartu produk (Model A, B, C) pada Admin Step 1, panel kustomisasi desain kartu, accordion tools, swatch warna, dan combobox saran input.

| Nama Fungsi | File & Baris | Parameter | Return | Deskripsi Fungsional & Efek Samping |
|---|---|---|---|---|
| \`updateProductCardLivePreview\` | \`js/product-form.js\` L9737 | None | \`void\` | Fungsi orkestrasi utama rendering pratinjau kartu Admin. Membaca data form aktif, menyuntikkan template kartu terpilih (Model A, B, atau C), menerapkan CSS variables warna/border/radius, memperbarui badge pintar, rating, terjual, dan strip footer. |
| \`setCardCustomizationView\` | \`js/product-form.js\` L5133 | \`view\` (String: \`'preview'\` \\| \`'tools'\`) | \`void\` | Beralih antara tab "Pratinjau Kartu" dan tab "Kustomisasi Desain". Jika beralih ke 'tools', mengambil snapshot \`captureCardDesignSnapshot()\`. |
| \`captureCardDesignSnapshot\` | \`js/product-form.js\` L126 | None | \`Object\` | Menggandakan seluruh nilai variabel desain kartu aktif ke objek cadangan in-memory (\`cardDesignSnapshot\`). |
| \`handleCancelCardDesign\` | \`js/product-form.js\` L5252 | None | \`void\` | Memulihkan konfigurasi desain kartu dari \`cardDesignSnapshot\`, memperbarui DOM input tools, dan memicu \`updateProductCardLivePreview()\`. |
| \`toggleCardAccordion\` | \`js/product-form.js\` L4174 | \`sectionKey\` (String) | \`void\` | Membuka atau menutup seksi panel accordion tools desain (\`frame\`, \`text-info\`, \`badge\`, \`promo\`, \`footer\`), menyinkronkan icon panah dan rotasi. |
| \`syncCardAccordionDOM\` | \`js/product-form.js\` L4195 | None | \`void\` | Menyinkronkan status buka/tutup fisik elemen DOM accordion berdasarkan state memori \`cardAccordionState\`. |
| \`renderCardFooterSection\` | \`js/product-form.js\` L10350 | \`model\`, \`data\` | \`String\` (HTML) | Menghasilkan markup HTML strip footer kartu produk Model C. Memeriksa keberadaan teks dan ikon footer 1 & 2. Jika footer 2 kosong, strip tidak dirender (tanpa divider yatim). |
| \`initMetricCombobox\` | \`js/product-form.js\` L9210 | \`fieldKey\` (\`'rating'\` \\| \`'sales'\`) | \`void\` | Menginisialisasi komponen combobox input/pilih untuk Rating & Terjual pratinjau Admin dengan popover saran terkurasi (5.0, 4.9, 4.8 / 50, 100, 500, 1RB+, 10RB+). |

---

## 9. SUBSISTEM H: VALIDASI DATA, INTEGRITAS & GATING WIZARD

Subsistem ini bertanggung jawab menegakkan aturan bisnis data sebelum produk diizinkan beralih langkah atau disimpan secara permanen ke basis data.

| Nama Fungsi | File & Baris | Parameter | Return | Deskripsi Validasi & Aturan Gating |
|---|---|---|---|---|
| \`isStep1Complete\` | \`js/product-form.js\` L1448 *(Duplikat di L27865)* | None | \`Boolean\` | Memeriksa kelengkapan syarat minimal Step 1: Kategori terpilih (\`category_id != ''\`), Nama Produk valid (minimal 3 karakter non-whitespace), dan minimal 1 foto galeri utama terunggah. Jika tidak lengkap, transisi ke Step 2 diblokir. |
| \`validateForm\` | \`js/product-form.js\` L30504 | None | \`Object\` (\`{ valid: boolean, errors: Array }\`) | Evaluasi menyeluruh terhadap seluruh aturan validasi Step 1 dan Step 2: keunikan nama varian, harga jual $> 0$, berat paket $> 0$, label footer 1 Model C wajib diisi maks 32 karakter, spesifikasi kustom valid. |
| \`handleProductNameValidation\` | \`js/product-form.js\` L21710 | \`e\` (Event \\| null) | \`Boolean\` | Memeriksa input nama produk saat mengetik (*blur/input*). Memperbarui counter karakter (\`0/120\`) dan menampilkan pesan error merah jika kosong atau $< 3$ karakter. |
| \`showWizardErrorBanner\` | \`js/product-form.js\` L30890 | \`errors\` (Array) | \`void\` | Menampilkan banner peringatan mengambang di bagian atas form yang mencantumkan daftar kesalahan input yang perlu diperbaiki penjual sebelum submit. |
| \`hideWizardErrorBanner\` | \`js/product-form.js\` L30920 | None | \`void\` | Menyembunyikan banner peringatan kesalahan saat seluruh error telah diselesaikan. |
| \`addError\` | \`js/product-form.js\` L21197 *(Duplikat di L30510)* | \`fieldKey\`, \`message\` | \`void\` | Mendaftarkan pesan kesalahan spesifik pada dictionary \`validationErrors\` dan menambahkan highlight kelas CSS error pada elemen input bersangkutan. |

---

## 10. SUBSISTEM I: PERSISTENSI, DATABASE ENGINE & DRAFT MANAGEMENT

Subsistem ini mengelola penyimpanan lokal draf pengetikan di browser serta operasi CRUD permanen ke tabel IndexedDB/LocalStorage melalui pustaka mesin basis data \`DB\`.

| Nama Fungsi | File & Baris | Parameter | Return | Efek Samping & Persistensi |
|---|---|---|---|---|
| \`handleFormSubmit\` | \`js/product-form.js\` L31106 | \`e\` (Event) | \`Promise<boolean>\` | Mencegah form reload (\`preventDefault\`), memanggil \`syncStateFromDOM()\`, memanggil \`validateForm()\`. Jika valid: merakit payload lengkap produk, memanggil \`DB.createProduct()\` (mode create) atau \`DB.updateProduct()\` (mode edit), menghapus draf lokal, dan mengarahkan pengguna kembali ke tabel produk. |
| \`saveDraftToStorage\` | \`js/product-form.js\` L2295 | None | \`void\` | Mendistribusikan salinan \`primaryState\`, \`materialsState\`, dan \`finishingsState\` ke kunci \`songer_add_product_draft\` di \`localStorage\`. Dilakukan otomatis secara berkala (*debounced*). |
| \`loadDraftFromStorage\` | \`js/product-form.js\` L2311 | None | \`Boolean\` | Membaca data draf dari \`localStorage\` pada saat pembukaan form mode create. Jika ditemukan draf tersimpan, menyalinnya ke state dan mengembalikan \`true\`. |
| \`clearDraftStorage\` | \`js/product-form.js\` L2335 | None | \`void\` | Menghapus kunci \`songer_add_product_draft\` dari \`localStorage\` saat produk berhasil disimpan atau pengguna memilih opsi "Hapus Draf". |
| \`DB.createProduct\` | \`js/db.js\` L610 | \`productData\` (Object) | \`Promise<Object>\` | Menyimpan record produk baru ke tabel \`products\`, menyisipkan baris terkait ke tabel \`materials\` dan \`finishings\`, mencatat audit log pembuatan produk. |
| \`DB.updateProduct\` | \`js/db.js\` L665 | \`productId\`, \`productData\` | \`Promise<Object>\` | Memperbarui kolom data pada tabel \`products\`, memperbarui/menyisipkan ulang relasi bahan dan finishing yang terhubung, memperbarui timestamp \`updated_at\`. |
| \`DB.deleteProduct\` | \`js/db.js\` L720 | \`productId\` | \`Promise<boolean>\` | Menghapus record produk secara permanen atau *soft delete* (\`is_deleted = true\`), membersihkan relasi variasi anak. |
| \`DB.getProducts\` | \`js/db.js\` L520 | \`filters\` (Object) | \`Promise<Array>\` | Mengambil seluruh daftar produk aktif toko, mengurutkan berdasarkan tanggal terbaru atau urutan abjad. |
| \`DB.getProductById\` | \`js/db.js\` L560 | \`productId\` | \`Promise<Object \\| null>\` | Mengambil satu record produk lengkap beserta array bahan \`materials\` dan array finishing \`finishings\` yang sudah digabungkan. |

---

## 11. SUBSISTEM J: FUNGSI UTILITAS & PENDUKUNG LINTAS MODUL

Subsistem ini menyediakan operasi utilitas umum seperti pemformatan angka mata uang rupiah, kompresi gambar kanvas, sanitasi HTML, dan penyajian notifikasi pop-up toast.

| Nama Fungsi | File & Baris | Parameter | Return | Deskripsi Operasi |
|---|---|---|---|---|
| \`formatIDR\` | \`js/utils.js\` L23 *(Duplikat di 3 file lain)* | \`num\` (Number \\| String) | \`String\` | Mengonversi angka ke format standar mata uang Rupiah: \`"Rp 150.000"\` (pemisah ribuan titik, tanpa desimal). |
| \`formatSalesCount\` | \`js/product-form.js\` L1440 *(Duplikat di buyer-store)* | \`count\` (Number \\| String) | \`String\` | Mengonversi angka penjualan besar ke notasi ringkas Indonesia (cth: \`950\` $\\rightarrow$ \`"950"\`, \`1250\` $\\rightarrow$ \`"1,2RB+"\`, \`10000\` $\\rightarrow$ \`"10RB+"\`). |
| \`escapeHtml\` | \`js/utils.js\` L5 *(Duplikat di 3 file lain)* | \`str\` (String) | \`String\` | Mengamankan string teks dari serangan XSS dengan mereplace karakter \`&\`, \`<\`, \`>\`, \`"\`, dan \`'\` menjadi entity HTML yang aman. |
| \`compressProductImage\` | \`js/product-form.js\` L2800 | \`file\` (File), \`maxWidth\`, \`quality\` | \`Promise<string>\` | Melakukan resize proporsional gambar di canvas browser dan mengonversinya ke DataURL JPEG/WEBP terkompresi sebelum disimpan ke galeri produk. |
| \`refreshGalleryDOM\` | \`js/product-form.js\` L3050 | None | \`void\` | Merender ulang thumbnail foto pada galeri media Step 1 (\`#gallery-thumbnails-container\`), memperbarui lencana foto sampul (*Cover*), dan tombol aksi hapus/pindah urutan. |
| \`showToast\` | \`js/utils.js\` L80 | \`message\`, \`type\`, \`duration\` | \`void\` | Memunculkan elemen notifikasi toast mengambang di pojok layar (\`#toast-container\`) dengan animasi masuk dan keluar otomatis. |

---

## 12. MATRIKS DUPLIKASI KODE INTERNAL & LINTAS FILE

Berdasarkan audit statis kode sumber aktual, ditemukan bukti tak terbantahkan sejumlah fungsi identik yang dideklarasikan ulang berkali-kali.

### 12.1. Duplikasi Internal di dalam \`js/product-form.js\`

| Nama Fungsi | Deklarasi 1 | Deklarasi 2 | Analisis Penyebab & Bahaya Teknis |
|---|---|---|---|
| \`isStep1Complete\` | Baris 1448 | Baris 27865 | **Kloning Blok Logika**: Kedua fungsi memiliki implementasi validasi Step 1 yang identik. Deklarasi di baris 27865 menimpa (*shadows*) fungsi baris 1448 di scope yang sama, menyebabkan kebingungan penelusuran bug jika salah satu diperbarui tanpa yang lain. |
| \`getTodayDateString\` | Baris 1419 | Baris 27836 | **Helper Tanggal Kloning**: Mengembalikan string tanggal format \`YYYY-MM-DD\`. |
| \`formatDateDisplay\` | Baris 1427 | Baris 27844 | **Helper Tanggal Kloning**: Mengonversi format tanggal internal ke tampilan visual Indonesia. |
| \`addDaysToDate\` | Baris 1436 | Baris 27853 | **Helper Tanggal Kloning**: Menambahkan $N$ hari ke tanggal kalender tertentu. |
| \`getSuggestedCardVariantForCategory\` | Baris 1473 | Baris 27890 | **Kloning Rekomendasi Kartu**: Logika mapping kategori ke varian kartu rekomendasi (Model A/B/C) dideklarasikan dua kali secara penuh. |
| \`updateSandboxCalculation\` | Baris 16876 | Baris 23185 | **Kloning Kalkulator Sandbox**: Logika estimasi luas dan harga modal/jual modal PxL dibuat di dua tempat terpisah dengan perbedaan minor pada pembulatan margin laba. |
| \`addError\` | Baris 21197 | Baris 30510 | **Kloning Perekam Error**: Logika pencatatan pesan kesalahan validasi input. |
| \`init\` vs \`initCreate\` | Baris 31337 | Baris 31345 | **Metode Kembar**: Isi fungsi \`init()\` dan \`initCreate()\` sama persis (7 baris identik) tanpa alasan fungsional yang berbeda. |

### 12.2. Duplikasi Lintas File di Ekosistem Modul

| Nama Fungsi | Lokasi Deklarasi Aktual | Dampak Arsitektur & Tindakan Standardisasi |
|---|---|---|
| \`formatIDR\` | 1. \`js/utils.js\` L23<br>2. \`js/product-form.js\` L1403<br>3. \`js/buyer-store.js\` L120<br>4. \`js/admin-app.js\` L45 | **Redundansi Format Mata Uang**: Didefinisikan ulang di 4 file berbeda. Harus distandarisasi tunggal ke \`Utils.formatIDR\` dengan fallback aman. |
| \`escapeHtml\` | 1. \`js/utils.js\` L5<br>2. \`js/product-form.js\` L1411<br>3. \`js/buyer-store.js\` L105<br>4. \`js/pdp.js\` L15 | **Redundansi Sanitasi XSS**: 4 implementasi independen dengan karakter regex escaping yang sedikit berbeda. Harus disatukan ke \`Utils.escapeHtml\`. |
| \`formatSalesCount\` | 1. \`js/product-form.js\` L1440<br>2. \`js/buyer-store.js\` L140 | **Redundansi Format Penjualan**: Pembeli dan admin memiliki parser notasi \`RB+\` terpisah. Harus dipindahkan ke \`Utils.formatSalesCount\`. |
| \`getSmartVisibleBadges\` | 1. \`js/product-form.js\` L1460<br>2. \`js/buyer-store.js\` L180 | **Redundansi Logika Badge**: Urutan prioritas badge promo/baru/unggulan dihitung dua kali di form preview dan storefront. Harus disatukan ke modul helper kartu bersama. |

---

## 13. DIAGRAM ALUR PEMANGGILAN (CALL GRAPHS)

### 13.1. Alur Pemuatan & Penyimpanan Produk Baru (Create Flow)

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Admin as Penjual (Admin)
    participant PF as ProductForm (js/product-form.js)
    participant DOM as Browser DOM (#step-pane-*)
    participant DB as Database Engine (js/db.js)

    Admin->>PF: Buka Form Tambah Produk
    PF->>PF: initCreate()
    PF->>PF: resetFormState() -> primaryState default
    PF->>PF: loadDraftFromStorage() (jika ada)
    PF->>DOM: renderForm() -> Step 1 dirender
    Admin->>DOM: Input Kategori, Nama, Foto & Desain Kartu
    DOM->>PF: Event Input -> updateProductCardLivePreview()
    PF->>DOM: Render Live Preview Kartu
    Admin->>DOM: Klik "Lanjut ke Detail Produk"
    DOM->>PF: goToStep(2)
    PF->>PF: isStep1Complete()
    alt Step 1 Tidak Lengkap
        PF->>DOM: Tampilkan Error Banner & Highlight Input
    else Step 1 Lengkap
        PF->>PF: syncStateFromDOM()
        PF->>DOM: Kosongkan #step-pane-2
        PF->>DOM: renderStep2Content() -> Step 2 Dirender
    end
    Admin->>DOM: Isi Harga, Stok, Variasi, Pengiriman
    Admin->>DOM: Klik "Simpan Produk Final"
    DOM->>PF: handleFormSubmit(e)
    PF->>PF: syncStateFromDOM()
    PF->>PF: validateForm()
    PF->>DB: DB.createProduct(productPayload)
    DB-->>PF: Berhasil Simpan (UUID Produk Dibuat)
    PF->>PF: clearDraftStorage()
    PF->>DOM: Tampilkan Toast Sukses & Alihkan ke Daftar Produk
\`\`\`

### 13.2. Alur Transaksi Kasir POS Menggunakan Kontrak Produk

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Kasir as Kasir POS
    participant POS as POS Controller (js/admin-app.js)
    participant Calc as Universal PricingCalculator
    participant DB as Database Engine (js/db.js)

    Kasir->>POS: Scan Barcode / Pilih Produk
    POS->>DB: DB.getProductById(productId)
    DB-->>POS: Objek Produk Lengkap (materials + finishings)
    alt Produk Memiliki Variasi
        Kasir->>POS: Buka Drawer Variasi & Pilih Opsi
    end
    Kasir->>POS: Input Kuantitas Belanja
    POS->>Calc: PricingCalculator.calculateProductPrice(params)
    Calc-->>POS: Return Gross Total, Diskon Grosir, & Final IDR
    Kasir->>POS: Selesaikan Transaksi Pembayaran Tunai/QRIS
    POS->>DB: DB.saveOrder(orderPayload)
    Note over DB, POS: GAP ARSITEKTUR: Stok produk/variasi<br/>TIDAK otomatis berkurang di DB.saveOrder()
    DB-->>POS: ID Transaksi Disimpan
    POS->>Kasir: Cetak Struk Bukti Pembayaran
\`\`\`
`;

fs.writeFileSync('docs/PRD_PRODUCT_MASTER_FUNCTION_CATALOG.md', content);
console.log('Successfully wrote docs/PRD_PRODUCT_MASTER_FUNCTION_CATALOG.md');

