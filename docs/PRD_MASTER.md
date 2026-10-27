# MASTER PRD (PRODUCT REQUIREMENT DOCUMENT) & ARSITEKTUR SISTEM
## POS & E-COMMERCE PERCETAKAN TERPADU - SONGER CREATIVE
**Single Source of Truth (SSOT) & Technical Compass**  
**Dokumen Acuan**: `docs/PRD_MASTER.md`  
**Status Proyek**: Aktif - Tahap Pengembangan Menyeluruh  
**Terakhir Diperbarui**: 28 Oktober 2026  

---

> [!IMPORTANT]
> **PROTOKOL WAJIB AGENT / DEVELOPER (ATURAN MUTLAK):**
> 1. Dokumen ini adalah **KOMPAS UTAMA & SINGLE SOURCE OF TRUTH (SSOT)** proyek `D:\pos-songer-creative\`.
> 2. **SEBELUM** memulai tugas pengerjaan apa pun dan **SESUDAH** menyelesaikan tugas apa pun, developer/agent **WAJIB** membaca dokumen ini serta memperbarui status tanda centang `[x]` pada **BAGIAN 4 (Master Checklist Urutan Pengerjaan)**.
> 3. **DILARANG MERUSAK ATAU MENGUBAH FITUR STABIL**: Fitur yang bertanda `[✅ SUDAH SESUAI & STABIL]` di bawah ini tidak boleh dirombak perilakunya atau dirusak alur datanya.
> 4. **PRIORITAS MOBILE-FIRST**: Setiap perubahan antarmuka wajib dioptimalkan untuk layar ponsel (kartu `rounded-lg`, kontrol input/button `rounded-md`, touch target $\ge 44 \times 44\text{ px}$, tata letak rapat dan fluid wide tanpa horizontal scrollbar yang tidak diinginkan).
> 5. **OTOMATISASI WARNA DINAMIS**: Semua komponen interaktif (tombol CTA, badge aktif, focus ring, radio/checkbox tercentang, subnavbar aktif) **WAJIB** terikat pada CSS Variables (`--color-primary`, `--color-primary-hover`, `--color-primary-subtle`, `--color-secondary`). Dilarang memakai class Tailwind warna statis seperti `emerald-*` mentah pada elemen interaktif brand.
> 6. **ANTI-DUPLIKASI**: Dilarang membuat fungsi, state, atau event listener ganda; satukan dan manfaatkan modul inti yang telah terpasang.
> 7. **STANDAR BAHASA INDONESIA BAKU & RAMAH PENGGUNA AWAM (SAAS UX WRITING)**: Seluruh teks antarmuka (label input, judul menu, tombol, placeholder, tooltip, pesan error, hingga notifikasi toast) **WAJIB** menggunakan Bahasa Indonesia yang baku, jelas, sopan, dan langsung mudah dipahami oleh pengguna awam (pemilik toko UMKM, kasir, maupun pembeli baru). Dilarang keras menampilkan jargon koding/teknis asing yang membingungkan (*payload, callback, slug, threshold, tier, mutasi state*) pada antarmuka pengguna; gunakan padanan praktis (contoh: *"Batas Minimal Pesanan"*, *"Tautan Singkat Toko"*, *"Uang Muka (DP)"*, *"Simpan Pengaturan"*).
> 8. **OTOMATISASI CACHE BUSTING GLOBAL (`node bump-version.js`)**: DILARANG mengedit angka query string `?v=...` secara manual satu per satu di dalam file `.html`. Setiap kali selesai memodifikasi file `.js` atau `.css`, developer/agent **WAJIB** menjalankan perintah `node bump-version.js` sebelum `git add .` agar seluruh 35+ aset di 6 file HTML (`admin.html`, `index.html`, `product.html`, `settings.html`, `theme-editor.html`, `superadmin/superadmin.html`) otomatis diperbarui serentak ke versi timestamp WIB terbaru.

---

## DAFTAR ISI
1. [BAGIAN 1: Peta Arsitektur Aktual & Guardrails Kestabilan](#bagian-1-peta-arsitektur-aktual--guardrails-kestabilan)
2. [BAGIAN 2: Keputusan Bisnis Mutlak yang Telah Dikunci](#bagian-2-keputusan-bisnis-mutlak-yang-telah-dikunci)
3. [BAGIAN 3: Spesifikasi Detail Isi & Fungsi Setiap Menu](#bagian-3-spesifikasi-detail-isi--fungsi-setiap-menu)
   - [Menu 1: Storefront / Etalase Pembeli](#menu-1-storefront--etalase-pembeli-indexhtml--jsbuyer-storejs)
   - [Menu 2: Halaman Detail Produk / PDP & Kalkulator](#menu-2-halaman-detail-produk--pdp--kalkulator-producthtml-jspdpjs-jspricing-calculatorjs)
   - [Menu 3: Keranjang, Checkout Terpadu & Member Area](#menu-3-keranjang-checkout-terpadu--member-area-pelanggan)
   - [Menu 4: Seller Center - Form Produk, Kategori, Stok & Pesanan](#menu-4-seller-center---form-produk-kategori-stok--pesanan-adminhtml)
   - [Menu 5: Aplikasi Kasir POS](#menu-5-aplikasi-kasir-pos-view-pos-cashier-di-adminhtml--jsadmin-appjs)
   - [Menu 6: Marketing, Kupon, Affiliate & CMS Terpadu](#menu-6-marketing-kupon-affiliate-admin--cms-terpadu)
   - [Menu 7: Pengaturan Toko & Integrasi API](#menu-7-pengaturan-toko--integrasi-api-settingshtml-jssettingsjs)
   - [Menu 8: Refactoring Helper & Persiapan Migrasi Backend](#menu-8-refactoring-helper--persiapan-migrasi-backend)
4. [BAGIAN 4: Master Checklist Urutan Pengerjaan (Actionable Phases)](#bagian-4-master-checklist-urutan-pengerjaan-actionable-phases)

---

## BAGIAN 1: Peta Arsitektur Aktual & Guardrails Kestabilan

### 1.1. Inventaris Berkas Aktif (Active Project Files)
```
D:\pos-songer-creative\
├── index.html                   # Storefront utama pembeli (Katalog, Header, Banner, Floating Kupon)
├── product.html                 # Detail Produk (PDP), kalkulator harga PxL, galeri foto, ulasan
├── admin.html                   # Shell SPA Seller Center & POS Kasir (Router Hash)
├── settings.html                # Form identitas toko, tema 2 warna, logo/favicon, printer thermal
├── theme-editor.html            # Wadah kustomizer tema Shopify-style (dimuat via iframe)
├── superadmin/
│   ├── superadmin.html          # Panel Superadmin Multi-Tenant SaaS independen
│   ├── superadmin.js            # Logika CRUD Tenant, paket langganan, feature matrix
│   └── superadmin.css           # Styling tema cockpit superadmin
├── js/
│   ├── utils.js                 # Pustaka utilitas terpusat (formatIDR, escapeHtml, hexToRgba, generateSlug, formatDateID)
│   ├── db.js                    # Database lokal client-side (100% localStorage terenkapsulasi)
│   ├── admin-app.js             # Controller utama Admin SPA, POS kasir, pesanan, dashboard, CRM
│   ├── buyer-store.js           # Controller Storefront (pencarian autocomplete, render kartu A/B/C)
│   ├── product-form.js          # Engine form produk 2-step, live preview, kompresi foto WebP
│   ├── category-manager.js      # CRUD Kategori utama & Sub-Kategori etalase
│   ├── product-list.js          # Tabel katalog admin, search, filter status, aksi edit/hapus
│   ├── promo-manager.js         # Pengelolaan banner promo, kupon diskon, voucher
│   ├── review-manager.js        # Moderasi ulasan (approve / reject)
│   ├── customer-manager.js      # CRM pelanggan, riwayat transaksi kasir/web
│   ├── pricing-calculator.js    # Engine kalkulasi harga (PxL M², Kg, Lt, KombStep, KombF)
│   ├── pdp.js                   # Interaksi PDP, kalkulasi live, integrasi cart & checkout
│   ├── settings.js              # Sinkronisasi form pengaturan toko & printer
│   └── theme-editor.js          # Live theme preview & generator variabel CSS
├── css/
│   ├── admin.css                # CSS utama Admin, sticky subnav, radius tegas, mobile layout
│   ├── storefront.css           # Styling pendukung katalog etalase toko
│   └── style.css                # Bridge variabel warna dual-color branding
│   └── theme-editor.css         # Styling antarmuka kustomizer tema
├── src/
│   └── lib/
│       ├── invoice/
│       │   └── invoice-generator.js # Standarisasi nomor faktur [A/B]-[Prefix]-[00001]-[MMYY]
│       ├── db-local/
│       │   └── offline-db.js        # Modul IndexedDB lokal (disiapkan untuk transaksi offline POS)
│       └── prisma/
│           └── client.js            # Singleton client Prisma (disiapkan untuk Node backend)
├── prisma/
│   ├── schema.prisma            # 16 Model tabel PostgreSQL Multi-Tenant
│   └── seed.js                  # Data seeder awal tenant Songer Creative
├── schema.sql                   # Skrip DDL PostgreSQL awal
├── bump-version.js              # Script otomatisasi global cache busting aset HTML (timestamp WIB)
├── Buka-Aplikasi.bat            # Launcher instan Windows (index.html / admin.html)
├── Buka-Preview-HP.bat          # Launcher preview lokal jaringan Wi-Fi
└── serve.ps1                    # Server HTTP PowerShell ringan untuk pengujian mobile
```

### 1.2. Fitur-Fitur Teruji yang Wajib Dipertahankan (`[✅ SUDAH SESUAI & STABIL]`)
Dilarang memodifikasi atau menghilangkan fungsionalitas berikut:
1. **3 Varian Kartu Produk Etalase**: Model A (Standard Cetak PxL), Model B (Portofolio/Jasa 1 Baris Tebal), dan Model C (Retail/Shopee-style dengan dual-footer badge & timer).
2. **Galeri Foto 10 Slot**: Kompresi senyap HTML5 Canvas ke format WebP/JPEG (`quality: 0.8`), rasio foto 1:1 dan 4:3 instan, badge "Cover", serta tombol reordering.
3. **Subnavbar Sticky Step 2**: Menempel rapat `top: 0` persis di bawah topbar admin, membentang penuh 100% *edge-to-edge* di mobile tanpa margin/padding bocor, dengan smooth scrolling ke seksi kartu.
4. **Form Produk 2 Tahap (Progressive Gating)**: Step 1 (Pilihan Jenis Fisik/Non Fisik, Model Kartu A/B/C, Nama, Foto, 2 Label Khusus terkunci) dan Step 2 (6 Kartu Seksi dengan validasi harga HPP dan live preview).
5. **Kalkulator Harga Cetak Multi-Rumus**: PxL Meter Persegi (min. 1.0 m²), Bobot Kg, Volume Liter, KombStep (kelipatan kuantitas), dan Normal/KombF.
6. **Antarmuka Kasir POS**: Touch grid katalog, filter kategori, keranjang belanja kasir, kalkulasi kembalian, cetak struk thermal 58mm/80mm, dan format invoice resmi.
7. **Kustomizer Tema Visual**: Iframe live preview editor tema Shopify-style dengan sinkronisasi variabel CSS.

### 1.3. Standar Desain Mobile-First, Sistem Warna Dinamis & Standar Bahasa SaaS UX Writing
- **Radius Border Tegas**:
  * Seluruh kartu seksi / kontainer modul: `border-radius: 0.5rem !important;` (`rounded-lg` / 8px).
  * Seluruh elemen kontrol (input teks, select dropdown, textarea, tombol button, pills chip): `border-radius: 0.375rem !important;` (`rounded-md` / 6px).
  * Menghilangkan *nested double borders* (kotak di dalam kotak) pada tampilan mobile.
- **Sistem Dual-Color Branding**:
  * Warna Primer (`--color-primary`): Navbar, tab aktif, tombol utama, border aktif, focus ring.
  * Warna Sekunder / Aksen (`--color-secondary`): Tombol "Beli Sekarang", badge promo/diskon, bintang rating.
  * Warna Hover (`--color-primary-hover`, `--color-secondary-hover`) & Subtle (`--color-primary-subtle`, `--color-secondary-subtle`).
- **Standar Bahasa Indonesia Baku & Ramah Pengguna Awam (SaaS UX Writing)**:
  * Seluruh teks antarmuka pada Storefront, PDP, Admin SPA, POS Kasir, dan Pengaturan wajib menggunakan Bahasa Indonesia yang baku dan komunikatif.
  * Hindari istilah teknis koding/asing yang membingungkan orang awam; gunakan istilah bisnis/operasional yang umum di Indonesia:
    - *Slug / Permalink* -> Tautan Singkat / Alamat Web
    - *Threshold / Minimum Qty* -> Batas Minimal Pesanan
    - *Down Payment (DP)* -> Uang Muka (DP)
    - *Wholesale Tier* -> Harga Grosir Bertingkat
    - *Payload / Callback / Webhook* -> Data Transaksi / Notifikasi Otomatis
    - *Save / Submit* -> Simpan Data / Simpan Perubahan

---

## BAGIAN 2: Keputusan Bisnis Mutlak yang Telah Dikunci

Berdasarkan analisis kebutuhan operasional bisnis percetakan terpadu, keputusan berikut telah dikunci secara mutlak:

1. **Alur Pengiriman File Desain Cetak (No Heavy Upload on Web):**
   - **TIDAK ADA** formulir upload file desain berat (TIFF, CDR, PSD, PDF ratusan MB) pada saat checkout di website. Hal ini untuk mencegah kegagalan checkout akibat koneksi lambat dan beban server/kuota penyimpanan.
   - Pengiriman file cetak dilakukan oleh pelanggan **melalui WhatsApp resmi toko setelah pesanan terbentuk**, dengan wajib mencantumkan **Nomor Invoice** yang didapat saat checkout.
   - Instruksi pengiriman file ini dikirimkan secara otomatis ke nomor WhatsApp pelanggan melalui gateway Fonnte segera setelah order dibuat.

2. **Kebijakan Manajemen Stok (Finished Goods Only):**
   - Sistem stok hanya memotong kuantitas **Produk Jadi** (bukan bahan mentah per meter lari/roll).
   - Mendukung toggle **Stok Tanpa Batas (Unlimited Stock)** untuk produk cetak kustom, jasa desain, dan produk digital.
   - Setiap mutasi penambahan stok, penjualan via Web, penjualan via POS Kasir, retur, atau penyesuaian wajib tercatat dalam tabel log **Riwayat Mutasi Stok**.

3. **Down Payment (DP) Fleksibel Per-Produk:**
   - Dikonfigurasi pada Form Produk: Merchant dapat mengaktifkan opsi DP (`is_dp_enabled: true`), memilih jenis DP (Persentase `%` atau Nominal `Rp`), dan menentukan nilai minimal DP.
   - Jika suatu produk di keranjang mengizinkan DP, pelanggan di Website maupun kasir di POS dapat memilih opsi: **"Bayar Lunas (100%)"** atau **"Bayar Uang Muka (DP)"**.
   - Pelunasan sisa tagihan dapat dilakukan melalui Member Area Pelanggan (Website) atau pelunasan langsung di Kasir POS sebelum barang diambil/dikirim.

4. **Sistem Checkout Terpadu (Menggantikan Direct WA & Mock VA):**
   - Menghapus tombol direct `wa.me` sebagai tombol beli utama di PDP.
   - Menghapus simulasi statis Virtual Account dummy (`#btn-simulate-gateway-paid`).
   - Menerapkan alur **Checkout Terpadu Resmi**:
     1. Pembayaran Online Otomatis via **Payment Gateway DOKU** (QRIS Dinamis, Virtual Account Bank, E-Wallet).
     2. Pembayaran Manual via **Transfer Bank** (dengan instruksi nomor rekening resmi & konfirmasi mutasi).
     3. Pembayaran Kasir / Bayar di Tempat (**COD**) khusus kurir lokal toko yang diizinkan.

