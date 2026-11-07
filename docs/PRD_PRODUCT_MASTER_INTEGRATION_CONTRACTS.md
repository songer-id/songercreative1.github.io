# KONTRAK INTEGRASI & KONSUMEN DATA PRODUK
## Lampiran Teknis 4: PRD_PRODUCT_MASTER_INTEGRATION_CONTRACTS
**Songer Creative POS & E-Commerce Platform**
*Single Source of Truth (SSOT) — Kontrak Data, Arah Aliran, Fallback, Aturan Transformasi & Analisis Risiko Integrasi*

---

## 1. PENDAHULUAN & STANDAR KONTRAK INTEGRASI PRODUK

Modul Produk adalah entitas jantung (*core domain entity*) dalam platform Songer Creative. Data produk yang dirakit dan divalidasi melalui wizard formulir produk (`js/product-form.js`) disimpan ke basis data (`js/db.js` / Prisma ORM) dan dikonsumsi oleh 14 modul aplikasi di seluruh ekosistem.

Setiap kontrak mendefinisikan:
1. **Arah Aliran Data (Direction)**:
   - `W` (Write): Modul menghasilkan/memutasi data produk ke basis data.
   - `R` (Read): Modul membaca data produk untuk rendering, perhitungan, atau validasi.
   - `RW` (Bidirectional): Modul membaca sekaligus memutasi data produk.
2. **Payload Fields**: Daftar atribut wajib (*required*) dan opsional (*optional*) yang dikonsumsi atau dihasilkan.
3. **Nilai Bawaan & Fallback**: Penanganan defensif jika suatu properti bernilai `null`, `undefined`, atau format legacy.
4. **Transformasi Data**: Penyesuaian tipe, pemformatan teks, atau kalkulasi derivatif saat data diproses.
5. **Risiko Inkonsistensi & Dampak**: Titik rawan ketidaksesuaian antar-modul dan panduan mitigasi.

---

## 2. TABEL KONTRAK 14 MODUL KONSUMEN DATA PRODUK

### Modul 1: Admin Panel Form & Orchestrator (`admin.html`, `js/admin-app.js`)
- **Arah**: `RW` (Bidirectional).
- **Payload Fields**: Seluruh 134 properti `primaryState`, array `materialsState`, objek `finishingsState`, dan `card_config`.
- **Fallback**:
  - Jika `card_variant` kosong $\rightarrow$ fallback ke saran kategori (`getSuggestedCardVariantForCategory()`) atau `'A'`.
  - Jika foto galeri kosong $\rightarrow$ tampilkan placeholder icon upload abu-abu.
- **Transformasi**:
  - Menghapus format ribuan (titik) pada string rupiah menjadi `Number` murni sebelum disimpan.
  - Memotong nama produk $> 120$ karakter.
- **Risiko Inkonsistensi**: Form wizard merekonstruksi DOM Step 2 saat perpindahan step. Jika state belum disinkronkan via `syncStateFromDOM()`, nilai yang baru diketik di DOM akan hilang.

---

### Modul 2: Daftar Produk & Manajemen Tabel (`js/admin-app.js`)
- **Arah**: `R` (Read) & `W` (Update status tayang / hapus produk).
- **Payload Fields**:
  - Wajib: `id`, `name`, `price`, `stock`, `is_active`, `category_id`, `created_at`.
  - Opsional: `image_url`, `sku`, `barcode`, `sales_count`, `materials`.
- **Fallback**:
  - Jika `image_url` kosong $\rightarrow$ baca `images[0].url` $\rightarrow$ fallback ke placeholder `assets/img/placeholder-product.svg`.
  - Jika `stock === null` $\rightarrow$ tampilkan label *"Tak Terbatas"*.
- **Transformasi**:
  - `price` $\rightarrow$ `formatIDR(price)`.
  - `sales_count` $\rightarrow$ format angka ribuan.
- **Risiko Inkonsistensi**: Tabel produk membaca kolom flat `price` pada record produk. Jika produk memiliki variasi bertingkat di `materials`, harga yang tampil di tabel bisa berbeda dari rentang harga varian terendah jika `syncStateFromDOM()` tidak mengupdate flat price.

---

### Modul 3: Buyer Storefront & Katalog Publik (`index.html`, `js/buyer-store.js`)
- **Arah**: `R` (Read-Only).
- **Payload Fields**:
  - Wajib: `id`, `name`, `price`, `image_url` / `images`, `card_variant`, `is_active`.
  - Opsional: `card_config`, `custom_footer_1`, `custom_footer_2`, `rating_avg`, `sales_count`, `effective_discount`.
