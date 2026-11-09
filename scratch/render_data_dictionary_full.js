const fs = require('fs');

const part1 = fs.readFileSync('scratch/data_dict_part1.md', 'utf8');

const part2 = `
---

## 3. DAFTAR RINCI PROPERTI YANG DITAMBAHKAN DINAMIS KE PRIMARYSTATE

Selain 134 properti yang terdaftar pada deklarasi awal objek \`primaryState\`, source code \`js/product-form.js\` dan \`js/db.js\` menetapkan dan membaca sekitar 40 properti tambahan secara dinamis pada berbagai tahapan form:

| No | Nama Properti Dinamis | Lokasi Penugasan Pertama | Tipe Data | Tujuan & Perilaku Teknis | Persistensi |
|---|---|---|---|---|---|
| 1 | \`card_variant_override\` | L2012, L29884 | Boolean | Flag override manual varian kartu agar tidak tertimpa saran otomatis kategori. | Kolom \`card_variant_override\` di tabel \`products\` |
| 2 | \`card_variant_manual_override\` | L1574, L27898 | Boolean | Alias kompatibilitas internal untuk flag perlindungan pilihan varian kartu pengguna. | In-Memory Only |
| 3 | \`card_config\` | L2013, L10005 | Object / null | Objek konfigurasi styling kartu (warna, border, radius, toggle fitur). | Disimpan di tabel \`products\` (\`card_config\`) |
| 4 | \`use_default_card_design\` | L2014, L10006 | Boolean | Menandai apakah produk menggunakan template preset toko atau kustom per-produk. | Disimpan di tabel \`products\` |
| 5 | \`custom_footer_1\` | L1651, L2095, L31252 | Object | Objek data Footer 1 Model C: \`{ text, icon, bg_color, text_color }\`. | Disimpan di tabel \`products\` |
| 6 | \`custom_footer_2\` | L1652, L2096, L31263 | Object | Objek data Footer 2 Model C: \`{ text, icon, bg_color, text_color }\`. | Disimpan di tabel \`products\` |
| 7 | \`countdown_radius\` | L9988, L10015 | String | Nilai border-radius kotak hitung mundur (cth: \`'4px'\`, \`'9999px'\`). | Disimpan di \`card_config\` |
| 8 | \`countdown_icon_color\` | L9991 | String (HEX) | Warna ikon jam/petir pada banner hitung mundur. | Disimpan di \`card_config\` |
| 9 | \`is_unlimited_max_order\` | L30031, L30172 | Boolean | Flag helper boolean penanda bahwa batas maksimal pesanan tidak dibatasi. | In-Memory Only |
| 10 | \`wholesale_enabled_by_variant\` | L2049, L2150 | Object (Map) | Pemetaan ID varian ke status toggle aktif grosir: \`{ [variantId]: Boolean }\`. | Disimpan di tabel \`products\` |
| 11 | \`wholesale_mode_by_variant\` | L2047, L2734 | Object (Map) | Pemetaan ID varian ke mode grosir: \`{ [variantId]: 'normal' \\| 'tiered' }\`. | Disimpan di tabel \`products\` |
| 12 | \`wholesale_by_variant\` | L2048, L2735 | Object (Map) | Pemetaan ID varian ke array baris tier grosir: \`{ [variantId]: [...] }\`. | Disimpan di tabel \`products\` |
| 13 | \`is_custom_dimension\` | L29939 | Boolean | Alias redundan untuk \`has_custom_dimension\`. | In-Memory Only |
| 14 | \`enable_custom_dimension\` | L29940 | Boolean | Alias redundan kedua untuk \`has_custom_dimension\`. | In-Memory Only |
| 15 | \`price\` | L21214, L29992 | Number | Nilai harga jual dasar produk non-variasi (disinkronkan ke materials[0].price). | Kolom \`price\` di tabel \`products\` |
| 16 | \`cost_price\` | L21215, L30001 | Number | Nilai modal HPP dasar produk non-variasi (disinkronkan ke materials[0].cost_price). | Kolom \`cost_price\` di tabel \`products\` |
| 17 | \`normal_price\` | L21216, L29993 | Number | Nilai acuan harga dasar sebelum terkena diskon harian/bulanan. | In-Memory / DB |
| 18 | \`normal_cost_price\` | L21217, L30002 | Number | Nilai acuan HPP dasar. | In-Memory / DB |
| 19 | \`stock_status\` | L8095, L11404 | String | Status ketersediaan stok: \`'in_stock'\`, \`'out_of_stock'\`, atau \`'unlimited'\`. | In-Memory / Live Preview |
| 20 | \`condition\` | L30343 | String | Kondisi produk: \`'Baru'\` atau \`'Bekas'\` (dari \`#select-prod-condition\`). | Disimpan di tabel \`products\` |
| 21 | \`sku\` | L30345, L30366 | String | Stock Keeping Unit identitas gudang produk. | Disimpan di tabel \`products\` |
| 22 | \`barcode\` | L30347 | String | Kode barcode untuk scanner kasir POS. | Disimpan di tabel \`products\` |
| 23 | \`image_aspect_ratio_manual\` | L21980 | Boolean | Flag bahwa pengguna telah mengubah rasio foto secara manual sehingga tidak dioverride otomatis. | In-Memory Only |
| 24 | \`variation_1_label\` | L2017 | String | Alias legacy untuk \`variation_labels.label_tier_1\`. | In-Memory Only |
| 25 | \`variation_scopes_by_variant\` | L2235 | Object | Pemetaan cakupan variasi spesifik per ID bahan dasar. | Disimpan di tabel \`products\` |

---

## 4. STRUKTUR DETAIL OBJEK BERSARANG (NESTED OBJECTS)

### 4.1. \`shipping_config\`
Dideklarasikan di \`js/product-form.js\` baris 538–555 dan disimpan ke kolom JSON \`shipping_config\` di tabel \`products\`:
\`\`\`json
{
  "is_cod": false,
  "cod_local": true,
  "cod_expedition": true,
  "couriers": ["pickup", "local_store", "reguler"],
  "local_village_free": true,
  "local_village_fee": "",
  "local_district_free": false,
  "local_district_fee": "5000",
  "weight": 200,
  "weight_unit": "gram",
  "length": 30,
  "width": 20,
  "height": 5,
  "length_cm": 30,
  "width_cm": 20,
  "height_cm": 5
}
\`\`\`
- \`is_cod\` (Boolean): Mengaktifkan opsi pembayaran Bayar di Tempat (COD).
- \`cod_local\` (Boolean): COD berlaku untuk armada kurir toko sendiri.
- \`cod_expedition\` (Boolean): COD berlaku untuk kurir ekspedisi nasional reguler.
- \`couriers\` (Array of Strings): Layanan yang diizinkan (\`'pickup'\`, \`'local_store'\`, \`'reguler'\`). *Catatan*: \`'instant'\` otomatis dinormalkan ke \`'local_store'\` di L2075.
- \`local_village_free\` (Boolean): Tarif gratis untuk pengantaran armada toko dalam satu desa.
- \`local_village_fee\` (String / Number): Tarif flat jika satu desa berbayar.
- \`local_district_free\` (Boolean): Tarif gratis dalam satu kecamatan.
- \`local_district_fee\` (String / Number): Tarif flat dalam satu kecamatan.
- \`weight\` (Number): Berat paket kemasan (wajib diisi oleh penjual).
- \`weight_unit\` (String): Satuan berat (\`'gram'\` atau \`'kg'\`).
- \`length\`, \`width\`, \`height\` (Number): Dimensi kemasan paket luar untuk perhitungan berat volumetrik $(P \\times L \\times T) \\div 6.000$.

### 4.2. \`admin_card_preview_metrics\`
Dideklarasikan di \`js/product-form.js\` baris 463–466:
\`\`\`json
{
  "rating": {
    "source": "auto",
    "manual_value": null
  },
  "sales": {
    "source": "auto",
    "manual_value": null
  }
}
\`\`\`
- \`rating.source\` (String: \`'auto'\` \\| \`'manual'\`): Sumber data bintang rating pada pratinjau kartu Admin Step 1.
- \`rating.manual_value\` (Number \\| null): Nilai input/pilih manual seller (saran: 5.0, 4.9, 4.8, 4.7) dengan batas $0.0 - 5.0$.
- \`sales.source\` (String: \`'auto'\` \\| \`'manual'\`): Sumber data angka penjualan pada pratinjau kartu Admin Step 1.
- \`sales.manual_value\` (Number \\| null): Nilai input/pilih manual seller (saran: 50, 100, 500, 1001 [1RB+], 10001 [10RB+]).
- **Aturan Isolasi Mutlak**: Nilai \`manual_value\` HANYA digunakan untuk preview mockup di Admin Step 1. Modul Storefront Pembeli (\`js/buyer-store.js\`) dan PDP (\`js/pdp.js\`) DILARANG KERAS membaca objek ini.

### 4.3. \`variation_labels\`
Dideklarasikan di \`js/product-form.js\` baris 473–480:
\`\`\`json
{
  "label_product": "Produk",
  "label_tier_1": "Pilihan Bahan",
  "label_tier_2": "Finishing Pinggir",
  "label_extra_1": "Laminasi Tambahan",
  "label_extra_2": "Mata Ayam / Keling",
  "label_extra_3": "Layanan Kilat"
}
\`\`\`
Menyimpan penamaan kustom sesi variasi yang ditampilkan kepada pembeli pada antarmuka PDP dan drawer variasi kasir POS.

### 4.4. \`variation_scopes\`
Dideklarasikan di \`js/product-form.js\` baris 445–450:
\`\`\`json
{
  "main": "umum",
  "extra_1": "umum",
  "extra_2": "umum",
  "extra_3": "umum"
}
\`\`\`
- \`'umum'\`: Opsi varian berlaku seragam untuk semua pilihan varian sebelumnya.
- \`'spesifik'\`: Opsi varian disaring dan hanya muncul apabila pembeli memilih varian bahan dasar tertentu.

### 4.5. \`max_order_period\`
Dideklarasikan di \`js/product-form.js\` baris 497–503:
\`\`\`json
{
  "start_date": "2026-11-01",
  "max_qty": 10,
  "days": 7,
  "period_type": "non_recurring",
  "end_date": "2026-11-08"
}
\`\`\`
- \`period_type\` (String: \`'non_recurring'\` \\| \`'recurring'\`): Jenis periode pembatasan kuota pesanan per akun pembeli.

### 4.6. \`affiliate_commission_tiers\`
Dideklarasikan di \`js/product-form.js\` baris 518–520:
\`\`\`json
[
  { "min_qty": 1, "max_qty": 49, "commission_val": 5, "commission_pct": 5 },
  { "min_qty": 50, "max_qty": "", "commission_val": 8, "commission_pct": 8 }
]
\`\`\`
- Baris pertama selalu mengunci \`min_qty: 1\`.
- Baris berikutnya selalu mengunci \`min_qty = max_qty baris sebelumnya + 1\`.
- Nilai \`commission_val\` dapat berupa persentase (%) atau nominal rupiah (Rp) tergantung \`affiliate_commission_tier_unit\`.

### 4.7. \`custom_footer_1\` & \`custom_footer_2\`
Dideklarasikan di \`js/product-form.js\` baris 1651–1660 dan baris 31252–31273:
\`\`\`json
{
  "text": "Tersedia Berbagai Variasi",
  "icon": "truck",
  "bg_color": "#059669",
  "text_color": "#ffffff"
}
\`\`\`
- \`text\` (String, maks. 32 karakter grapheme).
- \`icon\` (String, ID katalog: \`'none'\`, \`'truck'\`, \`'clock'\`, \`'shield'\`, \`'star'\`, \`'gift'\`, \`'badge-percent'\`, \`'package'\`, \`'zap'\`, \`'heart'\`, \`'tag'\`, \`'award'\`).
- \`bg_color\` (String HEX, default \`var(--color-primary)\` untuk Footer 1, \`var(--color-secondary)\` untuk Footer 2).
- \`text_color\` (String HEX, default \`#ffffff\`).

### 4.8. \`size_guide\`
Dideklarasikan di \`js/product-form.js\` baris 410 dan 18788:
\`\`\`json
{
  "enabled": true,
  "type": "table",
  "template": "pakaian",
  "columns": ["Ukuran", "Lebar Dada (cm)", "Panjang Baju (cm)"],
  "rows": [
    ["S", "48", "68"],
    ["M", "50", "70"],
    ["L", "52", "72"],
    ["XL", "54", "74"]
  ],
  "image_url": "",
  "linked_variation_tier": "tier1"
}
\`\`\`
- \`type\` (String: \`'table'\` \\| \`'image'\`): Format sajian panduan ukuran.
- \`linked_variation_tier\` (String: \`'tier1'\`, \`'tier2'\`, atau kosong): Menghubungkan baris tabel secara reaktif ke pilihan chip varian di PDP.

### 4.9. \`custom_specs\`
Dideklarasikan di \`js/product-form.js\` baris 409 dan disimpan ke tabel \`products\`:
\`\`\`json
[
  { "title": "Bahan", "value": "Fleksi Korea 280gr" },
  { "title": "Finishing", "value": "Mata Ayam 4 Sudut" },
  { "title": "Ketahanan", "value": "Outdoor 6-12 Bulan" },
  { "title": "Asal Produk", "value": "Lokal" },
  { "title": "SKU Induk", "value": "SPK-280-OUT" }
]
\`\`\`
Maksimal 10 baris spesifikasi teknis gabungan (otomatis + manual) yang dirender di tab spesifikasi PDP dan deskripsi ringkas POS.

---

## 5. KAMUS STRUKTUR STATE VARIASI 1: MATERIALSSTATE

Array \`materialsState\` menyimpan daftar opsi Variasi 1 (Bahan Dasar / Varian Utama). Setiap elemen objek di dalam array memiliki struktur teknis berikut:

| Nama Field | Tipe Data | Default | Deskripsi Bisnis & Teknis | Persistensi |
|---|---|---|---|---|
| \`id\` | String / UUID | \`DB.generateUUID()\` | UUID unik penanda opsi bahan dasar. | Kolom \`id\` tabel \`materials\` |
| \`product_id\` | String / UUID | UUID Produk | Foreign key relasi ke tabel produk. | Kolom \`product_id\` tabel \`materials\` |
| \`name\` | String | \`'Produk Standar'\` | Nama opsi bahan (cth: "Fleksi 280gr", "Albatros"). | Kolom \`name\` tabel \`materials\` |
| \`description\` | String | \`''\` | Keterangan tambahan atau keunggulan bahan. | Kolom \`description\` tabel \`materials\` |
| \`price\` | Number | \`0\` | Harga jual dasar opsi bahan (sebelum multiplier PxL atau varian pendukung). | Kolom \`price\` tabel \`materials\` |
| \`cost_price\` | Number | \`Math.round(price * 0.6)\` | Biaya modal HPP opsi bahan. | Kolom \`cost_price\` tabel \`materials\` |
| \`stock\` | Number \\| null | \`null\` | Kuota stok fisik varian (null = unlimited). | Kolom \`stock\` tabel \`materials\` |
| \`min_order\` | Number | \`1\` | Batas minimal order untuk varian ini. | Kolom \`min_order\` tabel \`materials\` |
| \`max_order\` | Number \\| null | \`null\` | Batas maksimal order untuk varian ini. | Kolom \`max_order\` tabel \`materials\` |
| \`step_multiplier\` | Number | \`1\` | Pengali batch kelipatan kuantitas (khusus \`price_type = 7\`). | Kolom \`step_multiplier\` tabel \`materials\` |
| \`wholesale_mode\` | String \\| null | \`null\` | Mode grosir varian: \`'normal'\` atau \`'tiered'\`. | Kolom \`wholesale_mode\` tabel \`materials\` |
| \`is_wholesale_enabled\` | Boolean | \`false\` | Menandai apakah varian ini mengaktifkan harga grosir mandiri. | Disimpan di tabel \`materials\` |
| \`wholesale_tiers\` | Array | \`[]\` | Daftar rentang kuantitas dan harga grosir khusus untuk varian ini. | Kolom \`wholesale_tiers\` tabel \`materials\` |

---

## 6. KAMUS STRUKTUR STATE VARIASI 2–4 & LAYANAN EKSTRA: FINISHINGSSTATE

Objek \`finishingsState\` terpartisi menjadi 4 partisi array:
- \`finishingsState.main\` $\rightarrow$ Variasi 2 (Finishing Utama)
- \`finishingsState.extra_1\` $\rightarrow$ Variasi 3 (Finishing Tambahan 1)
- \`finishingsState.extra_2\` $\rightarrow$ Variasi 4 (Finishing Tambahan 2)
- \`finishingsState.extra_3\` $\rightarrow$ Layanan Ekstra (Extra Services)

Setiap elemen objek finishing memiliki struktur:

| Nama Field | Tipe Data | Default | Deskripsi Bisnis & Teknis | Persistensi |
|---|---|---|---|---|
| \`id\` | String / UUID | \`DB.generateUUID()\` | UUID unik penanda opsi varian pendukung. | Kolom \`id\` tabel \`finishings\` |
| \`product_id\` | String / UUID | UUID Produk | Foreign key relasi ke produk induk. | Kolom \`product_id\` tabel \`finishings\` |
| \`tier\` | String | \`'main'\` | Tingkatan partisi: \`'main'\`, \`'extra_1'\`, \`'extra_2'\`, atau \`'extra_3'\`. | Kolom \`tier\` tabel \`finishings\` |
| \`name\` | String | \`''\` | Nama opsi finishing (cth: "Keling 4 Sudut", "Laminasi Doff"). | Kolom \`name\` tabel \`finishings\` |
| \`description\` | String | \`''\` | Deskripsi keterangan opsi finishing. | Kolom \`description\` tabel \`finishings\` |
| \`price\` | Number | \`0\` | Biaya tambahan harga jual jika opsi dipilih. | Kolom \`price\` tabel \`finishings\` |
| \`cost_price\` | Number | \`Math.round(price * 0.5)\` | Biaya tambahan modal HPP toko untuk pengerjaan finishing ini. | Kolom \`cost_price\` tabel \`finishings\` |
| \`stock\` | Number \\| null | \`null\` | Kuota stok fisik bahan finishing. | Kolom \`stock\` tabel \`finishings\` |
| \`parent_id\` | String | \`''\` | ID varian bahan pada Variasi 1 jika varian ini berskala spesifik. | Kolom \`parent_id\` tabel \`finishings\` |
| \`extra_type\` | String \\| null | \`null\` | Khusus \`extra_3\`: \`'direct'\` (otomatis 1x), \`'checklist'\` (pilihan bebas), atau \`'qty'\` (input kuantitas terpisah). | Kolom \`extra_type\` tabel \`finishings\` |
| \`calc_mode\` | String | \`'flat'\` | Mode hitung: \`'flat'\` (biaya tetap) atau \`'meter'\` (menyesuaikan keliling/luas PxL). | Disimpan di tabel \`finishings\` |
| \`dim_add_val\` | Number | \`0\` | Nilai penambah dimensi jika finishing memakan bahan berlebih (cth: lebihan lipatan 2 cm). | Disimpan di tabel \`finishings\` |
| \`dim_add_side\` | String | \`'p_l'\` | Sisi penambahan bahan: \`'p_l'\` (panjang & lebar), \`'p_only'\`, atau \`'l_only'\`. | Disimpan di tabel \`finishings\` |

---

## 7. KAMUS STATE TRANSIEN, SNAPSHOT & MODAL

State berikut dikelola in-memory dan tidak tersimpan ke database final produk:

1. **\`sandboxPxlState\`** (\`js/product-form.js\` baris 1745–1750):
   - \`selectedMainOptionId\`: ID bahan yang dipilih untuk simulasi PxL.
   - \`selectedFinishingIds\`: Array ID finishing yang aktif dalam simulasi.
   - \`simLength\`: Nilai input panjang (cm/m) pada modal simulator.
   - \`simWidth\`: Nilai input lebar (cm/m) pada modal simulator.
2. **\`previewTestState\`** (\`js/product-form.js\` baris 160–180):
   - \`sidebarTab\`: Tab sidebar aktif (\`'preview'\` atau \`'design'\`).
   - \`isDrawerOpen\`: Status visibilitas mobile bottom drawer preview.
   - \`drawerActionType\`: Tipe CTA di drawer (\`'buy'\` atau \`'cart'\`).
   - \`selectedTier1Id\` s/d \`selectedTier4Id\`: State simulasi pilihan interaktif chip pada kartu mockup.
   - \`qty\`: Kuantitas belanja simulasi (default: 1).
3. **\`cardDesignSnapshot\`** (\`js/product-form.js\` baris 30):
   - Objek cadangan yang menyimpan konfigurasi desain kartu sebelum pengguna melakukan perubahan di tab Desain Kartu. Digunakan saat tombol "Batal" Desain Kartu diklik untuk memulihkan state visual secara instan.
4. **\`cardAccordionState\`** (\`js/product-form.js\` baris 4166):
   - Menyimpan status buka/tutup 5 seksi accordion panel tools Desain Kartu: \`{ frame: true, 'text-info': false, badge: false, promo: false, footer: false }\`.
5. **\`initialEditSnapshot\`** (\`js/product-form.js\` baris 1753):
   - Serialized JSON hash dari seluruh state produk saat dibuka pertama kali di mode edit. Digunakan oleh fungsi \`hasEditProductChanged()\` untuk menentukan apakah modal konfirmasi batal perlu dimunculkan.
6. **\`DRAFT_STORAGE_KEY\`** (\`'songer_add_product_draft'\`):
   - Kunci localStorage tempat penyimpanan draf otomatis saat penjual mengetik data di mode create. Dihapus saat submit sukses atau saat pembatalan dikonfirmasi.

---

## 8. MATRIKS KLASIFIKASI REDUNDANSI, ALIAS & PROPERTI TERDEPREKASI

Berdasarkan audit teknis, berikut adalah daftar properti yang teridentifikasi redundan, alias kembar, atau warisan arsitektur lama:

| Nama Properti | Klasifikasi | Properti Pengganti Sah | Bukti Baris Kode | Dampak & Risiko |
|---|---|---|---|---|
| \`has_layer_2\` | Legacy / Redundant | \`has_variation_2\` | L425, L2200, L22209 | Redundansi pemeliharaan dua variabel untuk fungsi yang sama persis. |
| \`has_layer_3\` | Legacy / Redundant | \`has_variation_3\` | L426, L2202, L29311 | Di baris 29311, kode hanya mengubah \`has_layer_3\` tanpa mengubah \`has_variation_3\`. |
| \`has_layer_4\` | Legacy / Redundant | \`has_variation_4\` | L427, L2204, L22213 | Redundansi pemeliharaan. |
| \`has_layer_5\` | Legacy / Redundant | \`has_extra_service\` | L428, L2206, L23159 | Redundansi pemeliharaan. |
| \`scope_main\` | Redundant | \`variation_scopes.main\` | L451, L2238, L29910 | Properti flat redundan terhadap objek bersarang. |
| \`scope_extra_1\` | Redundant | \`variation_scopes.extra_1\` | L452, L2239, L29910 | Properti flat redundan terhadap objek bersarang. |
| \`scope_extra_2\` | Redundant | \`variation_scopes.extra_2\` | L453, L2240, L29910 | Properti flat redundan terhadap objek bersarang. |
| \`scope_extra_3\` | Redundant | \`variation_scopes.extra_3\` | L454, L2241, L29910 | Properti flat redundan terhadap objek bersarang. |
| \`has_daily_promo\` | Alias Ganda | \`has_monthly_discount\` | L526, L2058, L26664 | Sinkronisasi ganda: UI membaca \`has_daily_promo\`, DB/POS membaca \`has_monthly_discount\`. |
| \`include_in_monthly_promo\` | Alias Ganda | \`auto_monthly_promo\` | L528, L2055, L30221 | Properti kembar untuk toggle partisipasi promo bulanan. |
| \`affiliate_commission_type\` | Alias Ganda | \`affiliate_commission_mode\` | L512, L2116, L2750 | \`type\` dan \`mode\` di-assign nilai yang sama persis di seluruh alur afiliasi. |
| \`is_custom_dimension\` | Alias Redundan | \`has_custom_dimension\` | L29939 | Properti ketiga yang diset bersamaan di \`syncStateFromDOM()\`. |
| \`enable_custom_dimension\` | Alias Redundan | \`has_custom_dimension\` | L29940 | Properti keempat yang diset bersamaan di \`syncStateFromDOM()\`. |
| \`card_footer_text\` | Flat Legacy | \`custom_footer_1.text\` | L560, L2794, L31258 | Penyimpanan ganda teks footer 1 (objek vs flat string). |
| \`card_footer_2_text\` | Flat Legacy | \`custom_footer_2.text\` | L564, L2800, L31269 | Penyimpanan ganda teks footer 2 (objek vs flat string). |
| \`footer_badge_icon\` | Flat Legacy | \`custom_footer_1.icon\` | L561, L2795, L31259 | Penyimpanan ganda ikon footer 1. |
| \`footer_2_badge_icon\` | Flat Legacy | \`custom_footer_2.icon\` | L565, L2801, L31270 | Penyimpanan ganda ikon footer 2. |
`;

fs.writeFileSync('docs/PRD_PRODUCT_MASTER_DATA_DICTIONARY.md', part1 + part2);
console.log('Successfully wrote docs/PRD_PRODUCT_MASTER_DATA_DICTIONARY.md');