5. **Integrasi Ekspedisi Resmi (KiriminAja & Kurir Lokal Toko):**
   - Kurir Nasional Otomatis: Menggunakan agregator logistik **KiriminAja** (JNE, J&T, SiCepat, Anteraja, Pos Indonesia) dengan kalkulasi ongkos kirim otomatis berdasarkan berat riil vs berat volumetrik paket $(P \times L \times T) \div 6.000$.
   - Kurir Lokal Toko: Tarif manual per Satu Desa (flat/gratis) dan Satu Kecamatan, melayani pengantaran kilat armada toko sendiri.

6. **Sistem Komisi Affiliate Shortlink Terukur:**
   - Besaran komisi affiliate dapat diatur pada 2 tingkatan: **Per-Produk** (prioritas tertinggi) dan **Per-Kategori** (fallback), dengan default fallback global toko.
   - Cookie referral disimpan selama **30 hari** pada peramban calon pembeli.
   - **Aturan Pencairan Komisi**: Komisi referral **HANYA BERPINDAH DARI STATUS 'PENDING' KE 'ACTIVE' (DAPAT DICATAT/DITARIK)** apabila status pesanan telah mencapai **`COMPLETED` (Selesai)** dan status pembayaran **`PAID` (Lunas)**. Jika pesanan dibatalkan atau direfund, komisi otomatis hangus (`CANCELLED`).

---

## BAGIAN 3: Spesifikasi Detail Isi & Fungsi Setiap Menu

### Menu 1: Storefront / Etalase Pembeli (`index.html` & `js/buyer-store.js`)
1. **Modal Popup Promosi Interaktif (Prioritas Utama):**
   - Muncul otomatis saat pembeli mengakses toko web.
   - Dilengkapi parameter: gambar banner promo, judul, deskripsi singkat, tombol CTA menuju produk/kategori tertentu, tombol close `[✕]`, dan pengaturan waktu jeda kemunculan (`delay_seconds`).
   - Menggunakan pengaman `sessionStorage` (`has_seen_promo_popup`) agar tidak muncul berulang kali mengganggu pembeli dalam 1 sesi browsing.
2. **Modul Flash Sale Real-Time:**
   - Menampilkan countdown timer berjalan mundur (*hours : minutes : seconds*).
   - Menampilkan *progress bar* kuota stok promo (misal: "Terjual 80% - Sisa 4 slot").
   - Menampilkan harga promo coret. Ketika waktu habis atau stok habis, harga otomatis kembali normal tanpa reload halaman.
3. **Pencarian, Filter & Sorting Lengkap:**
   - Pencarian cerdas dengan autocomplete suggestion & mobile search drawer.
   - Filter bertingkat: Kategori Utama, Sub-Kategori, dan Slider/Input Rentang Harga (Harga Minimum s/d Harga Maksimum).
   - Opsi Pengurutan (*Sorting*): Produk Terbaru, Terlaris (*Sales Count*), Harga Terendah, dan Harga Tertinggi.
   - Fitur **Wishlist (Favorit)** & **Recently Viewed Products (Terakhir Dilihat)** tersimpan di `localStorage`.

### Menu 2: Halaman Detail Produk / PDP & Kalkulator (`product.html`, `js/pdp.js`, `js/pricing-calculator.js`)
1. **Perbaikan Engine Kalkulator (`js/pricing-calculator.js`):**
   - Mengaktifkan kembali dan menyempurnakan `price_type = 4 (Paket Promosi / Grosir Tier)`.
   - Memastikan seluruh variasi dan add-ons (wajib / multi-pilihan bebas) terkalkulasi presisi tanpa bug pembulatan desimal.
2. **Penyesuaian Antarmuka PDP untuk 4 Tipe Produk:**
   - **`FISIK_CETAK`**: Menampilkan konfigurator PxL, bahan, finishing, peringatan berat pengiriman, dan kotak informasi instruksi: *"File desain dikirimkan via WhatsApp setelah invoice diterbitkan"*.
   - **`DIGITAL`**: Menyembunyikan form ukuran/berat pengiriman; menampilkan badge *"Produk Digital - Tautan unduhan instan aktif setelah pembayaran terverifikasi"*.
   - **`JASA`**: Menampilkan form input teks/catatan instruksi kustom pekerjaan dari pelanggan.
   - **`SUBSCRIPTION`**: Menampilkan radio pilihan siklus tagihan (Bulanan vs Tahunan) dengan kalkulasi diskon periode.
3. **Badge Opsi Down Payment (DP):**
   - Jika produk memiliki `is_dp_enabled: true`, PDP menampilkan badge informasi: *"Bisa DP Mulai Rp ... / ...%"*.
4. **Tombol Beli Mengarah ke Checkout Terpadu:**
   - Tombol "+ Keranjang" menambahkan item ke Cart Drawer.
   - Tombol "Beli Sekarang" langsung membuka halaman/modal Checkout Terpadu dengan rincian item terpilih (bukan lagi tautan `wa.me`).

### Menu 3: Keranjang, Checkout Terpadu & Member Area Pelanggan
1. **Alur Keranjang & Checkout Terpadu:**
   - Manajemen Multi-Alamat: Pembeli dapat memilih alamat tersimpan atau input alamat baru (Provinsi, Kota/Kabupaten, Kecamatan, Kode Pos).
   - Logika Kondisional Kurir: Jika seluruh keranjang berisi produk `DIGITAL` atau `JASA`, bagian pilihan ekspedisi otomatis disembunyikan (*free shipping non-fisik*).
   - Opsi Ekspedisi: Memilih layanan kurir otomatis via KiriminAja (JNE, J&T, SiCepat) atau Kurir Lokal Toko (Satu Desa / Kecamatan) beserta ongkir real-time.
   - Kupon Voucher: Form input kode voucher belanja dengan validasi minimal belanja, masa berlaku, dan kuota pemakaian.
   - Perhitungan Pajak (PPN %): Otomatis ditambahkan ke ringkasan tagihan jika toko mengaktifkan PPN.
   - Opsi Pembayaran: Radio pilihan **"Bayar Lunas (100%)"** atau **"Bayar DP (Uang Muka)"** (jika produk memenuhi syarat), dilanjutkan pemilihan metode pembayaran DOKU / Transfer Bank / QRIS.
2. **Member Area Pelanggan (Customer Portal):**
   - Sistem Otentikasi: Login via Email/Password dan opsi Login Cepat via Google OAuth.
   - Riwayat Pesanan: Daftar pesanan aktif, pelacakan resi ekspedisi, dan tombol **"Pelunasan Sisa DP"** jika pesanan berstatus `DP_PAID`.
   - Halaman Unduhan Digital: Tautan unduhan aman untuk produk bertipe `DIGITAL` dengan pembatasan kuota unduhan (*download limit*).
   - Kelola Subscription: Informasi masa aktif langganan dan tombol perpanjangan.
   - **Dashboard Affiliate Pelanggan**:
     * Pembuatan link referral instan (*Short URL Generator*).
     * Statistik real-time: Jumlah Klik, Konversi Pesanan, dan Total Komisi (Tertunda vs Siap Cair).
     * Form data rekening bank / e-wallet untuk pencairan dana.
     * Tombol pengajuan penarikan saldo (*Request Withdrawal*).

### Menu 4: Seller Center - Form Produk, Kategori, Stok & Pesanan (`admin.html`)
1. **Perluasan Form Produk (`js/product-form.js`):**
   - Pilihan 4 Tipe Produk di Step 1: `Fisik Cetak`, `Produk Digital`, `Layanan Jasa`, dan `Langganan (Subscription)`.
   - Konfigurasi Produk Digital: Upload berkas master / input tautan aman Google Drive, serta pembatasan kuota download per transaksi.
   - Konfigurasi Down Payment (DP): Toggle aktifkan DP, jenis DP (Persen / Nominal), dan nilai minimal DP.
   - Konfigurasi Affiliate Per-Produk: Input nominal/persentase komisi khusus untuk produk tertentu.
2. **Perluasan Manajemen Kategori (`js/category-manager.js`):**
   - Input persentase Komisi Affiliate Per-Kategori (sebagai fallback komisi produk).
3. **Modul Baru: Riwayat Mutasi Stok (`#view-stock-mutation`):**
   - Tabel catatan historis pergerakan stok: Tanggal, Nama Produk/Varian, Jenis Mutasi (Masuk, Keluar Web, Keluar POS, Koreksi Stok, Retur), Kuantitas, Sisa Stok, dan Keterangan/No. Faktur.
4. **Manajemen Pesanan dengan 3 Lapis Status Terpadu (`#view-orders`):**
   - **`payment_status`**:
     * `UNPAID`: Belum ada pembayaran masuk.
     * `DP_PAID`: Uang muka sudah diterima (menampilkan rincian nominal masuk & sisa tagihan yang belum dibayar).
     * `PAID`: Pembayaran lunas 100%.
     * `REFUNDED`: Dana dikembalikan ke pelanggan.
   - **`order_status`**:
     * `PENDING` $\rightarrow$ `WAITING_PAYMENT` $\rightarrow$ `PAID` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPED` (dilengkapi input nomor resi pengiriman) $\rightarrow$ `DELIVERED` $\rightarrow$ `COMPLETED` (memicu pencairan komisi affiliate & membuka hak ulasan) $\rightarrow$ `CANCELLED`.
   - **`production_status` (Sub-status operasional percetakan saat `PROCESSING`):**
     * `WAITING_FILE` (Menunggu pengiriman file cetak via WA).
     * `DESIGN_QUEUE` (Pemeriksaan file / antrean desain grafis).
     * `PRINTING` (Proses cetak mesin produksi).
     * `FINISHING` (Proses laminasi, cutting, keling mata ayam, jilid).
     * `READY_TO_SHIP` (Selesai dipacking, siap dijemput kurir / diambil di toko).

### Menu 5: Aplikasi Kasir POS (`#view-pos-cashier` di `admin.html` & `js/admin-app.js`)
1. **Dukungan Pembayaran Down Payment (DP) di Kasir:**
   - Kasir dapat memilih mode "Bayar Lunas" atau "Terima Uang Muka (DP)".
   - Menghitung sisa piutang pelanggan dan mencatatnya ke dalam database faktur.
2. **Pencetakan Struk Thermal Kasir Informatif:**
   - Desain struk thermal 58mm / 80mm mencantumkan: Nomor Faktur, Nama Kasir, Rincian Item/Ukuran PxL, Nominal Pembayaran (Lunas atau DP), Sisa Tagihan (jika DP), dan QR Code verifikasi.
3. **Manajemen Pelanggan Cepat (Quick Add Customer):**
   - Tombol "+ Pelanggan Baru" langsung dari layar kasir tanpa perlu berpindah ke modul CRM.
4. **Integrasi IndexedDB & Shared Invoice Counter:**
   - Menghubungkan kasir dengan `offline-db.js` agar transaksi kasir tetap dapat berjalan lancar saat koneksi offline.
   - Format nomor faktur terpadu yang sinkron antara transaksi Web (`A-...`) dan Kasir POS (`B-...`) melalui `InvoiceGenerator`.

### Menu 6: Marketing, Kupon, Affiliate Admin & CMS Terpadu
1. **Pengaturan Modal Popup Promosi:**
   - Form upload banner, input tautan tujuan, pengaturan jeda detik, dan toggle aktif/nonaktif di `promo-manager.js`.
2. **Pengaturan Flash Sale & Kupon Voucher:**
   - Penjadwalan tanggal & jam mulai/selesai Flash Sale.
   - Generator kupon diskon (potongan flat / persen, minimal belanja, batas kuota pemakaian).
3. **Menu Manajemen Affiliate Admin & Komisi Produk:**
   - **Komisi Afiliasi Produk (Product-Level Commission)**: Pengaturan komisi khusus per-produk di menu Tambah/Edit Produk (`#section-product-affiliate-commission` di `js/product-form.js` & `js/db.js`) dengan 2 mode terpadu: **Komisi Tunggal** dengan selector unit Persen (`%`) / Nominal (`Rp`), pengaturan Minimal Jumlah Pesanan (Min. Qty) paket dengan pembagian otomatis per satuan barang, dan **Komisi Grosir** dengan pilihan unit (`%` / `Rp`), clean empty state tanpa nilai default paksa (baris 1 `Min. Qty = 1`, baris 2+ terkunci `readonly` dan otomatis rantai `Max. Qty sebelumnya + 1`), proteksi batas komisi terhadap harga produk (clamp 100% persen & nominal Rp < harga jual), proteksi kuantitas terhadap stok fisik produk yang tersedia, dilengkapi toggle aktivasi reaktif, tooltip popover profesional, syarat minimal nilai order belanja, serta ringkasan konversi setara secara real-time.
   - **Aturan Komisi Global & Fallback**: Jika komisi khusus per-produk dinonaktifkan, perhitungan komisi afiliator otomatis mengacu pada aturan komisi global di menu Marketing > Affiliate atau komisi per-kategori.
   - Tabel data affiliator, statistik performa referral per member.
   - Daftar permohonan penarikan saldo (*Withdrawal Requests*), verifikasi transfer, dan tombol persetujuan (*Approve & Mark Paid*).
4. **Modul CMS & Manajemen Konten Website:**
   - **Blog & Artikel SEO**: Editor artikel percetakan, tips desain, slug otomatis, meta title & meta description untuk optimasi Google.
   - **Banner Slider**: Pengelolaan slide banner promosi utama etalase toko.
   - **Testimoni & Portofolio**: Galeri hasil cetak dan testimoni klien terpercaya.
   - **Halaman Statis (Custom Pages)**: Editor halaman Tentang Kami, Syarat & Ketentuan Layanan, serta Kebijakan Privasi Toko.

### Menu 7: Pengaturan Toko & Integrasi API (`settings.html`, `js/settings.js`)
Menambahkan antarmuka formulir pengaturan terstruktur:
1. **Tab Payment Gateway (DOKU & Rekening Manual):**
   - Pengaturan DOKU: Client ID, Secret Key, Shared Key, Toggle Mode Sandbox vs Production.
   - Rekening Manual & QRIS: Tambah daftar rekening bank (BCA, Mandiri, BRI, BNI) dan upload file gambar QRIS toko.
2. **Tab Ekspedisi & Kurir (KiriminAja & Lokal):**
   - Pengaturan KiriminAja: API Key, Lokasi Kecamatan Asal (*Origin Code*), pilihan kurir ekspedisi yang diaktifkan.
   - Pengaturan Kurir Toko: Tarif kurir satu desa, satu kecamatan, dan toggle layanan COD.
3. **Tab Pajak Transaksi (PPN):**
   - Toggle aktifkan PPN dan persentase tarif pajak (misal: 11%).
4. **Tab WhatsApp Gateway Fonnte & Notifikasi Otomatis:**
   - Input API Token Fonnte & status koneksi device WhatsApp toko.
   - Editor 6 Template Pesan WhatsApp Otomatis:
     1. *Pesanan Dibuat (Menunggu Pembayaran / DP)*.
     2. *Instruksi Pengiriman File Desain Cetak (Khusus Produk Fisik Cetak)*.
     3. *Pembayaran Berhasil Dikonfirmasi (Lunas / DP Masuk)*.
     4. *Perubahan Status Produksi (Sedang Dicetak / Finishing)*.
     5. *Pesanan Dikirim (Disertai Nomor Resi Pelacakan)*.
     6. *Pesanan Selesai & Permintaan Ulasan Bintang*.
   - Fitur **WhatsApp Broadcast Massal**: Pengiriman pesan siaran promo berkala ke kontak pelanggan tersimpan dengan antrean (*queue*) dan jeda acak (*delay interval*) untuk mencegah pemblokiran nomor WhatsApp.

### Menu 8: Refactoring Helper & Persiapan Migrasi Backend
1. **Penyatuan Helper Duplikat (`js/utils.js`):**
   - Mengekstrak fungsi yang terduplikasi di banyak berkas (`formatIDR`, `escapeHtml`, `hexToRgba`, kalkulator persentase) ke dalam satu pustaka utilitas tunggal `js/utils.js`.