- **Fallback**:
  - Jika `custom_footer_1` kosong $\rightarrow$ gunakan teks default preset toko atau sembunyikan strip.
  - Footer 2 kosong $\rightarrow$ jangan render strip kedua, divider, atau spasi kosong.
- **Transformasi**:
  - Penyingkatan angka penjualan via `formatSalesCount(prod.sales_count)` (`"1,2RB+"`).
  - Pemotongan judul produk jika melebihi 2 baris (line-clamp).
- **Risiko Inkonsistensi**:
  - **Larangan Metrik Manual**: Storefront DILARANG membaca `admin_card_preview_metrics.rating` atau `sales` yang diinput manual oleh admin. Nilai rating dan penjualan storefront WAJIB berasal dari data transaksi riil (`rating_avg`, `sales_count`).

---

### Modul 4: Halaman Detail Produk / PDP (`pdp.html`, `js/pdp.js`)
- **Arah**: `R` (Read-Only).
- **Payload Fields**:
  - Wajib: `id`, `name`, `description`, `price`, `price_type`, `images`, `materials`, `finishings`.
  - Opsional: `custom_specs`, `size_guide`, `shipping_config`, `wholesale_tiers`, `warranty_period`, `product_origin`.
- **Fallback**:
  - Jika `custom_specs` kosong $\rightarrow$ sembunyikan tab spesifikasi teknis.
  - Jika `size_guide.enabled === false` $\rightarrow$ jangan render tombol "Lihat Panduan Ukuran".
- **Transformasi**:
  - Memetakan array `materials` menjadi kumpulan chip pilihan varian bahan dasar.
  - Menyaring opsi `finishings` jika `variation_scopes` diset ke `'spesifik'`.
- **Risiko Inkonsistensi**: Jika PDP mengimplementasikan formula hitung harga sendiri yang berbeda dari `PricingCalculator.calculateProductPrice()`, harga yang dilihat pembeli di PDP akan berselisih dengan total belanja di kasir atau checkout.

---

### Modul 5: Kasir POS (Point of Sale) (`admin.html`, `js/admin-app.js`)
- **Arah**: `R` (Read Produk) & `W` (Simpan Transaksi Kasir).
- **Payload Fields**:
  - Wajib: `id`, `name`, `barcode`, `sku`, `price`, `price_type`, `cost_price`, `stock`, `materials`, `finishings`.
  - Opsional: `order_category` (DnC/CtK), `wholesale_tiers`, `has_monthly_discount`.
- **Fallback**:
  - Jika barcode tidak ditemukan $\rightarrow$ sediakan pencarian manual via nama produk atau SKU.
  - Jika kasir offline $\rightarrow$ gunakan cache produk di IndexedDB lokal.
- **Transformasi**:
  - Mengonversi pilihan chip variasi kasir menjadi objek item transaksi keranjang POS.
- **Risiko Inkonsistensi**:
  - **GAP MUTASI STOK**: Transaksi kasir yang tersimpan ke tabel pesanan (`DB.saveOrder`) saat ini TIDAK secara otomatis mengurangi kolom `stock` pada tabel `products` atau `materials`. Hal ini mengakibatkan stok di etalase kasir tidak berkurang secara riil.

---

### Modul 6: Universal Pricing Calculator Engine (`js/pricing-calculator.js`)
- **Arah**: `R` (Read Pure / Stateless Service).
- **Payload Fields**:
  - `product`: `{ price_type, min_order, step_quantity, wholesale_mode, wholesale_tiers, has_monthly_discount, discount_type, discount_value }`.
  - `selectedVariations`: `{ tier1, tier2, tier3, tier4 }`.
  - `customDimensions`: `{ length, width }`.
  - `extras`: array layanan tambahan.
- **Fallback**:
  - Jika `min_order` kosong $\rightarrow$ default `1`.
  - Jika dimensi PxL $< 1.0 m^2$ $\rightarrow$ bulatkan ke batas minimal tagihan $1.0 m^2$.
- **Transformasi**:
  - Menghitung luas riil, kuantitas batch, diskon grosir, diskon promo, dan laba kotor.
- **Risiko Inkonsistensi**: Menjadi Single Source of Truth rumus harga. Modul lain tidak boleh menuliskan ulang rumus matematika mandiri.

---

### Modul 7: Dashboard & Analitika Penjualan (`js/admin-app.js`)
- **Arah**: `R` (Read-Only).
- **Payload Fields**: `id`, `name`, `category_id`, `sales_count`, `price`, `cost_price`, relasi tabel pesanan (`orders`).
- **Fallback**: Jika belum ada transaksi, grafik analitika menampilkan nilai $0$ tanpa error *null pointer*.
- **Transformasi**: Agregasi omzet, laba kotor $(Penjualan - HPP)$, dan produk terlaris (*Top 5 Best Sellers*).
- **Risiko Inkonsistensi**: Mengandalkan histori order. Jika pesanan dibatalkan (*canceled*), analitika harus mengecualikan nilai tersebut.

