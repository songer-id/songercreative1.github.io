# MASTER PRD (PRODUCT REQUIREMENT DOCUMENT) & ARSITEKTUR SISTEM
## POS & E-COMMERCE PERCETAKAN TERPADU - SONGER CREATIVE
**Single Source of Truth (SSOT) & Technical Compass**  
**Dokumen Acuan**: `docs/PRD_MASTER.md`  
**Status Proyek**: Aktif - Tahap Pengembangan Menyeluruh  
**Terakhir Diperbarui**: 29 Oktober 2026  

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
      - Saat Variasi 1 (`Tier 1`) dipilih di kartu Mini PDP maupun di dalam Drawer Checkout (baik mode Chip tombol, Accordion, maupun Shadcn Popover Dropdown), opsi pada Variasi 2, 3, dan 4 yang tidak diizinkan oleh aturan spesifik otomatis disembunyikan (`hidden`), bukan sekadar dicoret atau dinonaktifkan (diperbarui pada SC-ADMIN-TRIAL-VARIATIONS-01).
      - Jika opsi yang sebelumnya sedang terpilih pada Variasi 2, 3, atau 4 tidak lagi valid setelah pengguna mengganti pilihan induk, sistem mengosongkan pilihan menjadi `null` tanpa pemilihan otomatis pengganti, serta menyembunyikan grup variasi jika seluruh induk telah terpecahkan namun tidak ada opsi yang tersedia (diperbarui pada SC-ADMIN-TRIAL-VARIATIONS-01).
      - Mengimplementasikan `resolveActiveCombinationRule()` untuk memecahkan aturan minimal pesanan (`min_order`), batas maksimal pesanan (`max_order`), kelipatan pesanan (`order_multiple`), dan tingkatan harga grosir (`wholesale_tiers`) berdasarkan kombinasi varian yang sedang aktif terpilih.
      - Menghubungkan perhitungan harga grosir dinamis di `updateShopeeDrawerLivePricing()` dengan indikator banner diskon grosir di drawer dan memperbarui status enabled/disabled tombol kuantitas `[-]` dan `[+]` via `updateDrawerQtyButtonsState()`.
    - **Penerapan Otomatisasi Variasi Spesifik pada Halaman Detail Produk Pembeli (`js/pdp.js`)**:
      - Menambahkan `updateFinishingAllowedState(selectedMatId)` pada konfigurator PDP: opsi finishing utama (`mainOptions`) otomatis difilter dan dinonaktifkan jika berada di luar cakupan spesifik bahan yang dipilih pembeli, serta otomatis mengarahkan pilihan ke opsi valid pertama.
    - **Kunci Posisi 'Dikirim Dari' Selalu Paling Bawah di Drawer Spesifikasi & Tab PDP (`js/product-form.js` & `js/pdp.js`)**:
      - Pada `buildProductSpecDrawerHtml()` (`js/product-form.js`) dan tab Spesifikasi produk (`js/pdp.js`), seluruh baris wajib, kondisional, dan baris manual seller dikumpulkan terlebih dahulu ke dalam `otherRows` (tanpa "Dikirim Dari").
      - `otherRows` dipotong maksimal 9 baris teratas (`otherRows.slice(0, 9)`), kemudian baris `Dikirim Dari` ditambahkan sebagai elemen penutup paling akhir (`finalRows.push({ label: 'Dikirim Dari', ... })`).
      - Menjamin 100% posisi `Dikirim Dari` selalu berada di urutan paling bawah (tepat di atas tombol CTA "Oke") dengan total baris tetap terkunci antara 5 hingga 10 baris.
    - **Cache Version Bump**: Menaikkan cache query string di `admin.html` menjadi `?v=8.1`.
  - [x] **Penyempurnaan Detail Produk Uji Coba Admin & Judul Dinamis Modal Ketersediaan Opsi (Task SC-ADMIN-TRIAL-VARIATIONS-01) (`js/product-form.js`, `js/variation-engine.js`, `docs/PRD_MASTER.md`)**:
    - **Penyelarasan Ketersediaan & Pemilihan Variasi pada Mode Uji Coba Admin**:
      - Mengacu pada konfigurasi `variation_dependencies` (V2 DAG) dan fallback warisan (`variation_scopes`) sebagai sumber kebenaran tunggal.
      - **Menyembunyikan Opsi Spesifik yang Tidak Tersedia**: Opsi variasi spesifik yang tidak memenuhi syarat pemicu (trigger) disembunyikan sepenuhnya (`hidden`), bukan sekadar dicoret (`line-through`) atau dinonaktifkan, di seluruh mode tampilan: Chip tombol, Accordion, dan Dropdown Popover Shadcn, baik pada kontainer pratinjau desktop (`#desktop-preview-sidebar`) maupun mobile sheet (`#mobile-preview-sheet`).
      - **Rekonsiliasi Pemilihan Turunan Tanpa Penggantian Otomatis**: Saat opsi induk diubah atau dikosongkan, seluruh opsi turunan yang tidak lagi valid dikosongkan menjadi `null` tanpa memilih opsi pengganti secara otomatis. Opsi umum/independen yang masih valid tetap dipertahankan.
      - **Penyembunyian Grup Variasi Kosong Terpecahkan (Resolved Absence)**: Jika seluruh pilihan induk telah dipilih namun tidak ada satu pun opsi yang tersedia pada variasi turunan (`allowedIds.length === 0`), kelompok variasi tersebut disembunyikan dan dianggap terpenuhi (satisfied) sehingga tidak memblokir validasi checkout, sembari membedakannya secara tegas dari kondisi induk yang belum dipilih (pending parent).
      - **Proteksi Event Listener & Keterangan Dinamis**: Opsi yang tersembunyi tidak dapat mengubah state melalui event klik, teks ringkasan akordeon/select segera sinkron, dan ringkasan keterangan opsi (`#drawer-selected-options-descriptions`) diperbarui reaktif tanpa menyisakan teks basi.
    - **Judul Dinamis Modal Ketersediaan Opsi (`#modal-option-dependency`)**:
      - Menampilkan format judul presisi: `Tipe Ketersediaan Opsi: [Nama Opsi] ([Judul Label Variasi])` (contoh: `Tipe Ketersediaan Opsi: CCC (Finishing)`).
      - Menyelesaikan nama opsi dan label variasi target secara dinamis dari input terkini seller (termasuk input unsaved) dengan fallback nomor variasi resmi.
    - **Revisi R1 (SC-ADMIN-TRIAL-VARIATIONS-01-R1)**:
      - **Pembatasan Mesin Bersama (Scoped Engine)**: Perilaku *grup kosong terpecahkan dianggap terpenuhi* (`isEmptyResolved`) dibatasi secara ketat hanya untuk pemanggil Admin eksplisit via opsi `{ context: 'admin' }` (atau `scope: 'admin'`). Pemanggil default/tanpa parameter (seperti `js/pdp.js` pada halaman pembeli dan unit test) tetap mempertahankan kontrak mesin bersama aslinya: kelompok variasi yang kosong tanpa aturan lewati (`isSkipped`) tetap dianggap belum lengkap (`isComplete: false`, tercatat dalam `missingTiers`, berstatus `unselected`).
      - **Ketepatan Kontrak Aturan Lewati (`skip_rules`)**: Menghapus properti fallback artefak pengujian (`trigger_id` / `trigger_option_id`) dari `isTierSkipped()` pada `js/variation-engine.js`. Kontrak aturan lewati dikembalikan murni mengevaluasi `rule.trigger_ids` bertipe array sesuai skema produksi pada `js/product-form.js`.
      - **Integritas Pekerjaan Sebelumnya**: Penyelarasan file sebelumnya dijelaskan secara transparan perihal ketiadaan baseline working buffer uncommitted independen di luar commit `25c0bc2`, tanpa spekulasi atau rekonstruksi liar.
    - *Catatan Verifikasi*: Logika runtime dan event/render telah diverifikasi lulus 16/16 pengujian Node.js serta pengujian unit verifikasi R1. Verifikasi visual tampilan/interaksi langsung di browser dicatat sebagai agenda verifikasi manual oleh pemilik proyek.
  - [x] **Penyempurnaan UI Pengaturan Opsi dan Max. Order (`js/product-form.js`, `docs/PRD_MASTER.md`)**:
    - **Perapian Modal Ketersediaan Opsi (`#modal-option-dependency`)**:
      - Mempertahankan format judul presisi: `Tipe Ketersediaan Opsi: [Nama Opsi] ([Judul Label Variasi])` dengan dukungan *wrap* judul panjang (`break-words`) dan tombol tutup tetap stabil (`shrink-0`).
      - Menyederhanakan kontrol Umum/Spesifik menjadi satu kontrol terpadu sejajar yang ringkas dengan status visual terpilih yang tegas (indikator dot dan kontras warna tema).
      - Mengganti dua paragraf sejajar berulang dengan satu keterangan singkat dinamis (`#dep-mode-desc`) yang reaktif mengikuti mode aktif.
      - Pada mode Spesifik, menerapkan susunan hierarki vertikal yang bersih: Variasi Induk $\rightarrow$ Pilihan Pemicu $\rightarrow$ Daftar Opsi.
      - Merapikan daftar opsi pemicu menjadi satu wadah terpadu dengan pemisah garis tipis (`divide-y divide-slate-100`) tanpa kotak ber-border ganda yang bertumpuk.
      - Menjaga area isi tetap dapat digulir mandiri (`overflow-y-auto`) dengan header dan tombol aksi footer (Batal / Simpan) yang selalu terlihat.
    - **Peniadaan Panel Aturan Lewati Variasi Berikutnya dari Antarmuka Admin**:
      - Menghilangkan panel accordion "Aturan Lewati Variasi Berikutnya" (`renderSkipRulesSectionMarkup` mengembalikan string kosong) dari render form Admin tanpa menambahkan komponen pengganti.
      - Menjamin seluruh data aturan lewati yang telah tersimpan pada `variation_dependencies.skip_rules`, kompatibilitas evaluasi di mesin variasi runtime (`VariationEngine.isTierSkipped`), dan alur penyimpanan produk tetap utuh 100%.
    - **Indikator Warna Gerigi Pengaturan Ketersediaan Opsi**:
      - Menetapkan warna gerigi pengaturan opsi variasi sesuai status konfigurasi aktual:
        - **Umum**: Menggunakan warna teks netral (`text-slate-500 hover:text-slate-700`).
        - **Spesifik**: Menggunakan warna aksen tema aktif (`text-[var(--color-primary)]`).
        - **Opsi Belum Lengkap**: Tetap nonaktif (`disabled`, `opacity-35 cursor-not-allowed pointer-events-none text-slate-400`).
      - Menyematkan `aria-label` dan tooltip `title` eksplisit (`"Ketersediaan opsi: Umum"` atau `"Ketersediaan opsi: Spesifik"`).
      - Status diperbarui secara reaktif setelah modal disimpan, form dirender ulang, atau saat membuka data produk untuk diedit, tanpa mengubah status jika seller menekan Batal.
      - Gerigi dan kontrol kolom matriks kombinasi Variasi 2–4 tetap dipertahankan murni tanpa dialihfungsikan.
    - **Penyempurnaan Input Max. Order pada List Variasi Produk**:
      - Mengubah tipe elemen `.combo-max-order-input` menjadi `type="number"` dengan `step="1"` dan `min="1"`.
      - Mempertahankan saran "Tanpa Batas" melalui popover kustom tanpa bergantung pada datalist teks.
      - Saat saran dipilih, `value` input numerik tetap string kosong (`""`) dan `placeholder` menjadi `"Tanpa Batas"`, sedangkan state menyimpan representasi tanpa batas yang sah (`mat.max_order = null` dan `mat.is_unlimited_max_order = true`). Nilai non-numerik tidak pernah dimasukkan ke dalam `value` input number.
      - Saat angka dimasukkan, input menampilkan angka dan menyimpan nilai integer positif ke state melalui alur yang ada.
      - Placeholder `"Input/Pilih"` dipertahankan untuk kondisi awal baris variasi yang belum ditentukan nilainya.
      - Sinkronisasi event input, change, blur, re-render matriks kombinasi, dan validasi form diintegrasikan secara selaras tanpa saling menimpa.
    - *Catatan Verifikasi*: Seluruh verifikasi logika unit testing telah lulus 100% via Node.js CLI (verifikasi modal, peniadaan panel, persistensi data skip_rules, warna gerigi, dan siklus hidup Max. Order). Verifikasi visual langsung pada browser menjadi agenda pemeriksaan oleh pemilik proyek.
  - [x] **Alih Fungsi Kolom Matriks Variasi 2–4 Menjadi Ringkasan Ketersediaan & Pembenahan Diagnostik Editor (`js/product-form.js`, `tests/variation-config.spec.js`, `tests/fixtures/test-data.js`, `docs/PRD_MASTER.md`)**:
    - **Alih Fungsi Kolom Variasi 2–4 pada List Variasi Produk (`js/product-form.js`)**:
      - Mengganti kontrol interaktif lama "Pilih/Umum/Spesifik" dan tombol gerigi/pensil pada sel matriks kombinasi menjadi ringkasan ketersediaan opsi hanya baca (*read-only*).
      - Menjaga label dan kolom variasi seller tetap utuh dengan tata letak sel rata kiri (*left-aligned*), sejajar vertikal, tanpa kotak input, border dekoratif, maupun ikon pengaturan. Teks nama opsi panjang dipotong rapi menggunakan `truncate` (CSS ellipsis) tanpa merusak lebar kolom tabel.
      - Menerapkan format ringkasan yang disetujui:
        - `"Semua opsi"`: seluruh opsi pada variasi terkait berlaku tanpa syarat pilihan lanjutan.
        - `"[Opsi 1], [Opsi 2] +N"` (contoh: `"Kis, Die +1"`): menampilkan maksimal dua nama opsi yang berlaku; badge `+N` (diformat dengan `text-[var(--color-primary)] font-semibold`) menunjukkan jumlah opsi berlaku lainnya.
        - `"Sesuai [Label Induk]"` (atau `"Sesuai [Label Induk] +N"` jika bergantung pada lebih dari 1 variasi induk): ketersediaan masih bergantung pada pilihan variasi lain sebelumnya.
        - `"—"`: benar-benar tidak ada opsi yang berlaku untuk baris Variasi 1 tersebut (bukan karena pilihan induk lanjutan belum ditentukan).
      - Menghitung ketersediaan per baris secara deterministik hanya berdasarkan ID opsi Variasi 1 (`mat.id`) pada baris terkait melalui konfigurasi `variation_dependencies` (dan fallback migrasi warisan) tanpa mengambil contoh pilihan dari `previewTestState` atau memilihkan opsi turunan secara otomatis.
      - **Popover Ringkas Hanya-Baca**: Interaksi klik, sentuh, atau keyboard (Enter / Space) pada sel ringkasan membuka popover melayang (*fixed singleton*, tidak terpotong oleh overflow scroll kontainer tabel) yang menampilkan daftar lengkap opsi berlaku, opsi tidak berlaku, serta rincian pemicu induk secara terstruktur tanpa ada kontrol pengubah di dalamnya. Popover ditutup secara mulus via klik di luar area (*outside click*) atau tombol `Escape`.
      - **Pembaruan Reaktif**: Ringkasan diperbarui secara otomatis saat pengaturan dependensi opsi disimpan, nama opsi atau label variasi berubah, opsi ditambah atau dihapus, maupun saat data produk dimuat ulang untuk diedit.
      - **Penyelarasan Validasi Simpan & Uji Coba**: Melepas binding kontrol lama (`.btn-open-scope-modal`) dan menghapus aturan validasi warisan yang sebelumnya mewajibkan pengisian langsung pada sel matriks variasi 2–4, sementara validasi DAG dependensi opsi riil tetap terjaga kokoh.
    - **Pembenahan Diagnostik Editor pada `tests/variation-config.spec.js`**:
      - Mengidentifikasi akar penyebab 18 diagnostik TypeScript / JSDoc:
        1. Properti `product` dan `products` belum tercantum dalam JSDoc `@param [options]` fungsi `injectDeterministicStorage` di `tests/fixtures/test-data.js` (`TS2353`).
        2. Penggunaan global peramban klien (`AdminApp`, `ProductForm`, `DB`) di dalam callback `page.evaluate()` belum terdefinisi dalam cakupan tipe pengujian Node.js (`TS2304`).
        3. Properti `checked` pada elemen hasil `document.getElementById('toggle-enable-custom-labels')` yang terinferensi sebagai `HTMLElement` bukan `HTMLInputElement` (`TS2339`).
      - Menyelesaikan penyebab akar secara bersih tanpa menghapus pengujian, tanpa `@ts-nocheck`, dan tanpa menambahkan `.skip` / `.only`:
        - Menambahkan definisi JSDoc `@param {any} [options.product]` dan `@param {any[]} [options.products]` pada `tests/fixtures/test-data.js`.
        - Menambahkan deklarasi ambient global peramban yang dievaluasi di `page.evaluate` pada `tests/variation-config.spec.js`.
        - Menambahkan type cast `/** @type {HTMLInputElement | null} */` pada pemanggilan `document.getElementById('toggle-enable-custom-labels')`.
      - Menjalankan pemeriksaan kompilator TypeScript IDE Antigravity: Diagnostik pada `tests/variation-config.spec.js` tuntas 100% (0 error).
    - *Catatan Verifikasi*: Logika ketersediaan matriks diverifikasi lulus 7/7 skenario unit test berbasis Node.js CLI tanpa kegagalan. Seluruh file lulus verifikasi sintaks `node --check`.
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
  - [x] **Penyempurnaan Form Produk Bagian 18: Revisi Format Keterangan Opsi Terpilih Drawer, Harga Header Murni Satuan, dan Penggantian Total Pembayaran Menjadi Teks Ketentuan/Peringatan Order (`js/product-form.js`, `docs/PRD_MASTER.md`)**:
    - **Revisi Format Keterangan Opsi Terpilih di Dalam Drawer (`buildDrawerSelectedOptionsDescriptionsHtml`)**:
      - Menghapus judul variasi (`[Judul Variasi]:`) dan menghapus seluruh teks tebal (`font-medium` / `font-bold`).
      - Menggabungkan nilai keterangan dari Variasi 1 s.d. Variasi 4 yang sedang terpilih menggunakan pemisah tanda koma dan spasi (`, `) dalam satu baris teks mengalir abu-abu tipis (`text-[11px] font-normal text-slate-400 leading-relaxed`).
      - Menyembunyikan kontainer `#drawer-selected-options-descriptions` secara otomatis (`hidden`) apabila tidak ada variasi terpilih yang memiliki keterangan.
    - **Harga di Header Atas Drawer Murni Harga Satuan Tanpa Dikali Qty**:
      - Memastikan harga utama pada header drawer (`.drawer-header-price` dan `.drawer-header-strike-price`) murni menampilkan harga satuan efektif (per 1 pcs) dari kombinasi varian, ukuran P×L, dan layanan ekstra yang dipilih.
      - Menjamin angka Qty (`+` / `-`) tidak melipatgandakan harga di header atas drawer, melainkan hanya menyesuaikan harga satuan secara dinamis jika kuantitas memenuhi tier Harga Grosir atau batas promo diskon.
    - **Penggantian Total Pembayaran Menjadi Teks Peringatan / Ketentuan Order Reaktif (`#shopee-drawer-order-notice`)**:
      - Menghilangkan sepenuhnya teks `"Total Pembayaran:"` beserta nominal total harga dari bagian bawah drawer.
      - Menggantikannya dengan wadah teks penyesuaian/peringatan ketentuan pesanan yang reaktif (`#shopee-drawer-order-notice`):
        - Peringatan batas maksimal/promo: `"Harga promo berlaku untuk maksimal ${maxOrder} pcs"` atau `"Maksimal pembelian ${maxOrder} pcs per pesanan"`.
        - Peringatan batas minimal order: `"Minimal pembelian ${minOrder} pcs"`.
        - Ketentuan kelipatan pesanan: `"Jumlah pesanan wajib kelipatan ${stepMult} pcs"`.
        - Status / penawaran harga grosir: `"Harga grosir Rp[nominal]/pcs diterapkan"` atau `"Beli min. [N] pcs untuk harga grosir Rp[nominal]/pcs"`.
      - Ditampilkan dengan tipografi rapi (`text-[11px] font-normal text-amber-600` atau warna proporsional) dan otomatis tersembunyi (`hidden`) jika tidak ada ketentuan aktif pada kondisi saat itu.
  - [x] **Penyempurnaan Form Produk Bagian 19: Otomatisasi Aturan Spesifik Variasi 2-4 di Pratinjau Uji Coba Drawer & Mini PDP, dan Penguncian Posisi "Dikirim Dari" Selalu Paling Bawah di Drawer Spesifikasi (`js/product-form.js`, `js/pdp.js`, `admin.html`, `docs/PRD_MASTER.md`)**:
    - **Otomatisasi Aturan Spesifik Variasi 2 s.d. Variasi 4**:
      - Mendeteksi scope `spesifik` vs `umum` dari `variation_scopes` dan pemetaan `specific_options_map` per opsi Variasi 1 (`materialsState`).
      - Mengunci dan menonaktifkan (`disabled`, `opacity-40 cursor-not-allowed line-through pointer-events-none`) opsi Variasi 2, Variasi 3, dan Variasi 4 yang tidak diizinkan pada seluruh tipe tampilan (Chip, Accordion, dan Popover Select Shadcn) baik di Drawer maupun kartu Mini PDP.
      - Menerapkan auto-reset pilihan: jika opsi yang terpilih sebelumnya menjadi tidak valid saat pengguna beralih opsi Variasi 1 atau opsi tingkat atas, sistem otomatis mengalihkan pilihan ke opsi valid pertama.
      - Sinkronisasi matriks kombinasi ke batas `min_order`, `max_order`, `order_multiple`, dan diskon grosir bertingkat dengan pembaruan dinamis teks peringatan ketentuan pesanan (`#shopee-drawer-order-notice`).
    - **Kunci Posisi "Dikirim Dari" Selalu Paling Bawah di Drawer Spesifikasi & Tab PDP**:
      - Memisahkan `"Dikirim Dari"` dari pengumpulan baris umum/kondisional.
      - Membatasi baris informasi lainnya maksimal 9 baris (`otherRows.slice(0, 9)`), kemudian menyematkan `"Dikirim Dari"` sebagai entri terakhir.
      - Memastikan total baris selalu berada di antara 5 hingga 10 baris dengan posisi `"Dikirim Dari"` dijamin 100% konsisten berada tepat di atas tombol CTA Oke di Drawer Spesifikasi dan di bagian bawah tabel spesifikasi PDP.
    - **Penyelarasan Desain SaaS Flat & Penghapusan Redundansi**:
      - Menghapus banner kuning statis duplikat di header drawer karena status ketentuan grosir dan kelipatan telah ditangani secara elegan dan kontekstual oleh teks peringatan `#shopee-drawer-order-notice`.
      - Menghapus bayangan kaku (`shadow-md`) pada tombol CTA Beli Sekarang / Keranjang dan tombol Oke Drawer Spesifikasi, beralih ke `shadow-none` dengan efek `hover:opacity-95` dan active scale untuk kesan flat SaaS profesional.
    - **Cache Version Bump**:
      - Memperbarui query string cache pada seluruh aset CSS dan script di `admin.html` ke `?v=8.1`.
  - [x] **Penyempurnaan Form Produk Bagian 20: Tipografi Harga Rp Kecil & font-semibold, Penghapusan Default Harga 25.000, Otomatisasi Font Nama Produk >65 Karakter, serta Perbesar Thumbnail & Kurangi Radius Drawer (`js/product-form.js`, `js/utils.js`, `docs/PRD_MASTER.md`)**:
    - **Tipografi Harga Rp Lebih Kecil & Ketebalan font-semibold (`formatPriceHtmlWithSmallRp` & `formatPriceRangeHtmlWithSmallRp`)**:
      - Menyediakan fungsi helper terpusat `formatPriceHtmlWithSmallRp(num)` dan `formatPriceRangeHtmlWithSmallRp(minNum, maxNum)` di `js/product-form.js` dan `js/utils.js`.
      - Teks `"Rp"` dirender lebih kecil dan proporsional (`<span class="text-[0.72em] font-medium mr-[1px]">Rp</span>`) didampingi angka nominal `font-semibold`.
      - Menghapus ketebalan `font-extrabold` / `font-black` pada harga utama Kartu Produk (Model A/B/C Step 1), Mini PDP (Step 2), dan Header Drawer (`.drawer-header-price`), digantikan dengan `font-semibold` yang bersih dan elegan.
      - Pada `updateShopeeDrawerLivePricing()`, pembaruan `.drawer-header-price` menggunakan `.innerHTML` untuk mempertahankan tag `"Rp"` kecil dan `font-semibold` secara reaktif saat opsi variasi berganti.
    - **Penghapusan Default Harga 25.000 (Murni Rp0 Jika Belum Diisi)**:
      - Menghapus inisialisasi default `let basePrice = 25000;` dan fallback semu `25000` / `50000` pada simulasi diskon.
      - Menginisialisasi `let basePrice = 0;` dan menarik harga murni dari input harga jual tunggal (`#input-single-price` / `primaryState.price`) atau baris variasi (`materialsState`).
      - Jika seller belum mengisi harga jual sama sekali, harga tampil murni `Rp0` dengan `"Rp"` kecil pada Kartu Produk, Mini PDP, maupun Drawer.
    - **Otomatisasi Ukuran Font Nama Produk Berdasarkan Panjang Karakter (`< 65` vs `>= 65` Karakter)**:
      - Logika reaktif otomatis: jika `name.trim().length >= 65`, ukuran font judul pada Kartu Produk dan Mini PDP otomatis disesuaikan dari `text-xs sm:text-sm` menjadi `text-[11px] sm:text-[12.5px] leading-snug`.
      - Bereaksi secara real-time saat seller mengetik nama produk di Step 1 (`#input-prod-name`) maupun Step 2 (`#step2-input-name`).
    - **Perbesar Thumbnail Header Drawer & Kurangi Radius Sudutnya**:
      - Mengubah kontainer thumbnail gambar di pojok kiri atas Drawer Shopee-Style (`buildShopeeDrawerHtml`) dari `w-14 h-14 rounded-xl` (`56px`, radius 12px) menjadi `w-16 h-16 rounded-md` (`64px`, radius 6px) untuk Kasus A (Produk Tunggal) maupun Kasus B (Produk Memiliki Variasi).
  - [x] **Penyempurnaan Form Produk Bagian 21: Tipografi Nama Produk font-normal, Perbesar Thumbnail Header Drawer Menjadi w-20 h-20 rounded-[2px], Validasi Harga Jual Tanpa Variasi Minimal 99, Dukungan Penuh Harga "0" pada Variasi & Layanan Extras, serta Standardisasi Peringatan Modal/HPP "Wajib diisi" (`js/product-form.js`, `docs/PRD_MASTER.md`)**:
    - **Tipografi Nama Produk Normal (font-normal)**:
      - Menghapus ketebalan font (`font-semibold`, `font-bold`, `font-extrabold`, `font-medium`) pada elemen Nama Produk.
      - Menjadikan judul Nama Produk standar `font-normal` pada Kartu Pratinjau (Model A, B, C Step 1) dan Pratinjau Detail Produk / Mini PDP (Step 2).
      - Tetap mempertahankan otomatisasi ukuran font adaptif (`text-[11px] sm:text-[12.5px]` untuk nama `>= 65` karakter vs `text-xs sm:text-sm` untuk `< 65` karakter).
    - **Perbesar Thumbnail Header Drawer Menjadi Hampir Kotak (`w-20 h-20 rounded-[2px]`)**:
      - Memperbesar kontainer thumbnail gambar produk di pojok kiri atas Drawer Shopee-Style (`buildShopeeDrawerHtml`) dari `w-16 h-16 rounded-md` (`64px`) menjadi `w-20 h-20 rounded-[2px]` (`80px` x `80px` dengan sudut tegas hampir kotak, `style="border-radius: 2px !important;"`).
      - Diterapkan presisi pada Kasus A (Produk Tunggal) dan Kasus B (Produk Memiliki Variasi).
    - **Validasi Harga Jual Tunggal Minimal 99 vs Dukungan Harga "0" pada Variasi & Extras**:
      - **Produk Tanpa Variasi (Single Product)**:
        - Harga Jual wajib minimal 99 (`Rp99`).
        - Jika kosong (`""`), munculkan peringatan inline merah `"Wajib diisi"`, digagalkan pada `canActivateTestMode()` dengan label `'Harga Jual'`, dan pada `validateForm()` dengan pesan `'Harga Jual produk wajib diisi.'`.
        - Jika diisi angka kurang dari 99 (misal `0` s/d `98`), munculkan peringatan inline merah `Masukkan Minimal "99"`, digagalkan pada `canActivateTestMode()` dengan label `'Harga Jual (Minimal Rp99)'`, dan pada `validateForm()` dengan pesan `'Harga Jual produk minimal bernilai 99.'`.
        - Hanya valid jika terisi angka `>= 99`.
      - **Produk Bervariasi & Layanan Extras**:
        - Mendukung penuh harga satuan `"0"` (`Rp0` / `>= 0`) untuk varian gratis, gift, bonus, atau opsi tanpa biaya tambahan di Variasi 1 s.d. 4 dan Layanan Extras.
        - Memvalidasi agar tidak berupa string kosong (`""`) atau negatif (`< 0`).
        - Mendukung pewarisan harga jika toggle `samePrice` aktif dan opsi baris pertama terisi `>= 0`.
    - **Standardisasi Peringatan Modal/HPP (Biaya Modal) Menjadi "Wajib diisi"**:
      - Menghapus seluruh pesan yang memuat kata `Minimal "0"`, `Minimal 0`, atau `Min. 0`.
      - Mengganti teks peringatan ketika input kosong atau tidak valid menjadi `"Wajib diisi"` pada inline warning, `validateOptionField()`, `validateSingleCost()`, dan `validateForm()`.
      - Modal/HPP tetap mendukung angka `0` sebagai nilai yang sah.
  - [x] **Penyempurnaan Form Produk Bagian 21 (Tahap 1): Perbaikan Layout, Independensi State per Baris, dan Standardisasi UI Tabel List Variasi Produk (`js/product-form.js`, `admin.html`, `docs/PRD_MASTER.md`)**:
    - **Perbaikan Jarak (Spacing) Judul "List Variasi Produk"**:
      - Memberikan jarak vertikal proporsional (`mt-7` pada `#combination-matrix-section`, serta `mt-5 sm:mt-6 mb-3` pada kontainer judul `List Variasi Produk`) sehingga terpisah rapi dari tombol aksi `+ Tambah Variasi ...`.
    - **Independensi State per Baris Opsi Variasi 1 & Tanpa Nilai Default ("Pilih")**:
      - Pengaturan untuk: (1) Keterkaitan Variasi 2 s.d. 4 (`Umum` / `Spesifik`), (2) Harga Grosir (`Normal` / `Bertingkat`), dan (3) Kelipatan Order (`Umum` / `Spesifik`) tersimpan 100% independen per baris opsi Variasi 1 (`mat.variation_scopes`, `mat.wholesale_mode`, `mat.wholesale_tiers`, `mat.order_multiple_type`, `mat.order_multiple_value`).
      - Mengubah konfigurasi pada salah satu baris (misal Opsi 1) TIDAK mengubah atau menyamakan pengaturan pada baris Opsi 2, Opsi 3, dst.
      - Baris baru atau baris yang belum diatur/belum valid secara tegas menampilkan placeholder **`Pilih`** dan ikon pemicu `bi bi-gear-fill`, user wajib mengatur secara mandiri tanpa default otomatis.
    - **Penghapusan Kata "Mode" & Standardisasi Label Bersih**:
      - Menghilangkan kata `"Mode"` dari seluruh tabel variasi, modal pengaturan, dan pengaturan produk tunggal (misal `Mode Normal` -> `Normal`, `Mode Bertingkat` -> `Bertingkat`, `Mode Umum` -> `Umum`, `Mode Spesifik` -> `Spesifik`).
      - Menampilkan label ringkas dan baku saat valid (`Umum`, `Spesifik`, `Normal`, `Bertingkat`) atau `Pilih` jika belum valid.
    - **Standardisasi Desain Sel Tabel (Kotak Teks + Ikon Pemicu di Luar Border)**:
      - Menghapus `<select>` dropdown, badge lama, dan tombol kapsul hijau pada kolom Variasi 2–4, Harga Grosir, dan Kelipatan Order.
      - Mengganti seluruhnya dengan format seragam horizontal flex:
        - Sisi kiri: Kotak teks putih border tipis (`bg-white text-slate-800 border border-slate-300 rounded-md px-3 py-1.5 text-xs font-normal min-w-[85px] text-center select-none cursor-pointer`).
        - Sisi kanan: Tombol aksi ikon di luar border dengan warna dinamis `text-[var(--color-primary)]` (`bi bi-gear-fill` untuk status `Pilih` / belum diatur; `bi bi-pencil-square` untuk pengaturan valid).
        - Klik pada kotak teks maupun tombol ikon membuka modal konfigurasi yang bersangkutan untuk baris tersebut.
      - Menghilangkan checkbox di header kolom Variasi 2–4, sedangkan checkbox aktivasi di header kolom Harga Grosir dan Kelipatan Order tetap dipertahankan. Jika header checkbox tidak dicentang, sel menampilkan teks `Nonaktif` abu-abu disabled.
    - **Penyelarasan Input Max. Order & Popover "Tanpa Batas"**:
      - Input Max. Order diseragamkan dengan Min. Order (`font-normal`, border tipis, text-center, hanya menerima digit angka positif).
      - Popover saran `"Tanpa Batas"` aktif saat input fokus/klik, dan menetapkan nilai `0` secara bersih.
    - **Pembersihan Ikon Dekoratif Modal**:
      - Menghapus ikon dekoratif non-fungsional pada pilihan radio modal opsi spesifik, modal harga grosir, dan modal kelipatan pesanan.
      - Menggunakan radio input bersih dengan pewarnaan dinamis `accent-[var(--color-primary)]` dan outline fokus tanpa kotak bayangan luar.
  - [x] **Penyempurnaan Form Produk Bagian 22 (Tahap 2): Penyempurnaan Modal Aturan Variasi 2–4, Pratinjau Opsi Umum, Indikator Radio Opsi Spesifik + Pilih Semua, serta Sinkronisasi Validasi State Tabel (`js/product-form.js`, `docs/PRD_MASTER.md`)**:
    - **Perombakan Alur & Tampilan Modal Aturan Variasi 2–4 (`#modal-specific-options`)**:
      - Modal tampil bersih tanpa ikon dekoratif, mempertahankan hanya tombol tutup `X` standar di header.
      - Pilihan radio utama `Umum` vs `Spesifik` di bagian atas (`accent-[var(--color-primary)]`).
      - Untuk baris opsi yang belum pernah dikonfigurasi (`Pilih`), kedua pilihan radio dibiarkan tidak tercentang secara otomatis, mewajibkan user menentukan pilihan sebelum dapat menyimpan aturan.
    - **Pratinjau Opsi Umum (`#specific-umum-info-wrapper`)**:
      - Jika radio `Umum` dipilih, sistem merender daftar nama opsi yang valid dari variasi tersebut secara rapi dan bersih dalam container `#specific-umum-list-container` sebagai konfirmasi visual bahwa seluruh opsi tersebut berlaku umum untuk varian terkait.
    - **Indikator Bergaya Radio & Aksi Teks "Pilih Semua" pada Opsi Spesifik**:
      - Jika radio `Spesifik` dipilih, setiap item opsi ditampilkan dengan indikator visual bulatan radio multi-select (`.specific-radio-bullet`) yang diwarnai dinamis dengan brand color (`var(--color-primary)`) saat terpilih, menggantikan kotak checkbox standar.
      - Disediakan tombol aksi teks interaktif **`Pilih Semua`** (`#btn-specific-toggle-all`) dengan warna brand di atas daftar opsi yang mendukung pemilihan/pembatalan seluruh opsi secara instan.
      - Wajib memilih minimal 1 opsi agar aturan `Spesifik` dapat disimpan.
    - **Standardisasi Validasi Sel Tabel Matriks Kombinasi**:
      - **Kolom Variasi 2 s.d. 4**: Tampil `[Pilih] + bi-gear-fill` jika belum dikonfigurasi atau spesifik dengan 0 opsi; tampil `[Umum]` / `[Spesifik] + bi-pencil-square` jika sudah dikonfigurasi valid.
      - **Kolom Harga Grosir**: Tampil `[Pilih] + bi-gear-fill` jika belum dikonfigurasi atau tier belum valid (> 0); tampil `[Normal]` / `[Bertingkat] + bi-pencil-square` jika sudah dikonfigurasi valid.
      - **Kolom Kelipatan Order**: Tampil `[Pilih] + bi-gear-fill` jika belum dikonfigurasi atau nilai < 2; tampil `[Umum]` / `[Spesifik] + bi-pencil-square` jika sudah dikonfigurasi valid (>= 2).
    - **Sinkronisasi Validasi Mode Uji Coba (`canActivateTestMode`) & Validasi Simpan Produk (`validateForm`)**:
      - Kedua fungsi validasi secara ketat memeriksa setiap baris pada List Variasi Produk. Jika masih terdapat baris dengan status `Pilih` (belum valid) pada Variasi 2–4, Harga Grosir, atau Kelipatan Order, proses uji coba maupun penyimpanan produk diblokir dengan pesan peringatan yang spesifik dan jelas.
      - Resolusi aturan opsi pada Drawer dan Mini PDP (`getAllowedVariationOptions` & `validateAndAdjustSpecificVariations`) berjalan reaktif dan independen per baris opsi Variasi 1.
  - [x] **Penyempurnaan Form Produk Bagian 23: Resolusi Darurat Layar Blank Putih Form Tambah Produk Baru, Restorasi Berkas product-form.js, Penempatan Modal Terpusat & Defensive Scroll Protection (`js/product-form.js`, `docs/PRD_MASTER.md`)**:
    - **Restorasi Integritas Berkas `js/product-form.js`**:
      - Memulihkan berkas `js/product-form.js` yang sempat terhapus/berukuran 0 byte pada working tree kembali ke versi penuh ~1.25 MB (23,995 baris).
    - **Penataan Ulang Penempatan DOM Modal List Variasi Produk**:
      - Memindahkan markup modal (`#modal-wholesale-config`, `#modal-order-multiple-config`, `#modal-specific-options`) dari dalam `renderPricingModelSection()` ke tingkat root `#product-form-wrapper` di `renderForm()`.
      - Memastikan elemen modal selalu hadir sejak inisialisasi awal form (baik produk memiliki variasi maupun belum), sehingga seluruh event listener submit dan radio change selalu terikat secara permanen tanpa risiko terhapus saat matriks atau model harga di-render ulang.
    - **Defensive Guarding Fungsi Navigasi Viewport & Smooth Scroll**:
      - Menambahkan pengecekan protektif `typeof ... === 'function'` pada pemanggilan `vp.scrollTo`, `navContainer.scrollTo`, dan `window.scrollTo` dengan fallback langsung ke `.scrollTop = ...` / `.scrollLeft = ...`, mencegah crash runtime `TypeError: scrollTo is not a function` pada browser/webview atau lingkungan virtual tanpa polyfill smooth scroll.
    - **Verifikasi Runtime Menyeluruh via Node.js**:
      - Simulasi siklus hidup form lengkap dari pembacaan 11 skrip inti, ekstraksi 126 ID elemen DOM `admin.html`, hingga eksekusi `ProductForm.initCreate()` yang merender 71,126 karakter HTML secara sempurna dengan 0 error runtime.
  - [x] **Penyempurnaan Form Produk Bagian 24: Penyeragaman Visual Presisi Kotak Teks & Tombol Ikon List Variasi Produk (Variasi 2–4, Harga Grosir, Kelipatan Order) serta Pembersihan CSS Override (`css/admin.css`, `js/product-form.js`, `docs/PRD_MASTER.md`)**:
    - **Penyeragaman Kotak Teks (`.combo-text-btn`)**:
      - Seluruh kotak teks pada kolom Variasi 2–4, Harga Grosir, dan Kelipatan Order diseragamkan dengan input `Min. Order` / `Max. Order`: background putih bersih (`#ffffff`), teks gelap (`#1e293b`), border tipis abu-abu (`1px solid #cbd5e1`), sudut `rounded-md` (`6px`), padding `px-3 py-1.5`, dan tinggi proporsional (`min-height: 32px`).
    - **Pembersihan Tombol Ikon di Luar Border (`.combo-icon-btn`)**:
      - Tombol aksi ikon (`bi-gear-fill` & `bi-pencil-square`) kini berdiri bersih di sebelah kanan luar kotak teks tanpa background dan tanpa border (`background: transparent !important; border: none !important;`), dengan warna dinamis brand (`var(--color-primary)`).
    - **Pembersihan Rule Override CSS (`css/admin.css`)**:
      - Menghapus selektor `.btn-open-wholesale-modal` dan `.btn-open-multiple-modal` dari rule background hijau muda (`var(--color-primary-subtle)`) di baris 2488 `css/admin.css`.
      - Menghapus selektor umum `button` dari rule border-radius di baris 1498 `css/admin.css`.
      - Menambahkan rule CSS scoped berpresisi tinggi untuk `.combo-text-btn` dan `.combo-icon-btn` di `#combination-matrix-section`.
  - [x] **Penyempurnaan Form Produk Bagian 25: Input Langsung Kelipatan Order di Tabel Variasi, Modal Grosir Bebas Nilai Default, dan Stepper Qty Konsisten +1/-1 (`js/product-form.js`, `js/pdp.js`, `docs/PRD_MASTER.md`)**:
    - **Kolom Kelipatan Order Menjadi Input Langsung Tanpa Modal & Tanpa Ikon**:
      - Menghapus tombol pembuka modal dan ikon gerigi/pensil pada kolom Kelipatan Order di tabel List Variasi Produk.
      - Saat header Kelipatan Order nonaktif, merender kotak disabled abu-abu bertuliskan `Nonaktif`.
      - Saat header Kelipatan Order aktif, merender input teks langsung (`.combo-order-multiple-input`) dengan placeholder `Input/Pilih` tanpa nilai default otomatis (kondisi awal kosong `""`).
      - Menyediakan saran popover / datalist bersih dengan opsi tunggal `"Tanpa Kelipatan"` saat input difokuskan/diklik; memilihnya menetapkan aturan tanpa kelipatan (step multiplier 1).
      - Validasi pengetikan angka: jika diisi `< 2`, menampilkan pesan peringatan merah `"Minimal Kelipatan 2"` di bawah kotak input serta border merah. Jika diisi `>= 2`, pesan peringatan hilang dan baris dinyatakan valid.
      - Input Kelipatan Order produk tunggal (`#input-order-multiple-single`) menerapkan aturan seragam: minimal 2 dan menampilkan pesan peringatan `"Minimal Kelipatan 2"` jika < 2.
      - Memblokir tombol `Uji Coba Produk` dan `Simpan Produk` dengan pesan informatif jika terdapat baris kelipatan yang belum diatur atau bernilai < 2.
    - **Pembersihan Seluruh Nilai Default di Modal Harga Grosir (`#modal-wholesale-config`)**:
      - Saat membuka baris yang berstatus `Pilih`, kedua radio `Normal` dan `Bertingkat` dibiarkan uncheck tanpa pilihan default.
      - Memilih jenis `Normal` menyajikan seluruh input field (`Min. Order`, `Max. Order`, `Potongan Harga`) dalam keadaan kosong murni (`""`) dengan placeholder informatif (menghilangkan angka default kaku 10, 50, 500).
      - Memilih jenis `Bertingkat` menyajikan tabel tier dengan 1 baris kosong murni (`""`) tanpa angka default kaku (10, 50, 500, 1000). Tombol `+ Tambah Tier` juga menambahkan baris dengan kolom potongan kosong.
    - **Stepper Qty Konsisten +1/-1 & Validasi Kelipatan Dinamis pada Drawer dan PDP**:
      - Nilai awal Qty saat membuka drawer variasi maupun halaman PDP selalu dimulai dari angka `1` (menghapus auto-jump ke `min_order` atau `step_multiplier`).
      - Tombol `+` selalu menambah +1 secara presisi, dan tombol `-` selalu mengurangi -1 (minimal 1).
      - Jika nilai Qty saat ini belum memenuhi kelipatan yang ditentukan, menampilkan pesan notifikasi dinamis `"Jumlah pesanan wajib kelipatan [X] Pcs Mohon sesuaikan jumlah pesanan Cth: [Contoh kelipatan],Dst."` serta mengunci (disable) tombol `Beli Sekarang` dan `Masukkan ke Keranjang` baik di Drawer Shopee Preview, Mini PDP, maupun PDP utama.
    - [x] **Stabilisasi Form Produk Bagian 26: Persistensi & Validasi Harga Grosir Per Variasi (`js/product-form.js`, `js/db.js`, `tests/wholesale-variant.spec.js`)**:
      - Memperbaiki ID collision pada selector input diskon grosir di `btnSaveWholesale` (menggantikan pencarian global `document.getElementById` dengan scoped `modal.querySelector` sehingga pembacaan nilai potongan harga variasi selalu akurat dan tidak terbentur input Step 1).
      - Menyempurnakan mekanisme pergantian mode `Normal` <-> `Bertingkat` pada modal grosir per variasi tanpa kehilangan data, membaca nilai radio aktif secara presisi dan mempertahankan nilai in-flight antar mode.
      - Menjamin persistensi penuh harga grosir per variasi ke database (`js/db.js`): menyimpan `wholesale_mode` dan `wholesale_tiers` pada setiap baris material di tabel `materials`, serta `wholesale_mode_by_variant` dan `wholesale_by_variant` pada tabel produk.
      - Hidrasi dua arah dan Zero Mutation saat produk dimuat kembali ke Form Edit (`ProductForm.init('edit')`), memastikan indikator matriks kombinasi dan modal tiap variasi pulih sempurna.
      - Menghapus seluruh nilai default tak diminta pada pembuatan tier baru, memvalidasi penolakan tier kosong dan rentang terbalik (max < min), serta memperbaiki validasi form submit agar tidak memblokir produk ber-variasi.
      - **Tugas 01D — Penyempurnaan Tata Letak & Validasi Rentang Grosir Bertingkat**:
        - Mengganti label berulang `Tier 1, Tier 2, Tier 3` dengan kolom `No.` berpenomoran urut otomatis (1, 2, 3...) yang diperbarui tanpa celah saat baris ditambah atau dihapus.
        - Logika otomatis `Min. Order`: baris pertama dimulai kosong; baris baru otomatis menghitung `prevMax + 1` jika `Max. Order` sebelumnya valid, dan tetap kosong jika belum valid (tanpa angka default statis 10, 50, 500, atau 1.000).
        - Kolom `Min. Order` pada baris berikutnya tidak lagi `readonly`, seller dapat mengoreksi nilai secara manual dengan validasi aman.
        - Validasi rentang menyeluruh: pencegahan rentang terbalik, pencegahan baris perantara tanpa batas maksimum, dan penolakan rentang bertumpang tindih (overlap).
        - Konflik akibat perubahan `Max. Order` memicu pesan peringatan antarmuka yang jelas (`#wholesale-tiered-conflict-msg`) tanpa diam-diam menimpa nilai manual seller pada baris lain.
  - [x] **Penyempurnaan Form Produk Bagian 27: Perbaikan Tampilan Max. Order Variasi, Desain Kartu Radio Ketersediaan Opsi, dan Switch Aktivasi Grosir Per-Variasi (`js/product-form.js`, `css/admin.css`, `js/db.js`, `docs/PRD_MASTER.md`)**:
    - **Penyempurnaan Tampilan Input Max. Order pada List Variasi Produk**:
      - Menghilangkan tombol spinner panah naik-turun (`-webkit-inner-spin-button`, `-webkit-outer-spin-button`, `-moz-appearance: textfield`) khusus pada input `.combo-max-order-input` di seksi matriks kombinasi (`css/admin.css`).
      - Mempertahankan `type="number"`, input angka, dan popover saran "Tanpa Batas".
      - Menyesuaikan lebar dan padding input (`w-28 px-2.5 py-1.5`) agar teks placeholder `"Tanpa Batas"` terbaca utuh tanpa terpotong atau merusak struktur tata letak tabel/tampilan mobile.
      - Saat tanpa batas: nilai input tetap string kosong `""`, placeholder `"Tanpa Batas"`, dan representasi state tersimpan sah (`max_order = null` dan `is_unlimited_max_order = true`).
    - **Modernisasi Modal Ketersediaan Opsi (`#modal-option-dependency`)**:
      - Mengganti segmented control lama menjadi dua kartu radio sejajar (`Umum` dan `Spesifik`) berdesain konsisten dengan modal pengaturan harga grosir.
      - Menempatkan radio di sisi kiri dengan teks rata kiri, tinggi ringkas, border tipis, dan sudut `rounded-md`.
      - Status aktif/terpilih menampilkan border dan radio beraksen warna tema (`var(--color-primary)`) dengan latar belakang `var(--color-primary-subtle)`, sedangkan status tidak terpilih berlatar belakang netral.
      - Menghilangkan indikator bullet karakter ●/○ serta blok warna solid lama.
      - Mempertahankan format judul presisi, deskripsi tunggal dinamis (`#dep-mode-desc`), pilihan induk/pemicu, tombol Simpan/Batal, dan seluruh logika keterkaitan opsi.
    - **Switch Aktivasi & Reklasifikasi Modal Harga Grosir per Variasi 1 (`#modal-wholesale-config`)**:
      - Menambahkan toggle switch aktivasi per baris di atas pilihan mode grosir dengan label dinamis: `"Aktifkan Harga Grosir Pada Produk Jenis Variasi [Nama Opsi Variasi 1]"`.
      - Kondisi Switch OFF: menyembunyikan pilihan mode dan input grosir, tidak memblokir simpan, dan menonaktifkan penerapan diskon grosir baris tersebut pada perhitungan Uji Coba Admin tanpa menghapus konfigurasi harga yang tersimpan di buffer.
      - Kondisi Switch ON: menampilkan pilihan mode (Satuan / Bertingkat) dan form input terkait.
      - Mengganti teks tampilan `"Normal"` menjadi `"Satuan"` pada modal dan ringkasan sel tabel List Variasi Produk, sembari mempertahankan nilai internal `'normal'` agar data lama kompatibel 100%.
      - Status aktivasi per-variasi disimpan independen (`mat.is_wholesale_enabled` dan `product.wholesale_enabled_by_variant`) serta dipulihkan sempurna saat edit produk.
      - Menjaga kompatibilitas mundur: produk lama dengan data grosir yang sudah aktif tetap aktif (fallback ke `true` jika data tier terisi).
      - Menjaga konfigurasi baru agar tidak otomatis memilih mode atau mengisi angka default.
      - Perhitungan harga Uji Coba Admin menghormati status aktif per baris tanpa mengubah rumus harga yang ada.
    - **Penyempurnaan Modal Harga Grosir, Switch Mobile, dan Pratinjau Produk (Tugas 1)**:
      - Menghapus teks tambahan `Untuk opsi: [Nama Opsi]` (`#wholesale-modal-subtitle`) di bawah judul utama modal Pengaturan Harga Grosir.
      - Menyederhanakan dan merapikan teks switch per-variasi menjadi `Aktifkan harga grosir untuk [Nama Opsi]` dengan nama opsi dinamis dari Variasi 1.
      - Menata ulang layout switch pada mobile dengan `flex items-center gap-2.5 w-full`, switch container `shrink-0`, dan label teks `break-words flex-1 min-w-0` agar tidak bertumpuk, terpotong, atau keluar batas modal pada layar sempit.
      - Menghilangkan label informasi potongan harga grosir amber (`Potongan Rp .../Pcs Minimal ...Pcs pesanan`) dari tampilan Pratinjau Detail Produk (Mini PDP) pada Admin, sembari mempertahankan seluruh aturan, perhitungan harga grosir, diskon promo, stok, dan simulasi Uji Coba tanpa mengubah halaman detail produk pembeli.
    - **Fitur Panduan Ukuran Produk (Pakaian, Celana, Sepatu) (Tugas 2 & Revisi)**:
      - Mengadopsi gaya tabel bersih (*clean flat, compact, mobile-first*) mengikuti styling List Variasi Produk (`#combination-matrix-section`) dengan warna tema dinamis, header rapi, tanpa elemen kapsul, kartu bertumpuk, atau ikon dekoratif tabel.
      - Posisikan seluruh bagian Panduan Ukuran tepat berada di bawah komponen **Input Ukuran (P x L)** (`#card-custom-dimension-pxl`).
      - Menyediakan 3 Template Cepat kategori:
        - **Pakaian**: Ukuran, Panjang, Lebar Dada, Bahu, Rekomendasi Berat, Rekomendasi Tinggi.
        - **Celana**: Ukuran, Panjang Celana, Lingkar Pinggang, Lingkar Pinggul, Lingkar Paha.
        - **Sepatu**: Ukuran EU, Ukuran US, Ukuran UK, Panjang Kaki (cm).
      - Menggunakan mekanisme **Input/Pilih** pada judul kolom terintegrasi sistem *clean datalist* dengan saran kontekstual sesuai template aktif; pengguna dapat mengetik judul bebas maupun memilih saran, serta tetap dapat diedit kembali.
      - Ikon hapus kolom menggunakan ikon tempat sampah konsisten UI Admin (`bi-trash3-fill`) ringkas tanpa teks tambahan.
      - Header kolom paling kanan hanya menampilkan tombol tambah kolom baru (`+`) yang terpusat dan rapi tanpa teks "Aksi".
      - Aksi hapus baris menggunakan tombol ikon Delete (`bi-trash3-fill`) ringkas dengan tooltip "Hapus Baris", menggantikan teks "Hapus" agar konsisten penuh dengan ikon hapus kolom.
      - Proteksi penimpaan data menggunakan modal konfirmasi internal yang bersih dan profesional (`#modal-size-guide-template-confirm`), tanpa `window.confirm()` bawaan browser ("This page says"). Tombol Batal mempertahankan seluruh data dan template, serta tidak menampilkan modal jika tidak ada data yang berisiko hilang.
      - Mendukung switch aktif/nonaktif dan pilihan tipe representasi (Tabel Data atau Upload Gambar).
      - Persistensi data `size_guide` terintegrasi pada `primaryState`, `js/db.js` (`createProduct` dan `updateProduct`), dan dipulihkan kembali saat edit produk di `loadProductForEdit`. Menjamin kompatibilitas mundur penuh untuk produk lama tanpa mengganggu harga, HPP, stok, variasi, atau grosir.
    - **Integrasi Panduan Ukuran dengan Variasi dan Detail Produk Uji Coba (Tugas 3 & Revisi 3B)**:
      - **Keterkaitan dengan Variasi & Komponen Dropdown Kustom Input/Pilih**:
        - Tanpa variasi aktif: tidak menampilkan pengaturan pengaitan.
        - 1 variasi aktif: otomatis dikaitkan dengan variasi tersebut (`tier1`), tanpa dropdown.
        - 2–4 variasi aktif: menggunakan komponen dropdown kustom bergaya **Input/Pilih** Admin (bukan `<select>` native), bersifat pilihan saja tanpa input teks manual, dengan label dinamis seller dan placeholder *"Pilih variasi"*. Seller wajib memilih sendiri satu variasi aktif (tidak ada default otomatis).
        - Validasi penyimpanan: jika Panduan Ukuran aktif dan ada 2–4 variasi, seller dicegah menyimpan produk sebelum memilih variasi dengan pesan validasi *"Pilih variasi yang dikaitkan dengan Tabel Ukuran."*.
        - Menyimpan keterkaitan menggunakan identitas internal variasi (`tier1`, `tier2`, `tier3`, `tier4`), bukan nama label.
        - Mode edit & proteksi referensi aman: mempertahankan pilihan tersimpan jika variasi masih valid. Jika variasi terkait dinonaktifkan/dihapus, pilihan dikosongkan dan meminta seller memilih ulang. Produk lama tanpa Panduan Ukuran tidak terpengaruh.
        - Arsitektur tabel tunggal: konfigurasi dan data tabel panduan ukuran tetap tunggal dan terpadu.
      - **Akses & Perilaku Pembukaan Tabel Ukuran pada Detail Produk**:
        - *Detail Produk Utama*: Membuka tabel/gambar ukuran secara **inline expand/collapse** langsung di dalam kartu produk tepat di atas baris Spesifikasi (bukan modal/drawer). Klik kembali untuk menutup (toggle).
        - *Drawer Variasi*: Membuka bottom sheet/drawer Tabel Ukuran terpisah (`z-50`), tanpa mereset pilihan variasi pengguna saat drawer ditutup (`e.stopPropagation()` mencegah salah klik).
        - Selalu menampilkan akses *"Tabel Ukuran"* mandiri tepat di atas baris *"Spesifikasi"* saat fitur aktif, baik produk memiliki variasi maupun tidak.
        - *Akses Tambahan pada Header Chip Variasi*: Hanya ditampilkan setelah pengguna memilih opsi variasi yang valid (tidak tampil saat header masih berstatus *"Tersedia (X) [Nama Variasi]"*).
        - Jika dinonaktifkan, seluruh akses *"Tabel Ukuran"* disembunyikan.
      - **Penyempurnaan Tampilan Tabel Ukuran (Clean Flat, Compact & Warna Brand)**:
        - Ukuran teks nilai sel diperkecil konsisten (`text-[10px]`) dan nyaman dibaca di mobile/desktop.
        - Warna teks nilai seluruh sel mengikuti warna tema/brand dinamis seller (`color: var(--color-primary)`).
        - Seluruh kolom dan sel rata tengah (`text-center`).
        - Menghilangkan `border-radius` tabel (`rounded-none`).
        - Latar header menggunakan warna tema ber-opacity rendah (`var(--color-primary-subtle)`), dengan teks header `--color-primary` ber-opacity penuh.
        - Garis pemisah halus (`divide-y divide-slate-100`, `border-slate-200`) dan scroll horizontal ringkas (`overflow-x-auto scrollbar-thin`).
      - **Posisi Akses pada Variasi**:
        - *Mode chip langsung*: teks *"Tabel Ukuran"* di sebelah kanan judul variasi dengan `justify-between` hanya setelah opsi dipilih.
        - *Mode daftar/accordion/drawer*: teks *"Tabel Ukuran"* di bawah pilihan opsi variasi terkait, rata kiri (`text-left`).
        - *Mode dropdown/select*: teks *"Tabel Ukuran"* ditempatkan pada area grup variasi terkait di bawah trigger select, terlihat jelas dan dapat diklik tanpa mengganggu pembukaan dropdown popover.
      - **Konsistensi Tipografi Detail Produk Utama**:
        - Teks *"Tabel Ukuran"* dan *"Spesifikasi"* pada baris Detail Produk disamakan secara konsisten: ukuran font sama (`text-xs`), ketebalan `font-medium` (500), warna (`text-slate-700`), tinggi baris (`leading-normal`), dan perataan vertikal sejajar.
        - Judul grup variasi pada tampilan daftar/drawer diperkecil dan diringankan menjadi `text-[11px] font-medium text-slate-600`.
    - **Penyempurnaan Layout Panduan Ukuran & Urutan Pengaturan (Revisi Tugas 4A)**:
      - **Penyelarasan Layout Header Panduan Ukuran**:
        - Menghilangkan container border, background abu-abu (`bg-slate-50`), dan bentuk kartu nested pada switch header Panduan Ukuran.
        - Mengadopsi struktur visual yang selaras penuh dengan kartu **Input Ukuran (P x L)** tepat di atasnya: judul (`text-sm font-bold text-slate-900`) dan deskripsi (`text-xs text-slate-500`) rata kiri, toggle switch di sebelah kanan dengan pemisah garis halus (`border-t border-slate-100`).
        - Desain bersih, ringkas, dan mobile-first.
      - **Urutan Pengaturan & Wajib Pilih Variasi Terlebih Dahulu**:
        - Jika Panduan Ukuran aktif dan ada 2–4 variasi aktif: seller wajib memilih **Kaitkan dengan Variasi \*** terlebih dahulu sebelum dapat memilih Tipe Panduan Ukuran.
        - Jika variasi belum dipilih lalu seller mengklik opsi **Tipe Panduan Ukuran** (baik label maupun radio), sistem mencegah pemilihan tipe apa pun, mempertahankan kedua radio tetap unselected, memberikan pesan petunjuk singkat *"Pilih variasi terlebih dahulu."*, memfokuskan dan menggulir ke trigger dropdown, serta membuka popover daftar pilihan variasi secara otomatis.
        - Setelah variasi dipilih, seller dapat langsung memilih **Tabel Data** atau **Upload Gambar**.
      - **Tanpa Tipe Default untuk Konfigurasi Baru**:
        - Saat konfigurasi Panduan Ukuran baru dibuat atau diaktifkan pertama kali, kedua tipe tidak terpilih (`type: ''`).
        - Tabel tidak ditampilkan sebelum seller secara sadar memilih **Tabel Data**. Jika memilih **Upload Gambar**, dropzone upload foto bagan yang ditampilkan.
        - Jika produk tanpa variasi atau hanya memiliki 1 variasi aktif, seller dapat langsung memilih tipe (untuk 1 variasi, pengaitan tetap otomatis).
        - Mode edit produk lama tetap mempertahankan tipe, variasi terkait, tabel kolom/baris, maupun foto bagan yang tersimpan.
        - Berpindah antar tipe tidak menghapus data tabel atau gambar yang telah diisi sebelumnya.
      - **Validasi Simpan Lengkap**:
        - Memastikan proses simpan hanya meloloskan konfigurasi Panduan Ukuran aktif yang lengkap: wajib memilih variasi terkait (jika 2–4 variasi), wajib memilih tipe (Tabel Data / Upload Gambar), dan wajib mengunggah foto bagan jika tipe Upload Gambar dipilih.
    - **Modal Input Ukuran (P x L) pada Simulasi Hitung Harga (Tugas 4B)**:
      - **Kontrol Pemicu Ringkas & Modal Internal**: Menggantikan dua input langsung Panjang (P) dan Lebar (L) pada panel Simulasi Hitung Harga dengan satu tombol pemicu ringkas (`#btn-open-sandbox-dim-modal`).
      - Menampilkan teks ringkasan ukuran yang diterapkan secara tebal (misalnya `120 × 80 cm` atau placeholder *"Masukkan Ukuran (P x L)"* saat belum diisi), dilengkapi ikon pensil edit.
      - **Modal Responsif & Mobile-First (`#modal-sandbox-dim-input`)**:
        - Tata letak responsif: 1 kolom vertikal bertumpuk pada mobile (`grid-cols-1`) dan 2 kolom seimbang pada desktop (`sm:grid-cols-2`).
        - Label satuan dinamis mengikuti unit dimensi produk (`cm`, `m`, `mm`, `inci`).
        - Tombol aksi: **Batal** (`#btn-cancel-sandbox-dim-modal`) dan **Terapkan** (`#btn-apply-sandbox-dim-modal`).
        - Tombol Batal, tombol silang header (`x`), klik di luar modal (backdrop), atau tombol Escape menutup modal tanpa mengubah nilai state sebelumnya.
        - Membuka modal kembali memuat nilai terakhir yang berhasil diterapkan.
        - Validasi ketat angka positif: nilai P dan L harus valid dan lebih besar dari 0 (`> 0`). Menampilkan pesan error *"Masukkan angka Panjang (P) dan Lebar (L) yang valid (lebih besar dari 0)."* dan border merah jika tidak valid.
      - **Pertahankan Perhitungan Harga Real-Time**:
        - Mempertahankan integrasi penuh dengan `sandboxPxlState.simLength`, `sandboxPxlState.simWidth`, serta elemen hidden inputs `#sandbox-input-dim-p` dan `#sandbox-input-dim-l`.
        - Memanggil fungsi kalkulasi `updateSandboxCalculation()` secara otomatis setelah ukuran baru diterapkan.
        - Tidak mengubah rumus perhitungan, pemilihan opsi komponen utama, variasi tambahan, harga, HPP, kelipatan, maupun kartu konfigurasi ukuran utama produk.
    - **Penyempurnaan Modal Simulasi, Konsistensi Switch, dan Syarat Panduan Ukuran (Revisi Tugas 4D)**:
      - **Perbaikan Modal Input Ukuran (P x L) — Simulasi Hitung Harga**:
        - Memperbaiki pemicu pembukaan modal `#modal-sandbox-dim-input` melalui event delegation global pada `document` dan binding langsung elemen. Tombol `#btn-open-sandbox-dim-modal` dijamin 100% responsif membuka modal bahkan setelah kartu variasi atau sub-panel di-render ulang secara dinamis.
        - Memastikan modal memiliki z-index tinggi (`z-[100]` / `style="z-index: 9999;"`) agar tampil di atas seluruh lapisan antarmuka baik pada mobile maupun desktop.
        - Nilai masukan Panjang (P) dan Lebar (L) yang diterapkan langsung memperbarui ringkasan tombol pemicu, hidden inputs, dan perhitungan simulasi harga real-time tanpa duplikasi event listener.
        - Tombol Batal, tombol silang header, backdrop klik, atau tombol Escape menutup modal tanpa mengubah nilai state sebelumnya, serta membuka kembali modal menampilkan nilai terakhir yang diterapkan.
      - **Penyelarasan Konsistensi Switch Antara Input Ukuran (P x L) dan Panduan Ukuran**:
        - Menjadikan switch **Input Ukuran (P x L)** (`#toggle-custom-dimension`) sebagai acuan visual standar yang identik: struktur switch, ukuran track (`w-11 h-6`), rounded pill, thumb bundar putih (`after:h-5 after:w-5 after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:transition-all`), warna track OFF (`bg-slate-200`) dan ON (`peer-checked:bg-[var(--color-primary)]`).
        - Menghapus class legacy `.toggle-switch-input` dari switch Panduan Ukuran agar styling dan perilaku transisi murni Tailwind CSS dan selaras sempurna.
        - Menjaga keselarasan header: judul dan deskripsi rata kiri, switch rata kanan dengan pemisah garis halus (`border-t border-slate-100 pt-3`), tanpa container border atau kartu bertumpuk.
      - **Syarat Aktivasi Panduan Ukuran untuk Produk Tanpa Variasi**:
        - Produk tanpa variasi (`!has_variants`) diwajibkan memiliki **Harga Jual** valid (`price > 0`) sebelum switch Panduan Ukuran dapat diaktifkan.
        - Jika Harga Jual kosong, nol, atau tidak valid saat switch Panduan Ukuran diklik: sistem membatalkan pengaktifan toggle (`checked = false`), mengarahkan layar (*smooth scroll*) ke input Harga Jual (`#input-single-price`), memberikan indikator fokus dan *ring-highlight* merah selama 3 detik, serta menampilkan pesan petunjuk singkat *"Isi Harga Jual terlebih dahulu."*.
        - Setelah Harga Jual valid, seller dapat mengaktifkan Panduan Ukuran dengan lancar.
        - Jika Harga Jual kemudian dihapus atau menjadi tidak valid, proses simpan produk (`validateForm()`) memblokir penyimpanan dengan error *"Isi Harga Jual terlebih dahulu."* tanpa menghapus data konfigurasi Panduan Ukuran yang sudah dibuat.
        - Untuk produk dengan variasi, aturan yang telah berlaku tetap dipertahankan penuh (1 variasi otomatis terkait, 2–4 variasi wajib memilih pengaitan).
    - **Revisi Layout Admin — Simulasi Harga dan Panduan Ukuran**:
      - **Modal Lengkap Simulasi Hitung Harga (`#modal-sandbox-pxl-simulator`)**:
        - Memindahkan seluruh panel kalkulator Simulasi Hitung Harga dari tampilan inline accordion ke dalam popup modal internal (`#modal-sandbox-pxl-simulator`).
        - Tombol pemicu `#btn-toggle-sandbox-simulator` membuka modal yang memuat kalkulator lengkap: pemilihan opsi komponen utama (`#sandbox-select-main-option`), input dimensi langsung Panjang (P) dan Lebar (L) (`#sandbox-input-dim-p` & `#sandbox-input-dim-l`), variasi tambahan (`#sandbox-finishing-options-list`), dan rincian kalkulasi harga real-time (`#sandbox-calc-results-breakdown`).
        - Nilai simulasi dipertahankan di state saat modal ditutup (melalui tombol silang header, tombol Tutup footer, klik backdrop, maupun Escape) dan dimuat kembali saat dibuka ulang.
        - Modal di-attach langsung ke viewport body guna mengeliminasi batasan *containing block* dari transisi `#wizard-form-col` dan *overflow scrolling* container utama `#admin-main-viewport`.
      - **Penataan Scrollbar Modal Panduan Aturan Ukuran Variasi (`#modal-help-dimension-rule`)**:
        - Menata ulang layout modal menjadi `flex flex-col max-h-[85vh] rounded-2xl overflow-hidden` sehingga header judul dan tombol tutup tetap terkunci (fixed) di atas, footer tombol Mengerti di bawah, dan body modal menggulir mandiri di dalam kontainer.
        - Menambahkan scrollbar ramping dengan styling terisolasi (`custom-modal-scrollbar`) yang rapi di dalam sudut kurva `rounded-2xl`, menghilangkan tumpang-tindih scrollbar ke border luar dan mencegah scroll horizontal.
      - **Kompaksi Tabel Panduan Ukuran pada Tampilan Mobile (`#size-guide-matrix-table`)**:
        - Menyesuaikan tipografi dan spasi tabel secara lokal pada mobile (`min-w-[96px] sm:min-w-[120px]`, `h-7 sm:h-8`, `text-[11px] sm:text-xs`, padding `p-1 sm:p-2`) agar proporsional dan nyaman tanpa mengurangi area sentuh.
        - Menyelaraskan tombol hapus kolom (`.btn-del-size-col`) pada ruang sejajar tersendiri dan memberikan padding kanan memadai (`pr-6 sm:pr-7`) pada input header kolom sehingga teks judul kolom tidak lagi bertumpuk/terpotong oleh kontrol hapus (X) atau panah pilihan.
        - Mengunci scroll horizontal di dalam wadah tabel (`overflow-x-auto`) sehingga halaman luar tidak ikut melebar atau menciut.
      - **Penyeragaman Dropdown Komponen Utama Ukuran & Satuan Ukuran Bergaya Input/Pilih Kustom**:
        - Menggantikan tampilan `<select>` bawaan browser pada **Komponen Utama Ukuran** (`#select-dimension-main-component`) dan **Satuan Ukuran *** (`#select-dimension-unit`) dengan komponen dropdown kustom bergaya Input/Pilih yang mengacu pada pola `#custom-select-size-guide-linked-variation`.
        - Bersifat murni *selection-only* (hanya memilih opsi daftar, tanpa input teks manual atau pencarian) dengan label terpilih, panah chevron interaktif, dan popover daftar opsi dengan ikon centang aktif.
        - Mempertahankan elemen `<select>` tersembunyi untuk menjaga kompatibilitas penuh terhadap *event change*, sinkronisasi label satuan luas, konversi satuan, pengosongan aturan tidak kompatibel, serta validasi form.
      - **Penyeragaman Gaya Switch/Toggle dan Penghapusan Ikon Dekoratif**:
        - Menghapus ikon dekoratif di samping judul/pemicu:
          - Menghapus kotak ikon tanda tanya dekoratif (`bi-question-lg`) di samping judul modal `#modal-help-dimension-rule` ("Panduan Aturan Ukuran Variasi") dengan tetap mempertahankan judul bersih dan tombol tutup fungsional (`.btn-close-help-rule`).
          - Menghapus ikon kalkulator dekoratif (`bi-calculator`) pada tombol pemicu `#btn-toggle-sandbox-simulator` ("Simulasi Hitung Harga") dan kotak ikon dekoratif pada header popup modal `#modal-sandbox-pxl-simulator`, dengan tetap mempertahankan teks tombol, judul, subjudul, dan tombol tutup fungsional (`.btn-close-sandbox-simulator`).
        - Menstandarkan seluruh switch/toggle ON/OFF di form produk Admin (termasuk *Input Ukuran (P x L)*, *Pengiriman*, *Promo Bulanan*, *Promo Harian*, *Sistem COD*, *Pre-Order (PO)*, *Tampilkan di Etalase Toko*, *Label Khusus*, *Batas Minimal Pesanan (Harga & HPP)*, *Komisi Afiliasi*, dan *Harga Grosir*) mengikuti acuan visual switch **Panduan Ukuran** (`#toggle-size-guide-enable`):
          - Dimensi track konsisten `w-11 h-6` (44px × 24px) dengan lekukan penuh (`rounded-full`).
          - Warna status OFF konsisten abu-abu terang `bg-slate-200` (`#e2e8f0`).
          - Warna status ON dinamis mengacu tema brand toko `peer-checked:bg-[var(--color-primary)]` tanpa hardcode warna.
          - Dimensi thumb 20px × 20px (`after:h-5 after:w-5`) dengan posisi rapi `top-[2px] left-[2px]`, warna putih ber-border `border-slate-300`, transisi halus (`after:transition-all`), dan bergeser penuh saat aktif (`peer-checked:after:translate-x-full peer-checked:after:border-white`).
          - Menghilangkan class legasi (`toggle-switch-input`, `toggle-switch-track`) dan menyelaraskan CSS override di `css/admin.css` agar 100% sinkron dengan utility class Tailwind.
      - **Revisi Layout Atribut & Keterangan Spesifikasi Tambahan (`SC-ADMIN-LAYOUT-SPEC-01`)**:
        - Menghapus ikon dekoratif `bi-card-checklist` di samping judul `"Atribut & Keterangan Spesifikasi Tambahan"`, menyisakan teks judul bersih dan counter baris.
        - Menyempurnakan tombol tambah baris spesifikasi (`#btn-add-spec-row`): menyajikan satu ikon plus (`bi-plus-lg`) diikuti teks `"Tambah Baris Spesifikasi"` (menghapus karakter literal `+` ganda pada teks).
        - Menampilkan header kolom `"Judul"`, `"Keterangan"`, dan `"Aksi"` (`#custom-specs-thead`) secara kondisional hanya ketika minimal terdapat 1 baris spesifikasi:
          - Pada kondisi awal kosong: header kolom tersembunyi (`hidden`), tombol tambah baris tetap tampil dan aktif.
          - Saat baris pertama ditambahkan: header kolom muncul bersamaan dengan baris baru.
          - Saat baris terakhir dihapus: header kolom otomatis tersembunyi kembali.
          - Saat mengedit produk yang telah memiliki baris spesifikasi: header kolom dan isi baris langsung tampil.
          - Penentuan visibilitas mengacu langsung pada aliran data/rendering baris tanpa state duplikat.
          - Kolom `"Aksi"` dipertahankan rata tengah (`text-center`) tepat di atas tombol kontrol hapus per-baris.
      - **Preview Floating Action Button & Pembatalan Bilah Aksi Bawah (`SC-ADMIN-LAYOUT-NAV-02-R1`)**:
        - **Pembatalan Bilah Aksi Bawah Sticky/Fixed**:
          - Sesuai arahan pemilik, bilah aksi lekat bawah (*bottom-fixed action bar*) dibatalkan.
          - Tombol aksi navigasi Step 1 (**Batal** `#btn-step-1-cancel` & **Lanjutkan** `#btn-step-1-next`) dan Step 2 (**Kembali** `#btn-step-2-prev`, **Simpan Draf** `#btn-save-draft`, & **Simpan Produk** `#btn-submit-product`) dikembalikan ke aliran dokumen normal (*normal document flow*) di ujung bawah kartu formulir masing-masing.
          - Seluruh dekorasi, pembungkus bilah lekat/fixed, dan padding kompensasi (`pb-20 sm:pb-24`) dihapus bersih, mengembalikan padding natural pembungkus form (`pb-8 sm:pb-12`).
          - Seluruh ID tombol, urutan tombol, penanganan event, validasi berurutan (*sequential gating*), status loading/disabled, dan penyimpanan data produk dipertahankan 100%.
        - **Retensi Preview Floating Action Button (FAB)**:
          - **Desktop Step 1 (`#btn-expand-preview-sidebar`)**: Tetap mempertahankan FAB horizontal bulat melayang (`rounded-full shadow-xl fixed right-6 bottom-6 z-25`) di kanan bawah memuat ikon mata (`bi-eye`) dan teks "Pratinjau". Offset bawah disesuaikan menjadi `bottom-6` (`1.5rem`) karena bilah aksi lekat telah ditiadakan.
          - **Mobile (Step 1 & Step 2) (`#btn-fab-live-preview`)**: Mempertahankan tampilan rounded pill, posisi tengah horizontal (`left-1/2 -translate-x-1/2`), dan mengembalikan jarak vertikal normal `bottom-4` (`1rem`).
          - Mempertahankan tombol Pratinjau Step 2 (`#btn-subnav-toggle-preview`) pada subnavbar lekat desktop dan aturan penutupan otomatis saat panel samping dibuka.
          - Seluruh FAB tetap berada di bawah hierarki overlay drawer sheet (`z-95`) dan popup modal dialog (`z-100`).
      - **Penyelarasan Layout Panel Pratinjau Step 1–2 (`SC-ADMIN-PREVIEW-LAYOUT-03`)**:
        - **Header Step 1**: Mengganti ikon mata dan teks judul "Preview / Kartu Produk" dengan tab tersegmen teks kompak `[Pratinjau]` (`#btn-step1-tab-preview` / `#btn-step1-tab-preview-mob`) dan `[Desain Kartu]` (`#btn-step1-tab-design` / `#btn-step1-tab-design-mob`).
          - Kondisi default memilih `Pratinjau`: menampilkan baris simulasi diskon dan kartu produk live; menyembunyikan kontrol editor desain.
          - Memilih `Desain Kartu`: mempertahankan baris simulasi diskon dan kartu produk live yang sama di bagian atas, serta menampilkan panel kontrol kustomisasi desain kartu yang sudah ada di bagian bawah.
          - State tab Step 1 (`previewStep1Tab`) dipisahkan secara independen dari state simulasi uji coba Step 2 (`previewTestState`). Pergantian tab murni mengubah presentasi visibilitas tanpa mereset konfigurasi kartu (`card_config`) atau memicu preset default.
          - Menghapus judul dekoratif repetitif "Desain Kartu" beserta ikon palet di dalam editor saat tab aktif.
        - **Header Step 2**: Mempertahankan tab `[Pratinjau]` (`#btn-preview-mode-passive` / `#btn-preview-mode-passive-mob`) dan `[Uji Coba]` (`#btn-preview-mode-test` / `#btn-preview-mode-test-mob`) beserta subjudul `"Detail Produk"` dan kotak peringatan validasi (`#preview-test-mode-alert`). Menghapus ikon mata dan ikon petir dari tombol header untuk menjaga konsistensi teks kompak dengan Step 1.
        - **Baris Simulasi Diskon (Kedua Step & Layar)**: Menyederhanakan menjadi baris kompak bersih `[checkbox] Simulasi Diskon` (`#cfg-simulate-countdown-preview` / `#cfg-simulate-countdown-preview-mob`), menghapus ikon petir dekoratif, teks literal "ON", serta wrapper border/latar tebal. Menerapkan `accent-color: var(--color-primary)` dan indikator fokus keyboard `focus-visible`.
        - **Pembersihan Sekitar Pratinjau**: Menghapus border putus-putus (`border-dashed`) dan kotak abu-abu di sekeliling kontainer kartu pratinjau desktop, menjaga tampilan bersih datar tanpa kotak dekoratif bersarang.
        - **Pembeda Visual Kartu Produk Step 1 (`SC-ADMIN-PREVIEW-LAYOUT-03-R1`)**:
          - Memberikan pembungkus area kartu (`#preview-card-outer-wrapper` desktop dan `#preview-card-outer-wrapper-mob` mobile) dengan latar abu-abu netral sangat muda token proyek (`bg-slate-100/70`) dan sudut membulat halus (`rounded-xl`).
          - Menerapkan padding 12px (`p-3`) dan lebar maksimum outer wrapper `max-w-[284px]` di sekeliling kontainer kartu (`max-w-[260px]`), sehingga keempat tepi kartu produk putih terlihat kontras dan tegas terhadap latar drawer/sidebar tanpa mempersempit dimensi kartu asli.
          - Berlaku konsisten di Step 1 pada tab `[Pratinjau]` maupun tab `[Desain Kartu]`, baik pada sidebar desktop maupun drawer mobile.
          - Terisolasi hanya di belakang kartu: header, checkbox simulasi diskon, dan panel editor tidak menerima latar abu-abu tersebut.
          - Terisolasi dari Step 2: Pada Step 2 (Mini PDP), kelas latar dan padding otomatis dilepas (reset ke `max-w-[260px]`) sehingga layout Mini PDP tetap utuh tanpa modifikasi.
        - **Kustomisasi & Pemulihan Desain Kartu Step 1 (`SC-ADMIN-CARD-DESIGN-04`)**:
          - **Latar Pratinjau Mengikuti Tema Body**: Menghapus padding `p-3/12px` dan pembatas lebar `284px` pada pembungkus kartu Step 1 (`#preview-card-outer-wrapper` desktop dan `#preview-card-outer-wrapper-mob` mobile). Mengganti latar abu-abu statis dengan warna Body dinamis dari tema aktif via `getThemeBodyColor()` (mengacu pada `settings.body_bg_color || '#f8fafc'` dari `DB.getSettings()` dan `--color-body-bg`). Latar diterapkan secara terisolasi hanya di belakang kartu Step 1 (tab Pratinjau & Desain Kartu); Step 2 (Mini PDP) tetap terisolasi tanpa latar.
          - **Tombol Batal dan Pemulihan Desain**:
            - Menambahkan tombol sekunder `[Batal]` (`#btn-cancel-card-design` desktop dan `#btn-cancel-card-design-mob` mobile) berdampingan dengan `[Simpan Perubahan]` pada panel kustomisasi desain kartu.
            - Mengelola state snapshot terisolasi (`cardDesignSnapshot`) dengan kunci sesi spesifik per-produk dan per-model (`${currentEditingId || 'new'}__${primaryState.card_variant}`).
            - Mengambil snapshot mendalam konfigurasi awal (`card_config`, `use_default_card_design`, footer bertingkat `custom_footer_1`/`custom_footer_2`, flat footer, dan countdown) sebelum perubahan pertama terjadi.
            - Menekan `[Batal]` memulihkan seluruh pengaturan desain, input editor, status Default/Ubah Kartu, dan preview kartu secara instan tanpa menulis/menghapus database preset, tanpa mengubah data formulir produk, dan tanpa menutup drawer.
            - Setelah `[Simpan Perubahan]` berhasil, snapshot diperbarui menjadi baseline awal untuk pengeditan berikutnya; jika simpan gagal, snapshot tetap dipertahankan.
            - Perpindahan tab `Pratinjau`/`Desain Kartu`, tutup/buka drawer, atau rerender formulir tidak menimpa snapshot awal.
        - **Penyempurnaan Penetrasi Warna Latar Preview Step 1 (`SC-ADMIN-PREVIEW-BACKGROUND-04-R1`)**:
          - **Penerapan Luas ke Seluruh Area Konten Preview**: Warna Body tema toko aktif (`getThemeBodyColor()`) diterapkan langsung pada elemen kontainer scrollable body (`#desktop-preview-body` pada desktop dan `#mobile-preview-body` pada mobile bottom sheet) serta kontainer luar sidebar/drawer (`#desktop-preview-sidebar` dan `#mobile-preview-sheet`), mengatasi masalah implementasi sebelumnya di mana pewarnaan hanya terbatas pada wrapper selebar kartu (`max-w-[260px]`) sehingga terhalang/tertutup seluruhnya oleh kartu produk.
          - **Transparansi Wrapper Selebar Kartu**: Latar belakang inline pada `#preview-card-outer-wrapper` dan `#preview-card-outer-wrapper-mob` dikosongkan/ditransparansikan sehingga mewarisi langsung warna latar kanvas body tanpa menimbulkan kotak/border ganda.
          - **Pertahankan Latar Internal Kartu**: Desain internal kartu produk (`cfg.bg_color`) tetap putih murni (`#ffffff`) sesuai konfigurasi seller, berkontras jelas terhadap latar kanvas toko yang dinamis.
          - **Isolasi Penuh Step 2**: Saat berpindah ke Step 2 (Mini PDP), seluruh penimpaan warna latar inline (`style.backgroundColor = ''`) dibersihkan kembali ke nilai default stylesheet (`bg-white`), mempertahankan area mockup detail produk tetap putih bersih tanpa modifikasi.
          - **Preservasi Fungsionalitas Penuh**: Tab Pratinjau/Desain Kartu, tombol Batal/Simpan, rollback snapshot, validasi, dan sinkronisasi realtime preview kartu berfungsi normal 100%.
        - **Pembersihan Layout & Penyelarasan Garis Pemisah Form–Preview (`SC-ADMIN-LAYOUT-CLEANUP-05`)**:
          - **Pembersihan Breadcrumb**: Menghapus seluruh baris breadcrumb `#product-form-top-bar` ("Daftar Produk / Tambah Produk Baru" beserta ikon panah kembali), padding, margin berlebih, dan garis divider `border-b` yang sebelumnya memotong/menabrak kanvas layout.
          - **Penyelarasan Garis Vertikal Form–Preview Desktop**: Garis pemisah vertikal form–preview desktop (`border-l border-slate-200` pada `#desktop-preview-sidebar`) kini kontinu dan menyatu utuh dari batas atas area kerja (`top: 4rem`, persis di bawah navbar admin) hingga batas bawah layar tanpa celah atau garis ganda.
          - **Header Preview & Divider Horizontal**: Header preview berada persis di atas body preview dengan satu divider horizontal tipis (`border-b border-slate-200`) yang seragam baik pada sidebar desktop maupun drawer mobile, tanpa memaksakan garis melintasi form.
          - **Kompensasi Padding Responsif**: Menyesuaikan padding atas `#step-pane-1` secara bersih (`1.25rem` pada desktop/tablet dan `0.75rem` pada mobile) sehingga kartu pertama form memiliki jarak yang seimbang dari batas atas workspace tanpa ruang kosong sisa breadcrumb.
          - **Preservasi Fungsionalitas Navigasi**: Tombol Batal pada form (`#btn-step-1-cancel`) tetap terhubung normal ke handler navigasi `handleFormCancel()`. Seluruh fitur preview (Body color tema, Step 2 isolation, Desain Kartu CTA) dipertahankan 100%.
        - *Status Verifikasi*: Pengujian sintaks dan logika event/render lulus pengujian Node.js terarah (100% PASS). Verifikasi visual rendering/scrolling langsung di perangkat/browser dicatat sebagai status tertunda menunggu tinjauan visual pemilik (*pending owner visual inspection*).
        - **Penyempurnaan Pratinjau Mobile & Overlay Drawer (`SC-ADMIN-MOBILE-PREVIEW-06`)**:
          - **Latar Preview Mobile Mengikuti Tema Toko**: Area latar di belakang kartu pada drawer mobile (`#mobile-preview-sheet` dan `#mobile-preview-body`) di Step 1 secara konsisten mengadopsi warna Body dari tema aktif toko (`getThemeBodyColor()`), menghapus kelas penghalang `bg-white` pada wrapper drawer saat Step 1. Warna latar ini aktif seragam baik pada tab *Pratinjau* maupun tab *Desain Kartu*. Step 2 tetap terisolasi penuh dan kembali menggunakan latar putih bersih (`bg-white`).
          - **Pembersihan Tuntas Breadcrumb Mobile**: Menghapus sisa markup elemen `#product-form-top-bar` ("← Daftar Produk / Tambah Produk Baru") beserta garis pembatasnya pada form Tambah/Edit Produk. Menghapus margin/spacing berlebih sehingga layout form langsung menempel rapi. Tombol *Batal* bawah (`#btn-step-1-cancel`) beserta handler navigasinya (`handleFormCancel()`) dipertahankan sepenuhnya.
          - **Overlay Backdrop & Drawer Panel Edge-to-Edge**: Memperbaiki stacking context dan containing block antara backdrop overlay (`#mobile-preview-backdrop`, z-index 90) dan panel drawer (`#mobile-preview-sheet`, z-index 95). Saat drawer mobile aktif, stacking context viewport `#admin-main-viewport.mobile-preview-active` dinaikkan ke z-index 90 sehingga backdrop menutupi seluruh layar secara penuh dari ujung atas (menutupi header navbar z-40) hingga ujung bawah layar tanpa celah atas maupun celah bawah (*zero insets gap*).
          - **Responsivitas Viewport & Safe-Area Perangkat**: Menggunakan ketinggian dinamis `88dvh` (`max-h-[88dvh]`) pada drawer panel agar proporsional terhadap address bar dinamis browser mobile. Menambahkan padding bawah aman `padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px))` serta momentum scrolling iOS (`-webkit-overflow-scrolling: touch`) pada `#mobile-preview-body` agar seluruh kontrol (termasuk tombol Simpan dan Batal pada tab Desain Kartu) dapat di-scroll dan dijangkau dengan nyaman tanpa terhalang home bar / gesture bar perangkat.
          - **Preservasi Perilaku Interaktif**: Perilaku penutupan via klik backdrop overlay, tombol close (X), serta interaksi hamburger sidebar dan pemulihan scroll body/viewport dipertahankan 100%. Tampilan desktop dan Step 2 tidak mengalami perubahan.
        - *Status Verifikasi*: Pengujian sintaks JavaScript (`node --check`), analisis CSS, dan simulasi DOM dynamic behavior lulus 100% PASS (`scratch/test_mobile_preview_06.js`). Verifikasi visual rendering/touch gesture aktual dicatat sebagai status tertunda menunggu tinjauan visual pemilik (*pending owner visual inspection*).
      - **Penyempurnaan Layout & Keterbacaan Tabel Panduan Ukuran (`SC-ADMIN-SIZE-GUIDE-LAYOUT-R1`)**:
        - **Cakupan & Fokus**: Admin → Tambah Produk → Step 2 → Tabel Panduan Ukuran (`#size-guide-matrix-table`). Mengutamakan kenyamanan layar mobile, disusul tablet dan desktop tanpa kebocoran style ke elemen lain.
        - **Lebar Kolom Dinamis & Keterbacaan Judul Penuh**:
          - Menerapkan fungsi helper `getSizeGuideColWidthClass(colName, colIdx)` yang memberikan batas lebar minimum (`min-width`) proporsional pada sel header (`<th>`) dan sel isi (`<td>`):
            - Kolom pertama ringkas ("Ukuran", <= 6 karakter): `min-w-[130px] sm:min-w-[140px]`.
            - Kolom standar ("Panjang", "Lebar Dada", "Bahu", "Ukuran EU/US/UK", dsb.): `min-w-[160px] sm:min-w-[175px]`.
            - Kolom judul panjang & rekomendasi ("Rekomendasi Berat", "Rekomendasi Tinggi", "Panjang Celana", "Lingkar Pinggang", dsb., atau >= 12 karakter): `min-w-[220px] sm:min-w-[240px]`.
          - Menghilangkan pemotongan/elipsis ("Rekome...") sehingga kedua kolom rekomendasi ("Rekomendasi Berat" dan "Rekomendasi Tinggi") tampak utuh, jelas, dan mudah dibedakan oleh pengguna.
          - Mempertahankan ukuran font standar (`text-xs` / `0.75rem`, `line-height: 1.25rem`) tanpa mengecilkan teks secara paksa di mobile (menghapus override `font-size: 11px`).
        - **Pemisahan Ruang & Tata Letak Kontrol Header**:
          - Memisahkan input judul kolom (`.size-col-header-input`), ikon silang pengosong input (`.btn-clear-datalist`), dan tombol hapus kolom (`.btn-del-size-col`).
          - Input judul dibungkus dalam `.clean-datalist-wrapper` dan `.clean-datalist-input-box` dengan padding kanan aman (`padding-right: 2rem !important;`), memastikan teks judul tidak pernah menabrak ikon `×` atau panah `▼` (`right: 0.35rem !important; width: 1.125rem !important; height: 1.125rem !important;`).
          - Tombol hapus kolom (`.btn-del-size-col`) ditempatkan sebagai saudara sejajar (*flex sibling*) di luar wrapper input dengan jarak pemisah `gap-1.5`, memiliki target sentuh nyaman `w-7 h-7 sm:w-8 sm:h-8`, sudut membulat `rounded-md`, efek hover lembut (`hover:bg-red-50 hover:text-red-600`), dan `touch-action: manipulation`.
          - Fungsi klik `×` pengosong input (`e.stopPropagation()`) tetap murni mengosongkan nilai input dan membuka dropdown saran datalist (`datalist-size-col-titles`) tanpa memicu penghapusan kolom. Penghapusan kolom murni dikendalikan oleh tombol `.btn-del-size-col` (dengan syarat minimal 2 kolom dipertahankan).
        - **Keselarasan Vertikal Header & Baris Data**:
          - Sel header `<th>` dan sel baris data `<td>` pada indeks kolom yang sama selalu menggunakan kelas lebar kolom yang identik (`getSizeGuideColWidthClass`), menjamin keselarasan vertikal sempurna (*strict vertical alignment*).
          - Kolom aksi baris (tombol hapus baris `.btn-del-size-row` dan tombol tambah kolom `.btn-add-size-col`) selaras dengan dimensi `w-10 sm:w-11 min-w-[40px] sm:min-w-[44px]` dan ukuran tombol `w-7 h-7 sm:w-8 sm:h-8 rounded-md`.
          - Sinkronisasi dinamis via `updateSizeGuideColWidthClasses()` pada event `thead.onchange` memperbarui lebar kolom secara instan saat pengguna mengubah judul kolom atau memilih dari saran datalist.
        - **Isolasi Scroll Horizontal Tabel**:
          - Mengatur `#size-guide-matrix-table` dengan `width: max-content; min-width: 100%; table-layout: auto;`.
          - Scroll horizontal terisolasi secara ketat hanya pada wrapper kontainer tabel (`overflow-x-auto rounded-lg border border-slate-300 scrollbar-thin`), sehingga seluruh halaman form utama tidak meluap atau mengalami pergeseran layout horizontal.
        - **Preservasi Fungsionalitas Penuh**:
          - Seluruh nilai data sel, template bawaan (*Pakaian, Celana, Sepatu*), penambahan baris/kolom, batasan minimum kolom (minimal 2), konfirmasi penggantian template jika sel terisi data pengguna, validasi prasyarat harga jual produk tunggal, serta persistensi penyimpanan draf/state tetap berfungsi normal 100%. Komponen accordion dan ikon mata/mata-coret tidak disentuh sama sekali.
        - *Status Verifikasi*: Pengujian sintaks JavaScript (`node --check`), pengujian CSS, dan simulasi penataan kolom/keselarasan template (`scratch/test_size_guide_layout_r1.js`) serta suite regresi lulus 100% PASS.
      - **Pemadatan & Penyesuaian Font Tabel Panduan Ukuran Mobile (`SC-ADMIN-SIZE-GUIDE-MOBILE-R2`)**:
        - **Cakupan & Batasan**: Khusus tata letak tabel Panduan Ukuran (`#size-guide-matrix-table`) pada layar mobile (<640px). Data tabel, template, batasan jumlah, validasi, event handling, penyimpanan draf, Saran Ukuran Cepat, serta editor/preview kartu produk tidak diubah.
        - **Tipografi Mobile Terpadat (11px)**:
          - Pada layar `<640px`, judul header (`.size-col-header-input`) dan isi sel data (`.size-cell-input`) menggunakan font `11px` (`text-[11px]`, `line-height: 1.125rem !important;`).
          - Pada layar tablet/desktop ($\ge 640\text{px}$), ukuran font tetap dipertahankan pada `0.75rem` (`12px` / `sm:text-xs`, `line-height: 1.25rem !important;`).
        - **Pengurangan Lebar Minimum Kolom Mobile Secara Proporsional**:
          - Kolom pertama ringkas ("Ukuran", $\le 6$ karakter): disesuaikan menjadi `min-w-[120px] sm:min-w-[140px]`.
          - Kolom standar ("Panjang", "Lebar Dada", "Bahu", "Ukuran EU/US/UK", dsb.): disesuaikan menjadi `min-w-[144px] sm:min-w-[175px]`.
          - Kolom judul panjang & rekomendasi ("Rekomendasi Berat", "Rekomendasi Tinggi", "Panjang Celana", "Lingkar Pinggang", dsb., atau $\ge 12$ karakter): disesuaikan menjadi `min-w-[192px] sm:min-w-[240px]`.
          - Kolom tombol aksi baris: disesuaikan menjadi `w-9 sm:w-11 min-w-[36px] sm:min-w-[44px]`.
          - Tampilan tablet dan desktop tetap dipertahankan persis seperti implementasi sebelumnya (`sm:min-w-[140px]`, `sm:min-w-[175px]`, `sm:min-w-[240px]`, `sm:min-w-[44px]`).
        - **Keterbacaan Penuh & Pemisahan Kontrol Tetap Terjamin**:
          - Seluruh judul bawaan, khususnya kedua kolom rekomendasi ("Rekomendasi Berat" dan "Rekomendasi Tinggi"), tetap terbaca utuh tanpa elipsis/singkatan dengan margin positif terhadap pembatas input.
          - Teks tidak menumpuk dengan ikon silang pengosong input (`.btn-clear-datalist` di `right: 0.35rem`, lebar `1.125rem` di dalam area padding kanan aman `pr-7` / `28px`).
          - Tombol hapus kolom (`.btn-del-size-col`) tetap mempertahankan slot mandiri di luar pembungkus input dengan area sentuh nyaman (`w-7 h-7 sm:w-8 sm:h-8`).
          - Keselarasan vertikal antara header `<th>` dan sel baris data `<td>` tetap terjaga 100% pada seluruh indeks kolom.
          - Scroll horizontal tetap terisolasi di dalam wrapper tabel (`.overflow-x-auto`).
        - *Status Verifikasi*: Pengujian sintaks JavaScript (`node --check`), aturan CSS, dan simulasi penataan kolom/keselarasan template (`scratch/test_size_guide_mobile_r2.js`) lulus 100% PASS. Hasil visual akhir dicatat berstatus menunggu pemeriksaan visual pengguna (*pending user visual inspection*).
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