2. **Pembaruan Skema Prisma ORM (`prisma/schema.prisma`):**
   - Menambahkan kolom-kolom baru sesuai spesifikasi di atas (`product_type`, `is_dp_enabled`, `dp_type`, `dp_value`, `affiliate_commission_type`, `affiliate_commission_rate`, tabel `StockMutation`, tabel `PopupPromo`, tabel `AffiliateProfile`, tabel `AffiliateWithdrawal`, tabel `CMSArticle`, tabel `VoucherCode`).
3. **Penyusunan REST API Server / Jembatan Migrasi:**
   - Menyediakan endpoint REST API terstruktur untuk menjembatani front-end dengan database PostgreSQL/Prisma, serta menyiapkan rute migrasi bertahap menuju arsitektur Laravel 12 + React 18 (Inertia.js v2) di masa depan.

---

## BAGIAN 4: Master Checklist Urutan Pengerjaan (Actionable Phases)

> [!NOTE]
> Developer / Agent **WAJIB** mencentang `[x]` pada daftar tugas di bawah ini secara bertahap saat menyelesaikan setiap fase pengerjaan. Jangan menandai selesai sebelum verifikasi sintaks via Node.js dan git commit/push berhasil dilakukan.

- [x] **TAHAP 1: Fondasi Helper Terpusat, Pembersihan Dead Code & Bridge Warna Dinamis**
  - [x] Pembersihan file yatim: Hapus `js/app.js` dan `src/lib/pricing-calculator.js`.
  - [x] Inisialisasi dokumen master PRD kompas proyek di `docs/PRD_MASTER.md`.
  - [x] Pembuatan `js/utils.js` (helper tunggal: `formatIDR`, `escapeHtml`, `hexToRgba`, dsb.).
  - [x] Hubungkan `js/utils.js` ke seluruh file HTML aktif (`index.html`, `product.html`, `admin.html`, `settings.html`, `theme-editor.html`).
  - [x] Penguatan CSS variable bridge tema di `css/admin.css` & `css/style.css` agar 100% elemen interaktif terikat ke `--color-primary` dan `--color-secondary`.
  - [x] Perbaikan menyeluruh pengikatan warna tema dinamis (Aktif, Selected, Focus, Hover) pada Sub-Navbar, Radio Cards, Action Buttons, Margin Badges, dan Sidebar Admin.
  - [x] Sinkronisasi 15 titik kebocoran warna tema brand (Step 1, Step 2, Modal Pop-up, FAB Preview, dan Pratinjau Kartu Produk) 100% terikat ke variabel CSS (--color-primary, --color-primary-hover, --color-primary-subtle).
  - [x] Sinkronisasi total warna hover, focus, dan active pada seluruh tombol CTA dan tautan aksi dengan turunan dinamis (--color-primary-hover, color-mix 85% primary + 15% black, tanpa jatuh ke hijau default).
  - [x] Pemulihan fungsi event binding Step 2 (Variasi Produk, Layanan Extra, Variasi 2/3/4, Grosir, Kelipatan) pada modul `js/product-form.js`.
  - [x] Pemisahan tegas layout "List Variasi Produk" dan "Layanan Extras" (menghilangkan overlap negatif margin & tabrakan scrollbar), pembaharuan judul bersih "List Variasi Produk", pemindahan teks keterangan Layanan Extras ke dalam Tooltip interaktif (ikon ?), serta penghapusan total bingkai/outline ring kotak luar pada checkbox dan radio button.

- [ ] **TAHAP 2: Storefront Overhaul (Modal Popup Promosi, Flash Sale Real-Time & Filter/Sorting Lengkap)**
  - [ ] Implementasi modal pop-up promosi otomatis dengan delay detik, banner, tautan CTA, dan pengaman `sessionStorage` di `js/buyer-store.js` dan `index.html`.
  - [ ] Implementasi modul Flash Sale interaktif (countdown timer berjalan mundur, progress bar kuota, dan harga coret otomatis).
  - [ ] Penyempurnaan filter rentang harga (Min-Max) dan pengurutan (Terbaru, Terlaris, Termurah, Termahal).
  - [ ] Integrasi Wishlist (Favorit) dan Riwayat Terakhir Dilihat (*Recently Viewed*).

- [ ] **TAHAP 3: PDP & Pricing Engine Upgrade (4 Tipe Produk, Rumus Paket, Badge DP, Checkout Interaktif)**
  - [x] Perbaikan formula `price_type = 4 (Paket Promosi)` pada `js/pricing-calculator.js`.
  - [ ] Penyesuaian antarmuka PDP (`product.html` & `js/pdp.js`) untuk 4 tipe produk (`FISIK_CETAK`, `DIGITAL`, `JASA`, `SUBSCRIPTION`).
  - [ ] Penambahan badge opsi Down Payment (DP) jika produk mengizinkan DP.
  - [ ] Pengalihan tombol "Beli Sekarang" dan "+ Keranjang" dari URL `wa.me` langsung ke sistem checkout terpadu.

- [ ] **TAHAP 4: Sistem Keranjang, Checkout Terpadu (Multi-Alamat, KiriminAja, DOKU, DP) & Member Area Pelanggan**
  - [ ] Pembuatan modul keranjang belanja dan checkout multi-step di web.
  - [ ] Pengaturan multi-alamat pengiriman dan kalkulasi ongkir (KiriminAja vs Kurir Lokal).
  - [ ] Pemilihan mode pembayaran Lunas (100%) vs Bayar DP (Uang Muka).
  - [ ] Integrasi instruksi pembayaran DOKU, Transfer Bank, dan QRIS.
  - [ ] Pembuatan Member Area Pelanggan (Login OAuth, Riwayat Pesanan & Pelunasan DP, Unduhan Digital, Dashboard Affiliate).