---

### Modul 8: Modul Afiliasi & Referral (`js/admin-app.js`)
- **Arah**: `R` (Read Komisi) & `W` (Catat Transaksi Afiliasi).
- **Payload Fields**: `id`, `affiliate_commission_type`, `affiliate_commission_mode`, `affiliate_commission_rate`, `affiliate_commission_tiers`.
- **Fallback**: Jika produk tidak mengaktifkan komisi afiliasi, transaksi referral untuk produk tersebut bernilai komisi `0`.
- **Transformasi**: Evaluasi tier tangga komisi berdasarkan kuantitas yang berhasil dijual afiliate ($min_n \le Qty \le max_n$).
- **Risiko Inkonsistensi**: Inkonsistensi antara properti ganda `affiliate_commission_type` dan `affiliate_commission_mode`. Keduanya harus dijaga bernilai sama.

---

### Modul 9: Promo, Diskon & Voucher Manager (`js/promo-manager.js`)
- **Arah**: `R` (Read Produk) & `W` (Terapkan Promo).
- **Payload Fields**: `id`, `category_id`, `price`, `has_monthly_discount`, `auto_monthly_promo`, `include_in_monthly_promo`.
- **Fallback**: Jika produk dinonaktifkan dari promo bulanan (`auto_monthly_promo = false`), diskon global toko tidak diterapkan ke produk tersebut.
- **Transformasi**: Menghitung harga jual bersih (*effective discounted price*) dan persentase badge diskon.
- **Risiko Inkonsistensi**: Tabrakan alias toggle `auto_monthly_promo` vs `include_in_monthly_promo`.

---

### Modul 10: Inventaris, Pergudangan & Mutasi Stok (`js/admin-app.js`, `js/db.js`)
- **Arah**: `RW` (Bidirectional).
- **Payload Fields**: `id`, `sku`, `barcode`, `stock`, `min_stock_alert`, `materials[i].stock`, `finishings[i].stock`.
- **Fallback**: Jika `stock === null`, produk dianggap unmanaged (*unlimited*).
- **Transformasi**: Pencatatan log mutasi stok (*stock in / stock out / stock adjustment*).
- **Risiko Inkonsistensi**: Tanpa mekanisme auto-decrement pada `DB.saveOrder`, mutasi stok saat ini bersifat manual, rentan terjadi *overselling*.

---

### Modul 11: Manajemen Pelanggan & CRM (`js/customer-manager.js`)
- **Arah**: `R` (Read-Only).
- **Payload Fields**: `id`, `name`, `category_id`, `max_order_per_customer`, `max_order_period`.
- **Fallback**: Jika batasan pesanan tidak aktif, pelanggan bebas memesan kuantitas berapa pun.
- **Transformasi**: Pengecekan riwayat pembelian pelanggan dalam rentang tanggal kalender tertentu untuk membatasi kuota borongan.
- **Risiko Inkonsistensi**: Pelanggan checkout menggunakan guest/anonim dapat melewati filter batas pesanan per akun.

---

### Modul 12: Review, Ulasan & Moderasi (`js/review-manager.js`)
- **Arah**: `RW` (Bidirectional).
- **Payload Fields**: `id`, `rating_avg`, `reviews_count`, array relasi ulasan `reviews`.
- **Fallback**: Jika belum ada ulasan, `rating_avg = 0` dan `reviews_count = 0`.
- **Transformasi**: Perhitungan rerata bergerak (*moving average*) rating setiap kali ulasan baru disetujui moderator:
  $$R_{baru} = \frac{(R_{lama} \times N) + Nilai}{N + 1}$$
- **Risiko Inkonsistensi**: Nilai `admin_card_preview_metrics.rating` tidak boleh menimpa perhitungan matematis `rating_avg` riil ulasan ini.

---

### Modul 13: Database Engine & Local Persistence Layer (`js/db.js`)
- **Arah**: `RW` (Data Store Master).
- **Payload Fields**: Seluruh entitas tabel `products`, `materials`, dan `finishings`.
- **Fallback**: Menjamin fallback schema UUID unik, timestamp `created_at` dan `updated_at` otomatis.
- **Transformasi**: Serialisasi JSON kolom kompleks (`card_config`, `shipping_config`, `custom_specs`, `size_guide`) saat disimpan ke LocalStorage / IndexedDB.
- **Risiko Inkonsistensi**: Hilangnya data variasi jika terjadi *race condition* saat penghapusan dan penyisipan ulang relasi `materials` dan `finishings`.

---