- [ ] **TAHAP 5: Form Produk, Kategori, Riwayat Mutasi Stok & Manajemen Pesanan 3 Lapis Status**
  - [x] Penyempurnaan **Program Promo (Promo Bulanan)** di `js/product-form.js`: Pembersihan ikon dekoratif, penamaan baku "Promo Bulanan", serta kalkulasi real-time ringkasan konversi potongan nominal Rp vs persen (%) terhadap harga dasar produk.
  - [x] Implementasi & Penyempurnaan sistem **Komisi Afiliasi Produk** di `js/product-form.js`, `js/db.js`, & `css/admin.css` (2 mode: **Komisi Tunggal** & **Komisi Grosir** dengan selector unit `%` / `Rp`, minimal Qty paket & pembagian otomatis per satuan, helper text kalkulasi per pcs, baris grosir terkunci otomatis `readonly` (+1 dari baris sebelumnya), tombol tambah tingkat grosir dengan validasi baris terakhir, proteksi komisi terhadap harga produk, proteksi rentang order terhadap stok fisik tersedia, toggle aktivasi reaktif, tooltip popover informatif, syarat minimal nilai order, validasi ketat, dan auto-save draft).
  - [x] **Penyempurnaan Form Produk (Validasi Inline Komisi Grosir, Perbaikan Toggle P × L & Tooltip SaaS, Fitur Saran Ukuran Maksimal 6, dan Pemulihan Persistensi Label Khusus Step 1)**:
    - **Validasi Inline Komisi Grosir (`js/product-form.js`)**: Menghapus toast pop-up mengambang merah pada penambahan tingkat komisi grosir, digantikan dengan indikator validasi inline langsung pada input `Max. Qty` (`border-red-500 focus:border-red-500`, teks merah kecil `"Wajib diisi"` atau `"Min. ${lastMin}"`, autofocus, dan auto-clear real-time saat pengguna mengetik angka valid).
    - **Perbaikan Blok Warna Toggle P × L & Tooltip SaaS (`css/admin.css` & `js/product-form.js`)**: Memperketat selektor toggle switch di `css/admin.css` agar `var(--color-primary)` hanya mengenai track toggle switch (`div.w-9`, `div.w-10`, `div.toggle-track`, dsb.), mengisolasi `<label>` toggle terpisah dari teks judul, dan memindahkan deskripsi panjang batas minimal harga jual & HPP ke dalam Tooltip (`?`) ringkas berstandar SaaS.
    - **Fitur Saran Ukuran Cepat (Maksimal 6 Ukuran) (`js/product-form.js` & `js/db.js`)**: Menambahkan sub-fitur preset ukuran (P × L) yang sering dipesan pada Komponen Utama Ukuran P × L lengkap dengan Tooltip (`?`), counter `0 / 6`, deretan chip ukuran `[P x L] ×`, auto-lock input saat mencapai 6 item, persistensi database & draft, serta chip interaktif di Mini PDP & Drawer Uji Coba yang otomatis mengisi input P × L dan menghitung harga real-time saat diklik.
    - **Pemulihan Persistensi Label Khusus Step 1 (`js/product-form.js` & `js/db.js`)**: Memperbaiki bug reset otomatis Label Khusus saat berpindah menu admin; memastikan `syncStateFromDOM()` tidak menimpa data saat Step 1 tersembunyi, menyimpan draft seketika (`saveDraftToStorage()`) pada setiap aksi label (ketik, preset chip, hapus, toggle), memulihkan nilai label dan status kuncian chip secara 100% saat form dimuat ulang, serta membersihkan warna statis emerald menjadi variabel tema CSS (`--color-primary`, `--color-primary-subtle`).
  - [x] **Penyempurnaan Form Produk Tahap 2 (Tutup Otomatis Batas Minimal P × L Saat OFF, Banner Peringatan Uji Coba Kompak di Dalam Modal Pratinjau, Desain Pratinjau Tanpa Radius & Bottom Split Bar Baru, serta Otomatisasi Shadcn Select / Accordion di Drawer)**:
    - **Tutup Otomatis Batas Minimal P × L Saat OFF (`js/product-form.js`)**: Kontainer input batas minimal harga jual (`#container-min-price-inputs`) dan modal/HPP (`#container-min-hpp-inputs`) disembunyikan penuh dengan class `hidden` saat toggle OFF (`!checked`), dan otomatis dibuka saat toggle ON (`checked`) tanpa `opacity-40` maupun `pointer-events-none`.
    - **Peringatan Mode Uji Coba Kompak di Dalam Pratinjau (`js/product-form.js`)**: Menghapus `App.showToast(...)` yang melayang keluar menutupi header, digantikan banner peringatan inline kompak (`#preview-test-mode-alert` & `#preview-test-mode-alert-mob`) tepat di bawah tab Pratinjau / Uji Coba dengan tombol tutup `×` dan auto-hide 6 detik.
    - **Pratinjau Detail Produk (Mini PDP) Tanpa Radius & Split Bottom Bar Baru (`js/product-form.js` & `css/admin.css`)**: Menghilangkan border-radius melengkung (`rounded-none` / `border-radius: 0 !important;`) pada kontainer kartu Mini PDP, foto produk, drawer sheet, dan bottom bar. Merombak footer bar menjadi layout modern full-bleed split bar (sisi kiri 42% latar putih berisi ikon Chat WhatsApp dan Tambah Keranjang dipisah garis vertikal pendek dalam `--color-primary`, sisi kanan 58% tombol utama `Beli Sekarang` edge-to-edge dengan warna `--color-primary`).
    - **Otomatisasi Pintar Tampilan Variasi di Drawer Uji Coba (`js/product-form.js` & `css/admin.css`)**: Logika cerdas perenderan grup variasi di drawer pemilihan variasi:
      - **Kondisi 1 (Mode Shadcn UI Custom Select Popover)**: Terpicu saat 4 variasi aktif dan semua variasi memiliki > 10 opsi. Menggunakan custom trigger button + popover dropdown bersih dengan centang aktif `--color-primary`.
      - **Kondisi 2 (Mode Accordion dengan Chip Opsi)**: Terpicu saat (4 variasi aktif & semua variasi memiliki <= 10 opsi) ATAU (2–3 variasi aktif & salah satu variasi memiliki > 15 opsi). Menampilkan header baris klik (`[Nama Variasi] (Nilai Terpilih) >`) yang bisa di-toggle collapse/expand dengan body berisi tombol chip opsi asli.
      - **Kondisi Default**: Menampilkan daftar variasi dan chip opsi terbuka standar untuk kondisi lainnya.
  - [x] **Penyempurnaan Form Produk & Drawer Uji Coba Bagian 1 (`js/product-form.js`, `css/admin.css`, `admin.html`)**:
    - **Penyeragaman Tooltip & Pembersihan Native Tooltip (`js/product-form.js` & `css/admin.css`)**: Menghapus atribut HTML `title` dan `aria-label` yang memicu native browser tooltip pada Komisi Afiliasi, Min. Qty, Min. Nilai Pesanan, Layanan Extras, dan Input Ukuran P × L. Menyeragamkan seluruh pop-up tooltip (`w-56 sm:w-64`, `p-2.5`, `bg-slate-900 text-white text-[11px] leading-relaxed rounded-md shadow-lg`) identik dengan seksi Pengiriman.
    - **Zero Border & Zero Radius pada Input Ukuran dan Qty di Drawer (`js/product-form.js` & `css/admin.css`)**: Menghilangkan seluruh garis border dan sudut lengkung pada input ukuran P × L (`#input-shopee-dim-p`, `#input-shopee-dim-l`) serta stepper Qty (`#btn-shopee-qty-minus`, `#input-preview-test-qty`, `#btn-shopee-qty-plus`) menjadi flat clean surface (`border-0 !important; border-radius: 0 !important; outline: none; shadow-none;`).
    - **Perbaikan Kursor Tombol Minus Qty (`updateDrawerQtyButtonsState`)**: Menyinkronkan status `disabled` dan kursor tombol minus secara dinamis; ketika Qty > minOrderQty, class `opacity-40 cursor-not-allowed` langsung dicopot dan tombol menjadi `cursor-pointer`, serta sebaliknya jika Qty mencapai batas minimal.
    - **Sistem Accordion Variasi Single-Open & Smart Auto-Advance**: Menjadikan pembukaan akordeon variasi di drawer bersifat eksklusif (hanya maksimal 1 akordeon terbuka dalam satu waktu), serta otomatis membuka akordeon variasi berikutnya begitu salah satu opsi varian dipilih pengguna.
  - [x] **Penyempurnaan Form Produk Bagian 2: Input Spesifikasi di Step 2 & Bottom-Sheet Drawer "Spesifikasi" di Pratinjau Detail Produk (`js/product-form.js`, `js/db.js`, `css/admin.css`, `admin.html`)**:
    - **Atribut State & Input Spesifikasi di Step 2 (`js/product-form.js` & `js/db.js`)**: Menambahkan atribut state `brand`, `product_origin`, `warranty_period` (default: "Tidak Ada Garansi"), `warranty_type`, `is_preorder`, `preorder_days` pada `primaryState`, `resetFormState()`, `loadProductForEdit()`, dan `syncStateFromDOM()`. Di kartu Step 2 (`#card-step2-others`), menambahkan input teks Merek (`#input-product-brand`), dropdown Asal Produk (`#select-product-origin`), dropdown Masa Garansi (`#select-warranty-period`), dropdown kondisional Jenis Garansi (`#container-warranty-type` & `#select-warranty-type`), toggle & estimasi hari Pre-Order (`#toggle-is-preorder` & `#input-preorder-days`), serta info read-only lokasi pengiriman toko seller (`Dikirim Dari` otomatis dari `DB.getSettings()`). Seluruh data terhubung dan dipersistensikan penuh di `js/db.js` (`addProduct` dan `updateProduct`).
    - **Baris Pemicu "Spesifikasi" di Pratinjau Mini PDP (`js/product-form.js`)**: Menempatkan baris pemicu interaktif `.btn-open-spec-drawer` tepat di atas seksi Deskripsi Produk dengan label "Spesifikasi", teks ringkasan atribut `(Stok, Merek, Garansi, Dikirim Dari...)`, dan ikon chevron kanan (`bi-chevron-right`). Dapat diklik pada mode Pratinjau maupun mode Uji Coba (di desktop aside maupun mobile preview sheet).
    - **Desain & Aturan Tampil Kondisional Drawer Spesifikasi (`js/product-form.js` & `css/admin.css`)**: Membangun bottom-sheet drawer spesifikasi di dalam `#preview-scoped-modal-root` (desktop) dan `#preview-scoped-modal-root-mob` (mobile) dengan header judul rata tengah `"Spesifikasi"` dan border bawah tegas, body 2 kolom (label kiri 42% `text-slate-500`, nilai kanan 58% `text-slate-800 font-medium`, dipisahkan `divide-y divide-slate-100`) yang menampilkan secara kondisional: Stok (Tersedia vs Habis merah), Min. Pembelian (hanya jika > 1), Harga Grosir (hanya jika ada tier valid), Kelipatan Pembelian (hanya jika > 1), Merek (nilai atau "-"), Masa Garansi (pilihan seller atau "Tidak Ada Garansi"), Jenis Garansi (hanya jika masa garansi bukan "Tidak Ada Garansi"), SKU Induk (hanya jika tidak kosong), Pre-Order (hanya jika aktif), Asal Produk (nilai atau "-"), dan Dikirim Dari (kota toko seller).
    - **Footer Tombol CTA "Ok" & Animasi Halus (`js/product-form.js` & `css/admin.css`)**: Tombol penuh edge-to-edge `#btn-close-spec-drawer` berlabel `"Ok"` dengan sudut tegas `rounded-none`, warna dinamis `var(--color-primary)` (hover `var(--color-primary-hover)`), dan penutupan mulus saat tombol "Ok" atau area backdrop diklik.
  - [x] **Penyempurnaan Form Produk Bagian 3: Scoping Lebar Drawer & Modal Uji Coba Sesuai Pratinjau, Smart Tooltip Clamping Mobile, Input Manual Asal Produk & Masa Garansi, Serta Hirarki Lokasi Otomatis Seller vs Buyer (`js/product-form.js`, `js/utils.js`, `js/db.js`, `js/pdp.js`, `css/admin.css`, `admin.html`)**:
    - **Scoping Lebar Drawer & Overlay Simulasi Sesuai Lebar Kontainer Pratinjau (`js/product-form.js` & `css/admin.css`)**: Memindahkan `#preview-scoped-modal-root` (desktop) dan `#preview-scoped-modal-root-mob` (mobile) ke dalam wrapper bingkai pratinjau (`<div class="w-full max-w-[260px] relative overflow-hidden">`) berdampingan langsung dengan `#card-live-preview-box` dan `#mobile-card-preview-container`. Menerapkan aturan CSS `position: absolute !important; inset: 0 !important; width: 100% !important; max-width: 100% !important; overflow: hidden !important;` pada `#preview-scoped-modal-root`, `#preview-scoped-modal-root-mob`, `.mini-pdp-card`, serta `.mini-pdp-drawer-root`, `.spec-drawer-sheet`, dan `.mini-pdp-drawer-sheet`, sehingga di layar HP sekalipun seluruh drawer dan modal uji coba terkunci presisi 100% mengikuti lebar kartu pratinjau (tidak pernah melebar 100vw).
    - **Smart Boundary Clamping & Wrap Tooltip Mobile (`js/product-form.js` & `css/admin.css`)**: Menerapkan fungsi helper `clampTooltipToViewport` yang secara dinamis menghitung `getBoundingClientRect()` terhadap `window.innerWidth`. Menggeser posisi tooltip secara otomatis jika sisi kiri `< 12px` (`shiftX = 12 - left`) atau jika sisi kanan `> window.innerWidth - 12px` (`shiftX = (window.innerWidth - 12) - right`). Pada `css/admin.css` `@media (max-width: 640px)`, menetapkan `max-width: calc(100vw - 32px) !important; white-space: normal !important; word-break: break-word !important;` sehingga seluruh tooltip (`.admin-help-tooltip` dan `.tooltip-popover`) tidak ada yang terpotong keluar batas layar HP.
    - **Asal Produk Input Teks Manual & Masa Garansi Fleksibel (`js/product-form.js` & `js/db.js`)**:
      - Mengubah Asal Produk menjadi input teks manual (`#input-product-origin`, tinggi `h-9`, `rounded-md`, placeholder `"Contoh: Indonesia, Lokal, Impor..."`). Tampil apa adanya jika diisi seller atau `"-"` jika dikosongkan.
      - Mengubah Masa Garansi menjadi 1 baris kompak: Dropdown satuan/status (`#select-warranty-unit`: `Tidak Ada Garansi`, `Hari`, `Bulan`, `Tahun`, `Seumur Hidup`) + input angka durasi (`#input-warranty-duration`). Input durasi hanya tampil jika unit `Hari`, `Bulan`, atau `Tahun`.
      - Menyimpan `warranty_unit`, `warranty_duration`, dan gabungan `warranty_period` ke `primaryState`, `localStorage`, serta database (`createProduct` & `updateProduct`), lengkap dengan parser `parseWarrantyPeriod` saat memuat data produk lama untuk edit.
    - **Penghapusan "Dikirim Dari" di Form, Petunjuk Lokasi Toko di Pengiriman, & Hirarki Lokasi Otomatis Seller vs Buyer (`js/utils.js`, `js/product-form.js`, `js/pdp.js`, `js/db.js`)**:
      - Menghapus kotak info statis "Dikirim Dari" dari kartu `Lainnya & Konfigurasi Tambahan` (`#card-step2-others`).
      - Menambahkan baris informasi ramah pengguna di bagian atas kartu Pengiriman (`#card-step2-shipping`): *"Lokasi asal pengiriman otomatis mengikuti lokasi toko Anda. Pastikan lokasi telah diaktifkan dan dilengkapi pada menu Akun / Pengaturan Toko"* lengkap dengan link cepat menuju `settings.html`.
      - Membangun helper terpusat `Utils.formatDynamicSellerLocation(sellerLocation, buyerLocation)` di `js/utils.js` yang mengimplementasikan 6 aturan hirarki perbandingan lokasi: (1) Luar Negara Seller $\rightarrow$ Nama Negara (`"Indonesia"`), (2) Satu Negara beda Provinsi $\rightarrow$ Provinsi (`"Jawa Timur"`), (3) Satu Provinsi beda Kota/Kabupaten $\rightarrow$ Kota/Kabupaten (`"Kab. Lamongan"`), (4) Satu Kota beda Kecamatan $\rightarrow$ Kecamatan (`"Kec. Laren"`), (5) Satu Kecamatan dengan Seller $\rightarrow$ Desa/Kelurahan (`"Desa Laren"`), dan (6) Fallback default (mode pratinjau / buyer belum login) $\rightarrow$ Kota/Provinsi toko seller yang tersimpan di pengaturan.
      - Mengintegrasikan hirarki lokasi otomatis ini pada Drawer Spesifikasi Pratinjau Mini PDP (`js/product-form.js`) dan Tab Spesifikasi Pembeli (`js/pdp.js`).
    - **Cache Version Bump**: Menaikkan versi query string aset pada `admin.html` menjadi `?v=6.3`.
  - [x] **Penyempurnaan Form Produk Bagian 4 (Tahap 1): Pemisahan Kartu & Subnavbar "Spesifikasi", Perbaikan Z-Index Subnavbar Mobile, Warna Brand pada Blok Teks & Judul Kartu, serta Input Stok Tunggal Combo "Unlimited" (`js/product-form.js`, `css/admin.css`, `admin.html`)**:
    - **Pemisahan Kartu "Spesifikasi" Mandiri (`#card-step2-specs`) & Subnavbar Step 2 (`js/product-form.js`)**: Mengeluarkan seluruh field spesifikasi (*Kondisi Produk, SKU Induk, Barcode/EAN, Merek, Asal Produk, Masa Garansi, Jenis Garansi, Pre-Order*) dari `#card-step2-others` dan menjadikannya kartu seksi mandiri baru `#card-step2-specs` tepat di antara `#card-step2-description` dan `#card-step2-others`. Menghilangkan ikon lama `bi-card-checklist` dan sub-judul lama `"Spesifikasi Tambahan & Garansi"` menjadi judul kartu standar `"Spesifikasi"`. Menambahkan tombol tab `"Spesifikasi"` pada subnavbar Step 2 (`#step2-subnav-links`) serta mendaftarkan `'card-step2-specs'` ke scrollspy `handleStep2ScrollSpy()` dan observer `initStep2SubnavObserver()`.
    - **Perbaikan Hirarki Z-Index Subnavbar & Sidebar Mobile (`css/admin.css` & `admin.html`)**: Mengubah `z-index` subnavbar `#step2-subnav`, `#step2-subnav-sticky`, `#step2-subnav-fixed`, dan `.product-form-subnav` menjadi `z-index: 25 !important;` agar berada di bawah topbar dropdown, backdrop sidebar (`z-index: 60 !important;`), dan sidebar menu mobile (`z-index: 70 !important;`), sehingga subnavbar tidak lagi menembus ke depan sidebar saat menu mobile dibuka.
    - **Warna Brand Dinamis pada Blok Teks (`::selection`) & Judul Kartu Seksi (`css/admin.css` & `js/product-form.js`)**: Mengganti seleksi teks hijau statis dengan aturan CSS dinamis `::selection` menggunakan `background-color: var(--color-primary-subtle) !important; color: var(--color-primary) !important;` (selaras dengan hover menu lembut). Menerapkan warna brand dinamis (`color: var(--color-primary) !important;`) pada seluruh judul utama kartu seksi Step 1 dan Step 2.
    - **Input Stok Produk Tanpa Variasi Combo "Unlimited" Tanpa Checkbox (`js/product-form.js`)**: Menghilangkan checkbox `#chk-unlimited-stock` lama beserta labelnya. Mengubah input `#input-stock-qty` menjadi komponen custom combobox modern (acuan Shadcn UI) dengan tombol clear `×` (`#btn-clear-stock-qty`) dan popover saran cepat `"Unlimited"`. Menyinkronkan `primaryState.is_unlimited_stock` dan `primaryState.stock`, serta memperbarui `getProductStockInfo()`, `syncStateFromDOM()`, `validateSingleStock()`, dan `validateForm()`.
    - **Standarisasi Komponen Input, Select & Accordion**: Menetapkan bahwa sistem Shadcn UI Select (`https://ui.shadcn.com/docs/components/base/select`) dan Single-Open Accordion menjadi acuan desain baku tunggal bagi seluruh tipe kontrol `input & select` dan `accordion` di aplikasi agar antarmuka konsisten dan profesional.
    - **Cache Version Bump**: Menaikkan cache query string menjadi `?v=6.4` pada `admin.html`.
  - [x] **Penyempurnaan Form Produk Bagian 5 (Tahap 1): Pemisahan 7 Kartu Mandiri Step 2, Pembersihan Garis Dobel & Garis Pemisah, Kondisional Lokasi Pengiriman, Popover "Unlimited" Stok & Maks Pembelian, serta Tabel Spesifikasi Manual (`js/product-form.js`, `js/db.js`, `js/pdp.js`, `admin.html`)**:
    - **Pemisahan 7 Kartu Mandiri Sejajar Step 2 (`js/product-form.js`)**: Memastikan ke-7 bagian utama Step 2 (`#card-step2-info`, `#card-step2-sales`, `#card-step2-shipping`, `#card-step2-promo`, `#card-step2-description`, `#card-step2-specs`, `#card-step2-others`) berstatus kartu putih mandiri (`.step2-section-card bg-white rounded-lg p-4 sm:p-6`) yang berada pada level DOM sejajar (*direct siblings*) tanpa sarang kartu (*zero nested cards*). Menyeragamkan judul kartu pengiriman menjadi ringkas `"Pengiriman"` dan kartu lainnya menjadi ringkas `"Lainnya"`.
    - **Pembersihan Garis Dobel & Garis Pemisah Berlebih (`js/product-form.js` & `css/admin.css`)**: Menghilangkan garis `border-b` pada header kartu seksi Step 1 dan Step 2 serta garis `border-t` / `border-b` pada blok pertama di bawahnya sehingga tidak ada lagi garis dobel di Informasi Penjualan dan Lainnya. Menghapus `<hr class="border-slate-100" />` dan garis pemisah horizontal antar baris input di Spesifikasi dan Penjualan, serta menghapus bingkai kotak luar ber-border pada blok `Sistem Pre-Order (PO)` untuk mencapai permukaan *clean flat*.
    - **Kondisional Tampil Lokasi Pengiriman Toko (`js/product-form.js`)**: Menghilangkan kotak info besar ber-border di kartu Pengiriman. Menggantikannya dengan pengecekan reaktif lokasi toko di `DB.getSettings()`; jika lokasi telah terisi valid dan `show_location !== false`, seluruh teks/kotak disembunyikan 100%. Jika belum diatur, menampilkan baris peringatan ringkas berlabel `"Lokasi Belum Diatur"` lengkap dengan tautan cepat menuju `settings.html`.
    - **Perbaikan Popover Saran "Unlimited" Stok & Maks Order Serta Pembersihan Teks Bantuan (`js/product-form.js`)**: Menghapus teks instruksi bantuan kecil di bawah kedua input. Menyeragamkan nilai rekomendasi menjadi `"Unlimited"` dengan popover Shadcn UI (`z-50`, posisi `absolute`, `rounded-md`, bayangan lembut). Mengikat event listener melalui delegasi global (`focusin`, `click`, `input`, pemilihan item saran) sehingga mengeklik atau memfokuskan `#input-stock-qty` maupun `#input-normal-max-order` langsung memunculkan saran popover dan mengekliknya langsung mengisi `"Unlimited"`, menyinkronkan state, dan menyimpan draft.
    - **Tabel Spesifikasi Manual `[Judul] [Keterangan]` dengan Combobox Saran Cepat (`js/product-form.js`, `js/db.js`, `js/pdp.js`)**: Merampingkan field inti statis di bagian atas kartu Spesifikasi (Baris 1: Merek, Masa Garansi & Jenis Garansi; Baris 2: Kondisi Produk & Pre-Order tanpa kotak border). Membangun tabel dinamis `#custom-specs-table` (`#custom-specs-tbody`) berisi Kolom Judul (Combobox Shadcn dengan 8 pilihan saran cepat: *Dimensi P×L×T, Bahan / Material, Asal Produk, SKU Induk, Berat Bersih, Finishing / Tekstur, Ketebalan, Isi per Paket* atau input teks bebas), Kolom Keterangan (input manual), dan tombol hapus baris. Menyediakan tombol `+ Tambah Baris Spesifikasi` (maksimal 10 baris dengan counter dinamis). Data dipersistensikan pada `primaryState.custom_specs`, disinkronkan ke `localStorage` draft, disimpan di `DB` (`createProduct` & `updateProduct`), serta terintegrasi pada Drawer Spesifikasi Pratinjau Mini PDP dan Tab Spesifikasi Pembeli di `js/pdp.js`.
    - **Cache Version Bump**: Menaikkan cache query string menjadi `?v=6.5` pada `admin.html`.
  - [x] **Penyempurnaan Form Produk Bagian 6 (Tahap 2): Hotfix Pemisahan 7 Kartu Step 2 Saat Aktif, Arahkan Tautan Lokasi ke Menu Akun, Otomatisasi 5-10 Baris Drawer Spesifikasi, dan Border-Radius Atas Drawer (`js/product-form.js`, `css/admin.css`, `js/pdp.js`, `admin.html`)**:
    - **Hotfix Pemisahan 7 Kartu Mandiri Saat Aktif (`js/product-form.js` & `css/admin.css`)**: Memperbaiki unclosed tag `<div>` pada `#card-custom-dimension-pxl` di `renderCustomDimensionCard()` dan penutupan `</label>` pada `card-step2-shipping`. Memastikan ke-7 kartu (`#card-step2-info`, `#card-step2-sales`, `#card-step2-shipping`, `#card-step2-promo`, `#card-step2-description`, `#card-step2-specs`, `#card-step2-others`) berstatus direct siblings di level DOM (depth=1) baik saat belum aktif (locked) maupun saat aktif (unlocked). Menerapkan styling `margin-bottom: 1rem !important; background-color: #ffffff !important; border-radius: 0.5rem !important;`, dan parent container `#step-pane-2` / `#step2-cards-container` dengan background `#f8fafc` (`bg-slate-50`) serta `display: flex !important; flex-direction: column !important; gap: 1rem !important;`.
    - **Eliminasi `settings.html` & Integrasi Navigasi Internal Menu Akun (`js/product-form.js` & `js/pdp.js`)**: Menghapus seluruh tautan dan redirect ke `settings.html` pada `renderShippingLocationNotice()` dan `js/pdp.js`. Mengubah tautan menjadi tombol internal `.btn-goto-account-settings` yang secara otomatis memicu navigasi ke menu Akun yang sudah ada di sidebar `admin.html` via `AdminApp.navigate('account')` atau `navAccount.click()`.
    - **Otomatisasi Drawer "Spesifikasi" (Min 5, Max 10 Baris) (`js/product-form.js` & `js/pdp.js`)**: Menyusun 6 baris wajib (`Stok`: Tersedia/Habis, `Kondisi`: Baru/Bekas dari `#select-prod-condition`, `Merek`: isian atau "-", `Jenis Garansi`: jenis garansi aktif atau "Tidak Ada Garansi", `Produk Custom`: Ya jika Input Ukuran P×L atau Layanan Extra aktif, `Dikirim Dari`: kota toko seller). Baris `Masa Garansi` hanya muncul jika garansi aktif. Format baris `Pre-Order` murni durasi hari (cth: `"7 Hari"`, tanpa kata "Ya/Tidak"). Menambahkan baris-baris kondisional dan tabel `custom_specs`, serta membatasi total baris maksimal 10 baris (`.slice(0, 10)`). Logika disinkronkan secara identik ke Tab Spesifikasi `js/pdp.js`.
    - **Border-Radius Atas Drawer & Penyeragaman Tombol "Oke" (`js/product-form.js`, `css/admin.css`, `js/pdp.js`)**: Menerapkan border radius elegan pada kedua sudut atas (`border-radius: 1rem 1rem 0 0 !important;` / `rounded-t-2xl rounded-b-none`) baik pada Drawer Spesifikasi (`.spec-drawer-sheet`) maupun Drawer Beli Sekarang / Masukkan ke Keranjang (`.mini-pdp-drawer-sheet`). Menghapus aturan `border-radius: 0` pada drawer sheet dan tombol penutup di `css/admin.css`. Mengubah teks tombol penutup menjadi `"Oke"` dan menyeragamkan styling, tinggi, padding, dan efek hover/active dengan `.btn-shopee-submit`.
    - **Cache Version Bump**: Menaikkan cache query string di `admin.html` menjadi `?v=6.6`.
  - [x] **Hotfix Darurat Form Produk: Penghentian Kebocoran Step 2 di Bawah Step 1 & Penyelarasan Lebar Kontainer Kartu Step 2 dengan Step 1 (`js/product-form.js`, `css/admin.css`, `admin.html`)**:
    - **Pencegahan Kebocoran Step 2 di Bawah Step 1 (`css/admin.css` & `js/product-form.js`)**: Menghapus aturan `display: flex !important;` pada `#step-pane-2` dan `#step-pane-1` yang sebelumnya menimpa class utility Tailwind `.hidden`. Menerapkan aturan strict CSS visibility `#step-pane-1.hidden, #step-pane-2.hidden, #step2-subnav-fixed.hidden, #step2-content-wrapper.hidden, .hidden { display: none !important; }` dan `#step-pane-1:not(.hidden), #step-pane-2:not(.hidden) { display: block !important; }`. Di `js/product-form.js`, memperketat `updateStepVisibility(step)` agar saat `currentStep === 1`, `#step-pane-1` berstatus tampil (`block`), sedangkan `#step-pane-2` dan `#step2-subnav-fixed` wajib tersembunyi (`hidden`) serta mengosongkan `innerHTML` Step 2 untuk proteksi ganda (*defense-in-depth*). Saat `currentStep === 2`, `#step-pane-1` disembunyikan (`hidden`) dan `#step-pane-2` dirender rapi.
    - **Penyelarasan Lebar Kontainer Kartu Step 2 dengan Step 1 (`js/product-form.js` & `css/admin.css`)**: Membungkus ke-7 kartu mandiri Step 2 (`#step2-cards-container`) dan tombol footer aksi (`#step2-footer-actions`) di dalam `#step2-content-wrapper`, terpisah dari subnavbar `#step2-subnav-fixed` yang tetap membentang penuh (*full-width edge-to-edge*). Menerapkan ukuran lebar, `max-width`, dan padding horizontal yang 100% identik dengan Step 1 (`padding: 0 1.5rem !important;` pada desktop/tablet dan `padding: 0 0.375rem !important;` pada mobile), dengan jarak antar kartu vertikal konsisten `gap: 1rem` di atas kanvas `#f8fafc`. Menghapus duplikasi padding pada `#step2-cards-container` di media query desktop sehingga kartu Step 2 sejajar lurus presisi dengan kartu Step 1.
    - **Pencegahan Reference Error `bindCustomSpecsEvents` (`js/product-form.js`)**: Mendefinisikan fungsi `bindCustomSpecsEvents()` untuk menangani aksi penambahan baris spesifikasi manual (`#btn-add-custom-spec-row`, maksimal 10 baris) dan penghapusan baris (`.btn-delete-spec-row`) beserta sinkronisasi reaktif data ke state dan draft storage.
  - [x] **Penyelarasan Presisi Lebar Kontainer Kartu Step 2 dengan Step 1 & Penyeragaman Jarak Vertikal Sub-Navbar Serta Antar-Section (`js/product-form.js`, `css/admin.css`, `admin.html`)**:
    - **Penyelarasan 100% Lebar Kontainer Kartu Step 2 dengan Step 1 (`css/admin.css` & `js/product-form.js`)**: Mengeliminasi seluruh aturan CSS `padding: 0 !important;` pada `#step2-cards-container` di media query desktop (min-width: 640px dan min-width: 1024px) yang sebelumnya menyebabkan kartu Step 2 melebar hingga tepi (48px lebih lebar dari Step 1). Menerapkan `padding-left: 1.5rem !important; padding-right: 1.5rem !important; width: 100% !important; max-width: 100% !important; margin-left: auto !important; margin-right: auto !important;` yang 100% identik antara `#step-pane-1` dan `#step2-cards-container` pada desktop, serta `padding-left: 0.375rem !important; padding-right: 0.375rem !important;` pada mobile. Memindahkan kontainer footer tombol aksi `#step2-footer-actions` ke dalam `#step2-cards-container` sehingga batas fisik kiri dan kanan kartu dan tombol Step 2 persis presisi 100% sama dengan Step 1 tanpa pergeseran lebar sedekat 1 pixel pun.
    - **Penyeragaman Jarak Vertikal Sub-Navbar & Antar-Section (`css/admin.css` & `js/product-form.js`)**: Menghilangkan margin ganda (`margin-bottom: 0 !important; margin-top: 0 !important;`) pada sub-navbar `#step2-subnav-fixed`, seluruh kartu `.step2-section-card`, dan `#step2-footer-actions`. Menerapkan jarak vertikal yang seragam dan konsisten (`gap: 0.75rem !important;` / 12px) baik sebagai `padding-top: 0.75rem !important;` pada `#step2-cards-container` (jarak dari sub-navbar fixed ke kartu pertama `Informasi Produk`) maupun sebagai flex gap vertikal antar-kartu `.step2-section-card` dan tombol footer.
    - **Cache Version Bump**: Menaikkan cache query string di `admin.html` menjadi `?v=6.8`.
  - [x] **Standarisasi Custom Combobox (Shadcn UI) di Step 1 & Step 2, Integrasi Edit Produk ke Form Baru, dan Modal Konfirmasi Batal Cerdas (`js/product-form.js`, `js/admin-app.js`, `js/product-list.js`, `css/admin.css`, `admin.html`, `README.md`)**:
    - **Standarisasi Custom Combobox (Input & Pilih) Shadcn UI di Seluruh Form**: Mengeliminasi 100% elemen `<datalist>` dan atribut `list="..."` bawaan browser di Step 1 dan Step 2. Menerapkan komponen Custom Combobox seragam bergaya Shadcn UI (`rounded-md border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto p-1 z-50` dengan scrollbar tipis halus) dengan hover & active state terikat variabel tema brand (`background-color: var(--color-primary-subtle); color: var(--color-primary);`), indikator centang aktif (`✓` / `bi-check2`), dan tombol bersihkan nilai (`×`). Seluruh opsi saran tampil lengkap saat input difokuskan/diklik dan dapat difilter secara real-time saat diketik manual. Terpasang konsisten pada Step 1 (*Label Khusus 1 & 2*) dan Step 2 (*Stok Produk, Maksimal Jumlah Pembelian, Max Order Tabel Variasi, Nama Grup Variasi 1–4, Layanan Extras, Merek, Asal Produk, dan Judul Spesifikasi*).
    - **Otomatisasi Klik Edit dari Menu Daftar Produk ke Form Baru (`ProductForm`)**: Mengintegrasikan seluruh pemicu tombol Edit (`.btn-edit-product`) pada tabel produk agar secara otomatis menyimpan menu asal (`lastActiveMenuBeforeForm = 'products'`), memuat data produk secara utuh ke dalam `primaryState` Step 1 & Step 2, membuka tampilan `view-product-form` pada Step 1, dan menyimpan snapshot kondisi awal (`initialEditSnapshot`) untuk perbandingan perubahan.
    - **Logika Tombol Batal & Modal Konfirmasi Cerdas (SaaS UX Writing)**:
      - **Skenario A (Tambah Produk Baru)**: Jika form masih kosong bersih, langsung menutup form dan membuka menu asal tanpa modal konfirmasi. Jika sudah terdapat data/nilai yang diisi, menampilkan modal konfirmasi *"Batalkan Pembuatan Produk Baru?"* dengan opsi `[Ya, Batalkan]` (membersihkan state, menghapus draft lokal `songer_add_product_draft`, dan kembali ke menu asal) serta opsi `[Tidak]` (menutup modal, seluruh data form terjaga utuh 100%).
      - **Skenario B (Edit Produk)**: Jika tidak ada perubahan nilai dari data awal produk (`!hasEditProductChanged()`), langsung keluar dan kembali ke menu Daftar Produk tanpa modal konfirmasi. Jika terdapat perubahan nilai, menampilkan modal konfirmasi *"Batalkan Perubahan Produk?"* dengan deskripsi *"Perubahan pada produk ini tidak akan disimpan."*
    - **Cache Version Bump**: Menaikkan cache query string di `admin.html` menjadi `?v=6.9`.
  - [x] **Standarisasi Popover Ramping Terkendali (`clean-datalist-popover`), Auto-Dismiss Scroll Luar, Opsi Lengkap Saat Berisi Nilai, Standar Unlimited & Tanpa Batas, serta Radius & Ikon List Variasi Produk (`js/product-form.js`, `css/admin.css`, `admin.html`, `docs/PRD_MASTER.md`, `README.md`)**:
    - **Sistem Popover Ramping Terkendali (`.clean-datalist-popover`) Bergaya Callout**:
      - Mengeliminasi 100% bug popup OS Chromium yang melayang lepas dari input saat halaman di-scroll dengan memindahkan atribut `list` ke `data-datalist-id` dan `data-datalist`, lalu menghapus atribut `list` (`input.removeAttribute('list')`) serta menyetel `autocomplete="off"`.
      - Desain popover ramping kompak (`min-w-[160px] max-w-[240px] w-max`, shadow lembut, border halus, latar putih, scrollbar tipis, dan dilengkapi segitiga penunjuk callout arrow di atas popover) tanpa header judul tambahan.
    - **Penanganan Scroll Luar (Auto-Dismiss saat Scroll Halaman)**:
      - Memasang listener `scroll` global (`passive: true, capture: true`) pada `window`, `document`, dan `#admin-main-viewport`. Jika scroll terjadi di luar `.clean-datalist-popover`, seluruh popover saran langsung ditutup seketika (`closeAllCleanDatalistPopovers()`) sehingga tidak pernah melayang atau terlepas dari posisi input. Scroll di dalam popover tetap berjalan lancar.
    - **Tampilan Seluruh Daftar Saran Saat Berisi Nilai**:
      - Saat pengguna mengeklik (`click`), memfokuskan (`focus`), atau menekan panah `▼` pada input, seluruh opsi saran tetap ditampilkan lengkap (tidak disembunyikan/difilter oleh nilai yang sudah ada) dan opsi yang cocok diberikan highlight lembut (`var(--color-primary-subtle)` & `var(--color-primary)`) beserta centang aktif (`bi-check2`).
      - Pemfilteran kata kunci hanya aktif saat pengguna mengetik huruf baru via keyboard. Jika ketikan cocok persis dengan salah satu opsi preset, seluruh opsi tetap ditampilkan di bawahnya.
    - **Seragamkan Kontrol Kanan (`▼` saat Kosong, `×` saat Berisi Nilai)**:
      - Saat input kosong (`value.trim() === ''`): Menampilkan anak panah `▼` (`.clean-datalist-arrow`) di kanan dalam input. Mengklik panah langsung memfokuskan input dan membuka menu saran lengkap.
      - Saat input berisi nilai (`value.trim() !== ''`): Panah `▼` disembunyikan otomatis dan digantikan oleh tombol silang `×` (`.btn-clear-datalist` / `.btn-clear-custom-label`).
      - Saat tombol `×` diklik: Nilai input dikosongkan, event `input` & `change` dipicu untuk sinkronisasi state/counter/chip/live preview, input kembali difokuskan, dan daftar saran lengkap langsung dibuka.
      - Terpasang seragam pada 9 elemen: Label Khusus 1 & 2, Teks Footer Model C, Stok Tanpa Variasi, Maksimal Pembelian, Max. Order Tabel Variasi, Nama Grup Variasi 1–4, Layanan Extras, Merek, Asal Produk, dan Judul Spesifikasi Manual.
    - **Kunci Nilai Saran `"Unlimited"` (Stok) & `"Tanpa Batas"` (Max. Order)**:
      - Stok Tanpa Variasi (`#input-stock-qty`): Menggunakan opsi `"Unlimited"`, tersinkronisasi dengan `primaryState.is_unlimited_stock = true` dan `primaryState.stock = null`.
      - Semua Input Max. Order (`#input-normal-max-order` dan `.combo-max-order-input`): Hanya menggunakan opsi `"Tanpa Batas"` (`#datalist-max-order-unlimited`), tersimpan akurat sebagai tanpa batas (`max_order = null`).
    - **List Variasi Produk: Sudut `rounded-md` Seragam & Bersih Tanpa Ikon**:
      - Menyeragamkan seluruh kontrol di dalam tabel List Variasi Produk (`#combination-matrix-section`) menjadi sudut tegas `rounded-md` (`border-radius: 0.375rem !important;`) pada `Min. Order`, `Max. Order`, `combo-scope-select`, `btn-open-specific-modal`, tombol `Harga Grosir`, dan tombol `Kelipatan Order`.
      - Menghapus seluruh elemen ikon (`<i class="bi ..."></i>`) pada tombol Harga Grosir (`.btn-open-wholesale-modal`) dan Kelipatan Order (`.btn-open-multiple-modal`), menyisakan teks bersih yang proporsional.
    - **Cache Version Bump**: Menaikkan cache query string di `admin.html` menjadi `?v=7.4`.
  - [x] **Penyempurnaan Form Produk Bagian 7 (Tahap 2): Hapus Total Border & Radius Input di Drawer, Beri Radius Atas Drawer & Serasikan Tombol "Oke", Otomatisasi 5-10 Baris Spesifikasi, serta Bersihkan Garis Dobel Step 2 (`js/product-form.js`, `css/admin.css`, `js/pdp.js`, `admin.html`, `docs/PRD_MASTER.md`)**:
    - **Hapus Tuntas Radius & Border Input di Dalam Drawer (`js/product-form.js` & `css/admin.css`)**:
      - Menghapus seluruh class `border`, `border-slate-*`, dan `rounded` pada stepper Jumlah Pesanan Utama (`#input-preview-test-qty`, `#btn-shopee-qty-minus`, `#btn-shopee-qty-plus`), input Panjang & Lebar P×L (`#input-shopee-dim-p`, `#input-shopee-dim-l`, `.dim-input-box`), dan stepper Qty Layanan Extras (`.extra-qty-stepper`, `.btn-shopee-extra-minus`, `.input-shopee-extra-qty`, `.btn-shopee-extra-plus`).
      - Menerapkan override CSS dengan spesifisitas tertinggi di `css/admin.css` (`border: 0 !important; border-radius: 0 !important; outline: none !important; box-shadow: none !important;`) dengan kontras warna latar abu-abu lembut (`bg-slate-100` pada wrapper/tombol dan `bg-slate-50` atau `bg-transparent` pada input).
    - **Border-Radius Atas Drawer (`rounded-t-xl`) & Penyeragaman Tombol "Oke" (`js/product-form.js` & `css/admin.css`)**:
      - Menerapkan border radius lengkung elegan hanya di kedua sudut atas (`border-top-left-radius: 0.75rem !important; border-top-right-radius: 0.75rem !important;` / `rounded-t-xl` / 12px) pada Drawer Spesifikasi (`.spec-drawer-sheet`), Drawer Beli Sekarang, dan Drawer Masukkan Ke Keranjang (`.mini-pdp-drawer-sheet`).
      - Mengubah teks tombol penutup di bagian bawah Drawer Spesifikasi (`#btn-close-spec-drawer`) menjadi `"Oke"` (bukan `"OK"`), dan menyeragamkan wrapper footer (`p-2.5 pt-0 shrink-0 bg-white`), tinggi tombol (`py-2.5`), font (`text-xs font-bold tracking-wide`), sudut (`rounded-xl`), serta warna latar `var(--color-primary)` dan hover `var(--color-primary-hover)` serasi 100% dengan tombol konfirmasi drawer checkout (`.btn-shopee-submit`).
    - **Otomatisasi 5–10 Baris Drawer Spesifikasi & Tabel Spesifikasi Manual (`js/product-form.js` & `js/pdp.js`)**:
      - Menyusun baris spesifikasi secara cerdas dengan aturan prioritas:
        - **Kelompok A (Wajib)**: `Stok` (Tersedia/Habis), `Merek` (isian atau "-"), `Jenis Garansi` (Garansi Toko / Tidak Ada Garansi), `Masa Garansi` (hanya tampil jika garansi aktif), `Produk Custom` ("Ya" jika custom dimension/extra service atau "Tidak"), `Dikirim Dari` (lokasi dinamis seller).
        - **Kelompok B (Kondisional & Manual)**: `Kondisi Produk` ("Baru" / "Bekas" dari `#select-prod-condition`), `Pre-Order` (durasi hari langsung tanpa "Ya/Tidak", cth: `"${days} Hari"`), `Min. Pembelian` (jika > 1), `Harga Grosir` (jika aktif), `Kelipatan Pembelian` (jika aktif), `Asal Produk`, `SKU Induk`, dan baris-baris dari Tabel Spesifikasi Manual (`custom_specs`) yang diisi oleh seller.
      - Membatasi total baris minimal 5 dan maksimal 10 baris (`rows.slice(0, 10)`). Logika disinkronkan secara identik ke Tab Spesifikasi `js/pdp.js`.
      - Tabel Input Spesifikasi Manual di kartu `#card-step2-specs`: Menggunakan `.clean-datalist-popover` (`data-datalist-id="datalist-spec-titles"`) dengan 8 saran cepat (*Dimensi (PxLxT), Bahan, Berat Bersih, Finishing, Ketebalan, Isi per Paket, Asal Produk, SKU Induk*), input keterangan, tombol `+ Tambah Baris Spesifikasi` (`#btn-add-spec-row`), dan tombol hapus per baris (`🗑`).
    - **Pembersihan Garis Dobel, Pemisah Berlebih, & Kotak Lokasi di Step 2 (`js/product-form.js`)**:
      - Memastikan 7 kartu utama Step 2 (`#card-step2-info`, `#card-step2-sales`, `#card-step2-shipping`, `#card-step2-promo`, `#card-step2-description`, `#card-step2-specs`, `#card-step2-others`) berstatus kartu putih mandiri terpisah tanpa nested cards.
      - Menghapus garis horizontal dobel di bawah judul `Informasi Penjualan` dan `Lainnya`.
      - Menghapus garis pemisah pembatas (`border-b` / `border-t`) yang mengapit textarea Deskripsi Produk dan kartu Spesifikasi, serta menghapus border kotak luar pada `Sistem Pre-Order (PO)`.
      - Mengeliminasi kotak ber-border lokasi toko di kartu Pengiriman. Jika lokasi valid, tidak menampilkan teks apa pun; jika belum diatur, menampilkan peringatan ringkas flat `"Lokasi Belum Setting"` dengan link cepat ke Pengaturan Akun.
    - **Cache Version Bump**: Menaikkan cache query string di `admin.html` menjadi `?v=7.5`.
  - [x] **Penyempurnaan Form Produk Bagian 8 (Tahap 1): Pisahkan Datalist Ukuran PxL, Kunci Opsi Saran Terpakai, Perbaiki Posisi Tombol Hapus saat Muncul Error, dan Seragamkan Input Pilih Step 1 (`js/product-form.js`, `css/admin.css`, `admin.html`, `docs/PRD_MASTER.md`)**:
    - **Pemisahan Datalist Khusus Ukuran PxL (`#datalist-dimension-labels`) (`js/product-form.js`)**: Memisahkan nilai saran khusus input "Nama Label Ukuran" dari daftar variasi umum (`datalist-variation-labels`), sehingga input PxL (`#input-custom-dimension-label`) kini memiliki datalist khusus beranggotakan 3 opsi presisi (*Masukkan Ukuran, Ukuran Spanduk, Ukuran Kain*) dengan placeholder informatif tanpa memicu duplikasi nama "Ukuran" dengan Variasi 1.
    - **Penguncian Opsi Saran yang Sudah Terpakai (`is-disabled-used`) (`js/product-form.js` & `css/admin.css`)**: Membangun mekanisme pendeteksi nilai aktif (`usedValues`) pada kelompok Judul Sesi Produk (Variasi 1–4, Layanan Extras, dan Label Ukuran PxL), kelompok Judul Spesifikasi Manual Step 2 (`.input-spec-title`), serta Label Khusus Step 1. Opsi yang cocok dengan nilai input aktif tetap diberi highlight tema dan centang aktif, sedangkan opsi yang sudah terpakai di input lain dalam kelompok dirender dengan class `.is-disabled-used` (`pointer-events: none; opacity: 0.45; cursor: not-allowed;` dengan teks dicoret dan badge `"Terpakai"` di sisi kanan) sehingga tidak bisa dipilih kembali.
    - **Presisi Tombol Hapus (`×`) & Panah (`▼`) Serta Perapian Pesan Error (`css/admin.css` & `js/product-form.js`)**: Mengunci posisi vertikal kontrol kanan (`.clean-datalist-arrow`, `.btn-clear-datalist`, `.btn-clear-custom-label`) pada `top: 19px !important; transform: translateY(-50%) !important;` sesuai separuh tinggi input 38px, sehingga saat pesan error validasi muncul di bawah kotak input, posisi tombol `×` dan `▼` tetap presisi 100% di tengah vertikal kotak input tanpa melorot. Merapikan tampilan pesan keterangan/error (`.label-dup-error-msg` dan `#custom-dimension-label-error`) menjadi inline bersih proporsional (`text-[11px] text-red-600 font-medium leading-tight` dengan ikon `bi-exclamation-circle`), mengeliminasi border kotak merah tebal.
    - **Penyeragaman Input Label Khusus & Footer di Step 1 (`js/product-form.js`)**: Menyeragamkan seluruh input saran di Step 1 (Label Khusus 1 & 2 `#input-custom-label-1`, `#input-custom-label-2`, serta Teks Footer Model C) ke arsitektur `.clean-datalist-popover`. Menampilkan panah `▼` saat kosong, menampilkan tombol `×` saat terisi, mengosongkan nilai serta memperbarui live preview kartu Step 1 dan membuka kembali popover saran saat `×` diklik, serta menampilkan seluruh opsi saran lengkap saat difokuskan/diklik. Mengintegrasikan pemanggilan `bindCleanDatalistPopovers` secara reaktif di akhir `renderStep1Content`.
    - **Cache Version Bump**: Menaikkan cache query string di `admin.html` menjadi `?v=7.6`.
  - [x] **Penyempurnaan Form Produk Bagian 8 (Revisi Tahap 1 + Penyelesaian Tahap 2): Presisikan Posisi Vertikal Tombol Hapus Input, Bersihkan Tampilan Opsi Terpakai, Perbaiki Input Max Order & Stok Tanpa Panah & Default, Hapus Tuntas Border/Radius Drawer Pratinjau, serta Kosongkan Default Variasi 1 Opsi 1 (`js/product-form.js`, `css/admin.css`, `admin.html`, `docs/PRD_MASTER.md`)**:
    - **Presisi Vertikal Tombol `×` dan Panah `▼` 100% Sejajar Teks Input (`css/admin.css` & `js/product-form.js`)**: Menghapus deklarasi statis `top: 19px !important;` dan membungkus elemen input beserta kontrol kanan ke dalam sub-wrapper `.clean-datalist-input-box` (`relative flex items-center w-full`) dengan aturan centering mutlak (`top: 0 !important; bottom: 0 !important; margin: auto !important; transform: none !important; height: 1.25rem; width: 1.25rem; display: inline-flex; align-items: center; justify-content: center;`). Mengganti icon `bi-x-lg` ke icon proporsional `bi-x text-sm leading-none flex items-center justify-center` sehingga silang `×` selalu sejajar presisi di titik tengah teks input apapun ketinggiannya (32px-38px).
    - **Pembersihan Tampilan Opsi Saran yang Sudah Terpakai (`js/product-form.js` & `css/admin.css`)**: Mengeliminasi efek coret (`line-through`) dan badge kotak `"Terpakai"`. Opsi yang telah terpakai di input lain kini ditampilkan rapi dan bersih dalam kondisi abu-abu nonaktif samar (`class="clean-datalist-item is-disabled-used w-full text-left px-3 py-1.5 text-xs text-slate-300 select-none"`) dengan aturan CSS `pointer-events: none !important; cursor: not-allowed !important; color: #cbd5e1 !important; background-color: transparent !important; text-decoration: none !important;`.
    - **Penyempurnaan Perilaku Input `Max. Order` & `Stok` (Tanpa Batas / Unlimited) (`js/product-form.js`)**: Menghilangkan paksaan nilai default `"Tanpa Batas"` pada saat inisialisasi awal produk maupun pada event `onblur`—nilai awal kini kosong murni `value=""` dengan `placeholder="Input/Pilih"`. Khusus untuk datalist 1-opsi (`datalist-max-order-unlimited` dan `datalist-stock-unlimited`), panah `▼` dan tombol silang `×` tidak lagi dirender dan menggunakan padding normal `pr-2.5`. Saran popover `"Tanpa Batas"` / `"Unlimited"` tidak pernah difilter saat user mengetik angka sehingga user bebas mengetik angka atau memilih `"Tanpa Batas"` kapan saja. Karakter non-digit otomatis dibersihkan saat pengetikan, dan nilai `"Tanpa Batas"` maupun `""` secara konsisten disimpan ke database sebagai `null`.
    - **Zero Border & Zero Radius pada Input Drawer Pratinjau Uji Coba (`css/admin.css` & `js/product-form.js`)**: Menambahkan blok aturan override spesifisitas maksimal di akhir `css/admin.css` untuk kondisi normal, `:hover`, `:focus`, `:focus-visible`, dan `:active` pada `#input-preview-test-qty`, stepper `-` `+`, `#input-shopee-dim-p`, `#input-shopee-dim-l`, `.dim-input-box`, `.extra-qty-stepper`, dan `.input-shopee-extra-qty`, menghilangkan seluruh sisa border, outline, radius melengkung, maupun ring glow hijau.
    - **Pengosongan Nilai Default Variasi 1 Opsi 1 (`js/product-form.js`)**: Menghapus penyalinan nama produk, harga jual normal, dan biaya modal normal ke Opsi 1 saat tombol `+ Variasi Produk` diaktifkan. Variasi 1 Opsi 1 dan Opsi 2 kini selalu diinisialisasi kosong murni (`name: ''`, `description: ''`, `price: ''`, `cost_price: ''`) dan menampilkan placeholder bersih (`Opsi 1`, `Keterangan`, `Harga Jual`, `Biaya Modal`) tanpa menampilkan angka `0` sebagai default jika belum diisi seller. Mengeliminasi seluruh sisa class utilitas warna statis `focus:bg-emerald-*`.
    - **Cache Version Bump**: Menaikkan cache query string di `admin.html` menjadi `?v=7.7`.
  - [x] **Penyempurnaan Form Produk Bagian 9: Perbaikan Bug Ikon Panah (`▼`) & Silang (`×`) Bertumpuk, Pemosisi Fixed Popover Saran Tidak Terpotong Tabel, serta Saran 'Tanpa Batas' / 'Unlimited' Hanya Muncul Saat Input Kosong (`css/admin.css`, `js/product-form.js`, `admin.html`, `docs/PRD_MASTER.md`)**:
    - **Eliminasi Bug Ikon Panah (`▼`) dan Silang (`×`) Bertumpuk (`css/admin.css` & `js/product-form.js`)**:
      - Memperbarui selector di `css/admin.css` agar aturan `display: inline-flex !important;` hanya berlaku pada elemen kontrol yang aktif (`:not(.hidden)`). Menambahkan aturan CSS eksplisit `.clean-datalist-arrow.hidden, .btn-clear-datalist.hidden, .btn-clear-custom-label.hidden, .btn-clear-datalist-input.hidden { display: none !important; visibility: hidden !important; pointer-events: none !important; }`.
      - Mencegah injeksi tombol silang ganda di `bindCleanDatalistPopovers` (`js/product-form.js`): mendeteksi keberadaan `.btn-clear-custom-label` atau `.btn-clear-datalist` yang sudah ada di wrapper/inputBox dan menggunakan elemen yang ada serta membersihkan elemen duplikat.
      - Menjalankan logika eksklusif mutlak di `syncClearAndArrowVisibility`: jika input kosong (`value.trim() === ''`), panah `▼` tampil dan tombol `×` disembunyikan; jika input berisi teks (`value.trim() !== ''`), panah `▼` disembunyikan dan tombol `×` ditampilkan. Sinkronisasi identik juga diterapkan ke slot Label Khusus Step 1 di `updateCustomLabelsLockState`.
    - **Pemosisi Popover Bebas Potong Menggunakan `position: fixed` Presisi (`js/product-form.js` & `css/admin.css`)**:
      - Mengubah arsitektur `.clean-datalist-popover` menjadi `position: fixed !important; z-index: 99999 !important;` dan menempelkannya langsung ke `document.body` saat dibuka (`openMenu()`).
      - Menghitung koordinat dinamis dari `input.getBoundingClientRect()` (`top: (rect.bottom + 6) + 'px'`, `left: rect.left + 'px'`, lebar sejajar input atau callout proporsional) sehingga popover saran tidak pernah lagi terpotong oleh `overflow: auto` / `overflow: hidden` pada kontainer tabel List Variasi Produk (`#combination-matrix-section`) maupun kartu form lainnya.
      - Menutup seluruh popover aktif otomatis saat halaman, viewport, atau kontainer tabel di-scroll baik vertikal maupun horizontal, serta membersihkan popover orphan jika input terkait dihapus dari DOM.
    - **Tampilan Saran 1-Opsi (`Max. Order` / `Stok`) Hanya Saat Input Kosong (`js/product-form.js`)**:
      - Pada datalist 1-opsi (`datalist-max-order-unlimited` / `"Tanpa Batas"` dan `datalist-stock-unlimited` / `"Unlimited"`), popover saran HANYA dibuka dan ditampilkan apabila input masih kosong murni (`value.trim() === ''`).
      - Begitu pengguna mengetik angka (`value.trim() !== ''`) atau memilih saran, popover langsung ditutup seketika (`closePopover()`).
      - Apabila pengguna menghapus isian hingga kembali kosong (`value.trim() === ''`), popover saran otomatis muncul kembali saat input berfokus/diklik.
    - **Cache Version Bump**: Menaikkan cache query string di `admin.html` menjadi `?v=7.8`.
  - [x] **Penyempurnaan Form Produk Bagian 10 (Tahap 1): Eliminasi Keterangan Bawaan Min Order, Otomatisasi OFF Kustomisasi Ukuran (PxL) Saat Variasi Dihapus, dan Isolasi Memori Nilai Harga Jual & Biaya Modal Non-Variasi (`js/product-form.js`, `admin.html`, `docs/PRD_MASTER.md`)**:
    - **Penghapusan Keterangan Bawaan Minimal Order (`js/product-form.js`)**: Menghilangkan teks `"Bawaan standar: 1"` di bawah input Minimal Jumlah Pembelian (`#input-min-order`) sehingga tampilan input sejajar rapi dan simetris dengan Maksimal Jumlah Pembelian.
    - **Otomatisasi Input Ukuran (PxL) Menjadi OFF Saat Variasi Dihapus (`js/product-form.js`)**: Mengingat fitur Kustomisasi Ukuran (PxL) hanya valid bila memiliki minimal 1 variasi aktif, di seluruh alur penghapusan variasi (`closeAndShiftVariationTier`, penutupan Variasi 1, tombol disable variasi, maupun sinkronisasi DOM), status PxL otomatis disetel ke `OFF` (`primaryState.has_custom_dimension = false`, `is_custom_dimension = false`, `enable_custom_dimension = false`), toggle `#toggle-custom-dimension` di-uncheck, panel konfigurasi PxL disembunyikan, state preview PxL direset, dan pratinjau live drawer diperbarui secara reaktif.
    - **Isolasi & Memori Nilai Harga Jual & Biaya Modal Antara Mode Non-Variasi vs Variasi (`js/product-form.js`)**:
      - Memisahkan dan mengisolasi memori nilai input Harga Jual dan Biaya Modal mode Tanpa Variasi (`_savedNonVariantPrice` dan `_savedNonVariantCostPrice`).
      - Nilai harga yang diketik di dalam variasi tidak akan pernah bocor atau meracuni mode Tanpa Variasi saat variasi dihapus.
      - **Skenario A**: Jika pengguna belum pernah mengisi harga di mode Tanpa Variasi -> menambah variasi & mengisi harga di variasi -> menghapus variasi, input Harga Jual dan Modal saat kembali ke mode Tanpa Variasi dipastikan tetap kosong murni (`""` / `null`) dan hanya menampilkan placeholder asli tanpa default angka `0` atau angka variasi.
      - **Skenario B**: Jika pengguna sudah pernah mengetik Harga Jual/Modal di mode Tanpa Variasi -> menambah variasi -> menghapus variasi lagi, nilai asli yang pernah diketik di mode Tanpa Variasi dipulihkan secara presisi dari memori terisolasi `_savedNonVariantPrice` dan `_savedNonVariantCostPrice`.
    - **Cache Version Bump**: Menaikkan cache query string di `admin.html` menjadi `?v=7.9`.
  - [x] **Penyempurnaan Form Produk Bagian 10 (Tahap 2): Tata Letak Vertikal Harga Grosir & Kelipatan Pesanan, Tombol Tutup (✕) Saat Aktif, Garis Pembatas (Divider) Antar-Seksi, serta Penyeragaman Lebar & Gap 100% Seluruh Kartu Seksi (`js/product-form.js`, `css/admin.css`, `admin.html`, `docs/PRD_MASTER.md`)**:
    - **Tata Letak Vertikal Teks Keterangan di Bawah Tombol Aksi (`js/product-form.js`)**:
      - Memindahkan teks `"Atur harga satuan lebih murah untuk pesanan bertingkat"` tepat di bawah tombol aksi `[+ Harga Grosir]` menggunakan layout kolom vertikal (`flex flex-col items-start gap-1`, teks `text-xs text-slate-400`).
      - Memindahkan teks `"Wajib kelipatan kuantitas (misal kelipatan 50 pcs)"` tepat di bawah tombol aksi `[+ Kelipatan Pesanan]` menggunakan layout kolom vertikal (`flex flex-col items-start gap-1`, teks `text-xs text-slate-400`).
    - **Penyembunyian Tombol Tambah Saat Aktif & Tombol Tutup Silang (✕) Sisi Kanan (`js/product-form.js`)**:
      - Pada bagian Harga Grosir: Saat diaktifkan, tombol `[+ Harga Grosir]` beserta teks keterangannya disembunyikan (`hidden`), lalu menampilkan header aktif dengan badge `"Aktif"` dan tombol silang penutup (`#btn-close-wholesale`, `✕`) di sisi kanan (`ml-auto`). Mengklik tombol `✕` menonaktifkan harga grosir (`primaryState.has_wholesale = false`), menyembunyikan tabel/form, dan memulihkan tombol `[+ Harga Grosir]` beserta keterangannya seperti semula.
      - Pada bagian Kelipatan Pesanan: Saat diaktifkan, tombol `[+ Kelipatan Pesanan]` beserta teks keterangannya disembunyikan (`hidden`), lalu menampilkan header aktif dengan badge `"Aktif"` dan tombol silang penutup (`#btn-close-order-multiple`, `✕`) di sisi kanan (`ml-auto`). Mengklik tombol `✕` menonaktifkan kelipatan pesanan (`primaryState.has_order_multiple = false`), menyembunyikan input kelipatan, dan memulihkan tombol `[+ Kelipatan Pesanan]` beserta keterangannya seperti semula.
    - **Penyisipan Garis Pembatas Horizontal Tipis (Divider) (`js/product-form.js`)**:
      - Menambahkan garis pembatas horizontal `<hr class="border-t border-slate-100 my-4" />` di antara baris Minimal/Maksimal Jumlah Pembelian dan bagian `+ Harga Grosir`.
      - Menambahkan garis pembatas horizontal `<hr class="border-t border-slate-100 my-4" />` di antara bagian `+ Harga Grosir` dan bagian `+ Kelipatan Pesanan`.
      - Garis pembatas tetap rapi dan konsisten baik saat Harga Grosir / Kelipatan Pesanan belum aktif maupun sedang dibuka.
    - **Penyeragaman Lebar & Gap 100% Seluruh Kartu Seksi Form Produk (`js/product-form.js` & `css/admin.css`)**:
      - Menghapus tag penutup `</div>` liar di baris input Maksimal Pembelian yang sebelumnya memutus hierarki `#single-product-purchase-settings` dan `#step2-cards-container` sebelum waktunya.
      - Mengembalikan ke-7 kartu seksi Step 2 (`#card-step2-info`, `#card-step2-sales`, `#card-step2-shipping`, `#card-step2-promo`, `#card-step2-description`, `#card-step2-specs`, `#card-step2-others`) dan footer aksi sebagai anak langsung dari kontainer flex vertikal `#step2-cards-container` dengan jarak seragam `gap: 0.75rem` (12px).
      - Menghilangkan anomali duplikasi padding pada `#step2-content-wrapper` di `css/admin.css` (`padding: 0 !important; margin: 0 !important;`) sehingga seluruh kartu seksi utama memiliki lebar (`width: 100%`), margin, padding, dan sudut `rounded-lg` yang 100% identik dan sejajar presisi dari kartu pertama hingga kartu terakhir.
    - **Otomatisasi Warna Dinamis (Zero Static Emerald)**: Menghapus seluruh class statis `emerald` pada tabel harga grosir dan panel kelipatan pesanan, beralih penuh ke variabel CSS tema `var(--color-primary)` dan `var(--color-primary-subtle)`.
    - **Cache Version Bump**: Menaikkan cache query string di `admin.html` menjadi `?v=8.0`.
  - [x] **Penyempurnaan Form Produk Bagian 11: Otomatisasi Aturan Spesifik Variasi 2–4 di Pratinjau Uji Coba Mini PDP & Drawer, serta Kunci Posisi 'Dikirim Dari' Selalu Paling Bawah di Drawer Spesifikasi & PDP (`js/product-form.js`, `js/pdp.js`, `admin.html`, `docs/PRD_MASTER.md`)**:
    - **Otomatisasi Aturan Spesifik Variasi 2–4 di Pratinjau Uji Coba & Drawer (`js/product-form.js`)**:
      - Menyediakan fungsi pemetaan filter cakupan variasi `getAllowedVariationOptions(matId, tierKey)` dan sinkronisasi `validateAndAdjustSpecificVariations()`.
      - Saat Variasi 1 (`Tier 1`) dipilih di kartu Mini PDP maupun di dalam Drawer Checkout (baik mode Chip tombol, Accordion, maupun Shadcn Popover Dropdown), opsi pada Variasi 2, 3, dan 4 yang tidak diizinkan oleh aturan spesifik Variasi 1 otomatis dinonaktifkan (`disabled`, `opacity-40 line-through cursor-not-allowed pointer-events-none`).
      - Jika opsi yang sebelumnya sedang terpilih pada Variasi 2, 3, atau 4 tidak lagi valid setelah pengguna mengganti pilihan Variasi 1, sistem secara pintar dan reaktif mereset/menggeser pilihan ke opsi pertama yang diizinkan (atau `null` jika tidak ada opsi yang valid).
      - Mengimplementasikan `resolveActiveCombinationRule()` untuk memecahkan aturan minimal pesanan (`min_order`), batas maksimal pesanan (`max_order`), kelipatan pesanan (`order_multiple`), dan tingkatan harga grosir (`wholesale_tiers`) berdasarkan kombinasi varian yang sedang aktif terpilih.
      - Menghubungkan perhitungan harga grosir dinamis di `updateShopeeDrawerLivePricing()` dengan indikator banner diskon grosir di drawer dan memperbarui status enabled/disabled tombol kuantitas `[-]` dan `[+]` via `updateDrawerQtyButtonsState()`.
    - **Penerapan Otomatisasi Variasi Spesifik pada Halaman Detail Produk Pembeli (`js/pdp.js`)**:
      - Menambahkan `updateFinishingAllowedState(selectedMatId)` pada konfigurator PDP: opsi finishing utama (`mainOptions`) otomatis difilter dan dinonaktifkan jika berada di luar cakupan spesifik bahan yang dipilih pembeli, serta otomatis mengarahkan pilihan ke opsi valid pertama.
    - **Kunci Posisi 'Dikirim Dari' Selalu Paling Bawah di Drawer Spesifikasi & Tab PDP (`js/product-form.js` & `js/pdp.js`)**:
      - Pada `buildProductSpecDrawerHtml()` (`js/product-form.js`) dan tab Spesifikasi produk (`js/pdp.js`), seluruh baris wajib, kondisional, dan baris manual seller dikumpulkan terlebih dahulu ke dalam `otherRows` (tanpa "Dikirim Dari").
      - `otherRows` dipotong maksimal 9 baris teratas (`otherRows.slice(0, 9)`), kemudian baris `Dikirim Dari` ditambahkan sebagai elemen penutup paling akhir (`finalRows.push({ label: 'Dikirim Dari', ... })`).
      - Menjamin 100% posisi `Dikirim Dari` selalu berada di urutan paling bawah (tepat di atas tombol CTA "Oke") dengan total baris tetap terkunci antara 5 hingga 10 baris.
    - **Cache Version Bump**: Menaikkan cache query string di `admin.html` menjadi `?v=8.1`.
  - [x] **Otomatisasi Global Cache Busting & Meta Tag No-Cache di Seluruh File HTML (`bump-version.js`, `admin.html`, `index.html`, `product.html`, `settings.html`, `theme-editor.html`, `superadmin/superadmin.html`, `docs/PRD_MASTER.md`)**:
    - **Script Automator `bump-version.js` di Root Proyek**:
      - Mengambil waktu lokal WIB (UTC+7) dengan format timestamp ringkas `YYYYMMDDHHmm` (atau argumen versi custom).
      - Menelusuri seluruh file HTML (`admin.html`, `index.html`, `product.html`, `settings.html`, `theme-editor.html`, `superadmin/superadmin.html`).
      - Mengganti seluruh referensi query string `.css?v=...` dan `.js?v=...` (termasuk folder `css/`, `js/`, dan `src/lib/...`) secara serentak menggunakan regex `/(\.(?:css|js)\?v=)[0-9a-zA-Z._-]+/g` menjadi `$1${version}` sehingga tidak ada lagi versi tertinggal atau belang-belang.
      - Menghasilkan log terminal yang jelas dan informatif yang merinci jumlah aset yang diperbarui per berkas.
    - **Pemasangan Meta Tag `No-Cache` di `<head>` Seluruh File HTML**:
      - Memasang 3 baris meta header anti-stale cache: `<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">`, `<meta http-equiv="Pragma" content="no-cache">`, `<meta http-equiv="Expires" content="0">` di seluruh 6 file HTML utama (`admin.html`, `index.html`, `product.html`, `settings.html`, `theme-editor.html`, `superadmin/superadmin.html`) untuk menjamin browser selalu memuat file HTML terbaru tanpa tertahan di cache lokal.
  - [x] **Penyempurnaan Form Produk Bagian 12: Validasi Prasyarat Uji Coba Mode Tanpa Variasi & Mode Varian/Matrix (`js/product-form.js`, `docs/PRD_MASTER.md`)**:
    - **Validasi Prasyarat Uji Coba Mode Tanpa Variasi (`has_variants === false`)**:
      - Sistem memvalidasi kelengkapan 5 parameter wajib sebelum mengizinkan pengaktifan mode Uji Coba atau pembukaan drawer checkout: *Nama Produk*, *Kategori*, *Harga Jual* (> 0), *Stok Produk* (kuota valid atau Unlimited), dan *Maksimal Jumlah Pembelian* (nilai valid atau Tanpa Batas).
      - Jika ada parameter yang belum terisi lengkap, pembukaan uji coba dibatalkan, sistem menampilkan notifikasi SaaS ramah (*"Mohon lengkapi Nama Produk, Kategori, Harga Jual, Stok Produk, dan Maksimal Jumlah Pembelian terlebih dahulu."*), dan secara otomatis mengarahkan fokus (`focus()`, `scrollIntoView()`, visual highlight ring) ke input pertama yang belum terisi lengkap (termasuk auto navigasi ke Step 1 jika Nama Produk atau Kategori belum diisi).
    - **Validasi Prasyarat Uji Coba Mode Varian & Tabel List Variasi (`has_variants === true`)**:
      - Memastikan minimal 1 nama opsi variasi pada Variasi 1 terisi, serta nama opsi pada Variasi 2–4 jika variasi tersebut aktif.
      - Memvalidasi seluruh baris opsi variasi aktif wajib memiliki nilai *Harga Jual* (> 0) dan *Stok* yang terisi valid (kuota angka atau Unlimited).
      - Pada tabel *List Variasi Produk* (`#combination-matrix-section`), memvalidasi kolom *Max. Order* pada setiap baris variasi aktif wajib sudah ditentukan nilainya (angka valid atau Tanpa Batas, tidak boleh kosong).
      - Jika ada baris variasi atau Max. Order yang belum terisi, sistem memblokir pembukaan uji coba, menampilkan peringatan spesifik (*"Mohon lengkapi Harga Jual, Stok, dan Max. Order pada seluruh baris variasi yang aktif."*), dan mengarahkan fokus langsung ke input baris terkait.
  - [x] **Penyempurnaan Form Produk Bagian 13: Modal Popup Peringatan Uji Coba, Pesan Dinamis Spesifik, & Validasi Layanan Extras (`js/product-form.js`, `docs/PRD_MASTER.md`)**:
    - **Modal Popup Pratinjau Interaktif**:
      - Mengganti banner kuning inline pada header pratinjau menjadi Modal Popup yang elegan di dalam area frame pratinjau (`#preview-scoped-modal-root` & `#preview-scoped-modal-root-mob`) dengan latar gelap transparan (`bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-2xs`) dan kotak modal putih bersih (`bg-white rounded-xl shadow-2xl p-4 sm:p-5 max-w-[240px] text-center space-y-3 animate-modal-pop`).
      - Judul utama: *"Silahkan Lengkapi Informasi Penjualan Terlebih Dahulu"*.
      - Sub-pesan dinamis: Menyebutkan hanya parameter-parameter spesifik yang kosong atau belum valid dalam kotak kontras (`bg-amber-50/90 border-amber-200/80`).
      - Tombol aksi: Tombol konfirmasi *"OK / Mengerti"* dengan aksen tema `var(--color-primary)` yang saat diklik otomatis menutup modal dan mengarahkan fokus kursor (`focus()`, `scrollIntoView()`, visual highlight ring 3 detik) langsung ke elemen input pertama yang belum lengkap.
    - **Pesan Dinamis Spesifik (Hanya Bagian yang Belum Valid)**:
      - Mode Tanpa Variasi: Memeriksa dan merinci secara spesifik jika *Nama Produk*, *Kategori*, *Harga Jual*, *Stok Produk*, atau *Maksimal Jumlah Pembelian* yang belum valid.
      - Mode Varian & Matriks List Variasi: Memeriksa dan merinci nama baris opsi variasi yang belum valid (contoh: *Harga Jual (Merah)*, *Max. Order (Biru)*).
      - Mode Layanan Ekstra (Extras): Memeriksa opsi layanan extras aktif (`primaryState.has_extra_service` / `finishingsState.extra_3`) dan merinci kekurangan pada *Jenis Input*, *Harga Satuan*, maupun *Stok* per opsi (contoh: *Jenis Input Extras (Packaging Kayu)*, *Harga Satuan Extras (Packaging Kayu)*).
  - [x] **Penyempurnaan Form Produk Bagian 14: Perluasan Validasi Uji Coba Mencakup Seluruh Variasi 1 s.d. 4 & Matriks Kombinasi (`js/product-form.js`, `docs/PRD_MASTER.md`)**:
    - **Validasi Menyeluruh Opsi Varian Tier 1 s.d. Tier 4**:
      - Memvalidasi seluruh grup variasi aktif (`Tier 1` / `materialsState`, `Tier 2` / `finishingsState.main`, `Tier 3` / `finishingsState.extra_1`, dan `Tier 4` / `finishingsState.extra_2`).
      - Memastikan setiap grup variasi memiliki minimal 1 opsi dengan nama yang valid.
      - Memeriksa setiap baris opsi yang terisi namanya agar memiliki *Harga Jual* (`price > 0`) dan *Stok* (`stock >= 0` atau berstatus *Unlimited*) yang valid.
      - Mendukung aturan *Sama untuk Semua* (`same_price_tiers`, `same_cost_tiers`, dan `stock_mode_tiers`) per tier.
      - Merinci kekurangan parameter secara spesifik pada modal popup interaktif (contoh: *"Harga Jual (Variasi 2 - XL)"*, *"Stok Produk (Variasi 3 - Panjang)"*).
    - **Validasi Ketat Matriks Kombinasi Varian (`#combination-matrix-section`)**:
      - Memeriksa seluruh baris kombinasi pada tabel *List Variasi Produk*.
      - Memastikan kolom *Max. Order* pada setiap baris kombinasi aktif terisi nilai valid (angka > 0 atau status *"Tanpa Batas"*, tidak boleh kosong `""` / `null`).
      - Menampilkan pesan dinamis spesifik per baris kombinasi yang belum ditentukan nilai Max. Order-nya (contoh: *"Max. Order (Baris Kombinasi Merah)"*).
  - [x] **Penyempurnaan Form Produk Bagian 15: Validasi Wajib Extras, Format Reaktif Label Variasi & Extras, serta Pembersihan Tampilan Placeholder Opsi Kosong pada Pratinjau (`js/product-form.js`, `docs/PRD_MASTER.md`)**:
    - **Validasi Wajib Layanan Ekstra (Extras) pada Uji Coba (`canActivateTestMode`)**:
      - Memastikan setiap baris extras aktif yang terisi namanya wajib melengkapi: *Jenis Input* (`extra_type` wajib dipilih), *Harga Satuan* (`price >= 0`), dan *Stok* (`stock >= 0` atau berstatus *Unlimited*).
      - Menampilkan rincian kekurangan parameter extras secara spesifik pada modal popup pratinjau (contoh: *"Jenis Input Extras (Packaging Kayu)"*, *"Harga Satuan Extras (Packaging Kayu)"*, *"Stok Extras (Packaging Kayu)"*).
    - **Format Label Reaktif di Luar Drawer vs Murni Normal di Dalam Drawer**:
      - **Di Dalam Drawer (Shopee-Style / Mini PDP Drawer)**: Render teks Judul Variasi dan Layanan Extras secara normal dan murni apa adanya tanpa penggabungan teks opsi aktif.
      - **Di Luar Drawer (Live Preview Kartu Etalase Mini PDP)**:
        - Jika belum ada opsi yang dipilih: Tampilkan `"Tersedia [(Jumlah Opsi)] [Judul Variasi]"` (contoh: *"Tersedia (3) Bahan Utama"*).
        - Jika sudah ada opsi yang dipilih: Tampilkan penggabungan antara Judul Variasi (tebal standar) dan Nilai Opsi (teks abu-abu tipis) dengan struktur `[Judul Variasi] <span class="font-normal text-slate-400 ml-1.5">[Nilai Opsi]</span>` (contoh: *Bahan Utama <span class="font-normal text-slate-400 ml-1.5">FC</span>*).
        - Berlaku konsisten untuk Variasi 1 s.d. 4 dan Layanan Extras di kartu pratinjau.
    - **Pembersihan Total Fallback Nama Produk & Kunci Mutlak Format Label Luar Drawer**:
      - **Hapus Total Penarikan Nama Produk & Format `Opsi 1`**: Menghilangkan sepenuhnya format `[Judul] Opsi 1` serta perilaku/variabel yang mengambil `primaryState.name` atau nama produk sebagai nama variasi atau opsi pada kartu pratinjau dan `materialsState`.
      - **Kunci Format Reaktif di Luar Drawer (Live Preview Mini PDP)**:
        - Jika belum ada opsi yang dipilih (atau opsi masih kosong): Wajib menampilkan format **`Tersedia [(Jumlah Opsi)] [Judul Variasi]`** (contoh: *Tersedia (1) Bahan Utama* atau *Tersedia (2) Ukuran*).
        - Jika sudah ada opsi yang dipilih: Wajib menampilkan format **`[Judul Variasi] <span class="font-normal text-slate-400 ml-1.5">[Nilai Opsi]</span>`** (contoh: *Bahan Utama <span class="font-normal text-slate-400 ml-1.5">FC</span>*).
        - Jika judul grup belum diisi merchant, otomatis menggunakan default tier (`"Variasi 1"`, `"Variasi 2"`, dst).
      - **Pertahankan Judul Murni di Dalam Drawer (Shopee-Style Drawer)**: Di dalam drawer modal, judul variasi tetap dirender murni apa adanya (`[Judul Variasi]`) tanpa tambahan teks opsi terpilih.
  - [x] **Penyempurnaan Form Produk Bagian 16: Otomatisasi Aturan Spesifik Variasi 2–4 di Pratinjau Uji Coba & Kunci Posisi Baris Dikirim Dari Selalu Paling Bawah di Drawer Spesifikasi (`js/product-form.js`, `js/pdp.js`, `admin.html`, `docs/PRD_MASTER.md`)**:
    - **Otomatisasi Aturan Spesifik Variasi 2 s.d. 4 pada Pratinjau Uji Coba**:
      - Menyaring dan menonaktifkan (`disabled`, `opacity-40 line-through cursor-not-allowed pointer-events-none`) opsi Variasi 2, Variasi 3, dan Variasi 4 yang tidak diizinkan berdasarkan `primaryState.specific_options_map` dan `primaryState.variation_scopes` saat Variasi 1 dipilih.
      - Mendukung seluruh kontrol interaktif (Chip Opsi, Accordion Opsi, dan Shadcn Popover Select) serta kartu etalase Mini PDP.
      - Menerapkan auto-reset cerdas ke opsi pertama yang valid jika opsi yang sebelumnya dipilih menjadi tidak valid akibat perubahan pilihan Variasi 1.
      - Mengintegrasikan resolusi kombinasi variasi (`resolveActiveCombinationRule`) untuk batas minimum pembelian (`min_order`), batas maksimum pembelian (`max_order`), kelipatan pembelian (`order_multiple`), dan tingkatan harga grosir (`wholesale_tiers`) secara reaktif pada live pricing dan tombol kuantitas.
      - Menerapkan penegakan aturan spesifik yang sama pada halaman detail produk pembeli (`js/pdp.js`) untuk Variasi 2 dan Variasi Ekstra 3 & 4.
    - **Kunci Posisi Baris Dikirim Dari Selalu di Paling Bawah pada Drawer & Tab Spesifikasi**:
      - Memastikan baris "Dikirim Dari" selalu berada di urutan paling akhir (posisi terbawah sebelum tombol aksi) pada Drawer Spesifikasi Produk Shopee-Style (`buildProductSpecDrawerHtml`) dan Tab Spesifikasi PDP (`renderTabs`).
      - Mengumpulkan baris wajib dan kondisional (*Stok, Merek, Jenis Garansi, Masa Garansi, Produk Custom, Kondisi Produk, Pre-Order, Min. Pembelian, Harga Grosir, Kelipatan Pembelian, Asal Produk, SKU Induk, dan Custom Specs*), memotong maksimal 9 baris pertama, lalu menyematkan "Dikirim Dari" sebagai baris penutup dengan total 5 hingga 10 baris terstruktur rapi.
    - **Pembaruan Cache Version `admin.html`**: Menaikkan cache buster script dan stylesheet admin menjadi `?v=8.1`.
  - [x] **Penyempurnaan Form Produk Bagian 17: Penyeragaman Ukuran & Warna Teks Header Variasi serta Keterangan Opsi Terpilih di Luar & Dalam Drawer (`js/product-form.js`, `docs/PRD_MASTER.md`)**:
    - **Penyeragaman Ukuran & Warna Header Variasi Luar Drawer (`formatVariationReactiveHeader` & Mini PDP)**:
      - Menyeragamkan ukuran font header variasi saat belum ada opsi yang dipilih (`Tersedia (N) [Judul Variasi]`) maupun saat sudah ada opsi yang dipilih (`[Judul Variasi]: [Opsi Terpilih]`) menjadi 100% identik kecil dan rapi (`text-[11px] leading-tight`).
      - Membedakan status seleksi murni lewat warna & ketebalan teks: sebelum dipilih berwarna abu-abu tipis (`text-slate-400 font-normal`), dan setelah dipilih judul variasi menggunakan `font-medium text-slate-700` didampingi nama opsi `font-normal text-slate-400 ml-1`.
      - Membersihkan seluruh wrapper kontainer Mini PDP agar bebas dari kelas pemaksa font-size besar (`text-xs` / `font-bold`).
    - **Tampilan Teks Kecil Keterangan Opsi di Luar Drawer (Mini PDP)**:
      - Menampilkan teks keterangan opsi (`text-[10px] text-slate-400 font-normal leading-relaxed mt-1.5`) tepat di bawah deretan chip Variasi 1 dan Variasi 2 ketika opsi yang sedang aktif memiliki keterangan (`description`).
      - Menyembunyikan elemen keterangan secara otomatis jika belum ada opsi yang dipilih atau opsi terpilih tidak memiliki keterangan.
      - Ter-update secara reaktif dan instan baik saat seller mengklik opsi di luar drawer maupun saat mengetik perubahan di input form admin.
    - **Ringkasan Keterangan Opsi Terpilih di Dalam Drawer Shopee-Style**:
      - Menyematkan wadah khusus `#drawer-selected-options-descriptions` di bagian paling bawah area variasi drawer persis di atas garis pemisah Jumlah Pesanan / Footer.
      - Merangkum keterangan opsi aktif dari Variasi 1 s.d. Variasi 4 dengan format `[Judul Variasi]: [Keterangan Opsi]` (`text-[11px] leading-snug text-slate-500`).
      - Menyembunyikan kontainer secara otomatis (`hidden`) jika tidak ada variasi aktif yang memiliki keterangan, dan memperbarui isinya secara real-time pada setiap perubahan pilihan variasi (Chip, Accordion, maupun Shadcn Popover Select).
  - [ ] Upgrade `js/product-form.js`: Input 4 tipe produk dan konfigurasi DP.
  - [ ] Upgrade `js/category-manager.js`: Input komisi affiliate per-kategori.
  - [ ] Pembuatan tampilan dan logika **Riwayat Mutasi Stok** (`#view-stock-mutation`) di `admin.html` dan `admin-app.js`.
  - [ ] Upgrade **Manajemen Pesanan 3 Lapis Status** (`payment_status`, `order_status`, `production_status`) di Admin Panel.