### Modul 14: Multi-Tenant Architecture & Prisma ORM (`prisma/schema.prisma`)
- **Arah**: `RW` (Backend Schema Contract).
- **Payload Fields**: Kolom SQL database PostgreSQL: `id`, `tenant_id`, `name`, `slug`, `category_id`, `price`, dll.
- **Fallback**: `tenant_id` wajib ada pada setiap query (*mandatory partition key*).
- **Transformasi**: Pemetaan snake_case kolom basis data ke camelCase properti entitas model Prisma Client.
- **Risiko Inkonsistensi**: Perbedaan penamaan properti (cth: `tenantId` di backend vs `tenant_id` di frontend) yang memerlukan adapter mapping yang konsisten.

---

## 3. ANALISIS RISIKO INKONSISTENSI & BREAKING CHANGES

```mermaid
flowchart TD
    PF["Product Form (js/product-form.js)"]
    DB["Database Engine (js/db.js)"]
    Store["Buyer Storefront (js/buyer-store.js)"]
    PDP["Product Detail (js/pdp.js)"]
    POS["Kasir POS (admin-app.js)"]
    Inv["Inventaris / Gudang"]

    PF -->|Payload Simpan Produk| DB
    DB -->|Read Produk| Store
    DB -->|Read Produk| PDP
    DB -->|Read Produk| POS
    POS -.->|Simpan Order (NO STOCK DECREMENT)| DB
    Inv -.->|Stok Tidak Tersinkronisasi Otomatis| DB
```

1. **Risiko 1: Celah Penurunan Stok Otomatis (Stock Decrement Gap)**
   *Deskripsi*: Modul POS dan Buyer Checkout memanggil `DB.saveOrder()`, namun tidak mengeksekusi pengurangan stok fisik pada tabel produk atau variasi.
   *Dampak*: Kuota stok tidak pernah berkurang, menyebabkan risiko pesanan fiktif atau kehabisan stok fisik saat pesanan sudah dibayar.
   *Mitigasi*: Menjadwalkan refactoring pada `DB.saveOrder()` untuk menyisipkan operasi atomik dekremen stok variasi terpilih.

2. **Risiko 2: Pelanggaran Batas Isolasi Metrik Pratinjau Admin**
   *Deskripsi*: Penjual dapat menginput manual angka rating (cth: 5.0) dan angka penjualan (cth: 10RB+) pada panel pratinjau Admin Step 1.
   *Dampak*: Jika properti `admin_card_preview_metrics` bocor atau dibaca oleh Storefront / PDP, toko akan menampilkan ulasan atau penjualan palsu ke publik.
   *Mitigasi*: Kontrak isolasi mutlak: Storefront & PDP hanya diizinkan membaca `prod.rating_avg` dan `prod.sales_count` riil.

3. **Risiko 3: Kerancuan Properti Flat vs Objek Bersarang (Footer & Promo)**
   *Deskripsi*: Teks footer disimpan dua kali: di objek `custom_footer_1.text` dan string flat `card_footer_text`. Demikian pula toggle promo (`has_daily_promo` vs `has_monthly_discount`).
   *Dampak*: Modul konsumen yang membaca properti flat tidak mendapatkan perubahan jika form hanya memperbarui objek bersarang.
   *Mitigasi*: Standardisasi adapter di `DB.getProductById()` yang secara otomatis memetakan kedua bentuk untuk menjamin kompatibilitas ke belakang (*backward compatibility*).

---

## 4. PROTOKOL PENGUJIAN & VERIFIKASI INTEGRASI (CONTRACT TESTING)

Untuk memastikan seluruh modul mematuhi kontrak integrasi, setiap penambahan atau perubahan fitur harus diverifikasi dengan tes kontrak berikut:

1. **Uji Validasi Form Produk**: Menjalankan skrip simulasi pengisian data lengkap (Step 1 $\rightarrow$ Step 2 $\rightarrow$ Submit) dan memastikan record yang dihasilkan memuat seluruh atribut wajib 14 modul.
2. **Uji Isolasi Metrik Mockup**: Memastikan bahwa produk yang disimpan dengan `admin_card_preview_metrics.rating = 5.0` dirender dengan rating riil (0.0 jika belum ada ulasan) saat dibuka di `index.html` dan `pdp.html`.
3. **Uji Keselarasan Formula Harga**: Menghitung harga varian kombinasi tertentu menggunakan `PricingCalculator.calculateProductPrice()` dan membandingkannya dengan output kalkulasi PDP dan etalase kasir POS; selisih harus sama persis Rp 0.
4. **Uji Keutuhan Rekonstruksi DOM**: Memastikan bahwa nilai input yang dimasukkan pada Step 2 tidak hilang saat pengguna mengklik "Kembali ke Step 1" lalu kembali lagi ke "Step 2".