- [ ] **TAHAP 6: POS Kasir Upgrade (Dukungan DP, Tambah Pelanggan, Integrasi IndexedDB & Shared Invoice Counter)**
  - [ ] Dukungan input pembayaran Down Payment (DP) langsung di layar Kasir POS.
  - [ ] Pembaruan cetak struk thermal 58mm/80mm memuat rincian DP dan sisa tagihan.
  - [ ] Fitur tambah pelanggan cepat (*Quick Add Customer*) di layar POS.
  - [ ] Integrasi modul IndexedDB `offline-db.js` dan shared invoice sequence.

- [ ] **TAHAP 7: Marketing Engine, Affiliate System (Per-Produk/Kategori & Withdrawal), serta CMS Terpadu**
  - [ ] Pengaturan promosi popup, kupon voucher, dan flash sale di `js/promo-manager.js`.
  - [ ] **Rencana Penambahan Submenu `Marketing > Affiliate`**: Mengatur komisi afiliasi secara Global (default seluruh produk toko) maupun Spesifik per Produk / Kategori, riwayat komisi referral, audit transaksi afiliasi, dan verifikasi persetujuan pencairan saldo (withdrawal).
  - [ ] Integrasi pembacaan komisi per-produk (`has_affiliate_commission`) dan fallback komisi global/kategori pada kalkulasi order affiliasi.
  - [ ] Pembuatan modul CMS Terpadu di Admin Panel (Blog & Artikel SEO, Banner Slider, Testimoni, Halaman Statis).

- [ ] **TAHAP 8: Pengaturan Integrasi Terpadu (DOKU, KiriminAja, PPN, Fonnte Broadcast) & Persiapan Migrasi Backend**
  - [ ] **Konfigurasi Lokasi Bertingkat Seller di Pengaturan Akun**: Penetapan hirarki lokasi Seller (Negara, Provinsi, Kota/Kabupaten, Kecamatan, Desa/Kelurahan) pada saat pendaftaran maupun di menu Akun / Pengaturan Toko (`settings.html`), dilengkapi toggle tampilkan lokasi publik dan arahan pengaktifan lokasi otomatis jika produk memerlukan jasa kirim.
  - [ ] Pembuatan tab konfigurasi DOKU, KiriminAja, Pajak PPN, dan WhatsApp Fonnte di `settings.html` dan `js/settings.js`.
  - [ ] Pembuatan fitur WhatsApp Broadcast massal dengan proteksi anti-ban delay queue.
  - [ ] Pembaruan skema `prisma/schema.prisma` mencakup seluruh entitas baru.
  - [ ] Pembuatan REST API endpoint Node.js / penyusunan rute migrasi ke Laravel 12 + React 18 (Inertia.js v2).

---
*Dokumen ini sah dan mengikat seluruh alur kerja pengembangan proyek POS By Songer Creative.*
