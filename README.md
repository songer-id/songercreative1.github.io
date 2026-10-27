# POS By Songer Creative
## Toko Online & POS Percetakan Terpadu (Default Toko: Songer Creative)
**Direktori Utama Proyek:** `D:\pos-songer-creative\`

---

## 💎 Identitas Proyek & Sistem Kustomisasi Branding (White-Label)
- **Nama Proyek:** `POS By Songer Creative`
- **Default Nama Toko Web:** `Songer Creative` *(Dapat diubah dinamis oleh seller via Dashboard Pengaturan Toko)*
- **Warna Brand Bawaan (Default Theme):**
  - Primary Brand: `#33b589` (Emerald Mint)
  - Hover / Dark: `#28916d`
  - Accent / Slate: `#1e293b`
  - *Catatan Kustomisasi Seller:* Warna `#33b589` adalah **warna default template**. Seller / pemilik toko dapat mengganti warna brand toko menggunakan warna lain yang menyesuaikan identitas masing-masing toko (tersedia Color Picker HEX & Palette Preset di Dashboard Seller). Seluruh antarmuka toko (web pembeli dan POS) akan otomatis menyesuaikan CSS variables (`--color-primary`, `--color-primary-hover`, dll.) secara dinamis per-tenant.
- **Aturan Lokasi Kerja:** Seluruh kode sumber, basis data, dan berkas proyek **HANYA** disimpan di **Local Disk D:** (`D:\pos-songer-creative\`).

---

## 📁 Struktur Direktori Repositori (Disk D:)

```text
D:\pos-songer-creative\
├── .env.example                      # Template konfigurasi environment (PostgreSQL, Port, WA, JWT)
├── package.json                      # Konfigurasi dependensi dan skrip Prisma ORM
├── README.md                         # Dokumentasi arsitektur dan panduan proyek
├── bump-version.js                   # Script otomatisasi global cache busting aset HTML (timestamp WIB)
├── Buka-Aplikasi.bat                 # Peluncur 1-klik aplikasi langsung ke browser
├── Buka-Preview-HP.bat               # Launcher preview lokal jaringan Wi-Fi
├── serve.ps1                         # Server HTTP PowerShell ringan untuk pengujian mobile
├── index.html                        # Storefront utama pembeli (Katalog, Header, Banner, Floating Kupon)
├── admin.html                        # Shell SPA Seller Center & POS Kasir (Router Hash, Kategori, Stok, Produk)
├── product.html                      # Dedicated Product Detail Page (PDP), kalkulator harga PxL, galeri foto, ulasan
├── settings.html                     # Pengaturan Toko & Identitas Brand (Dual-Color Theme, Logo, Printer Thermal)
├── theme-editor.html                 # Theme Studio Customizer (Shopify-Style Visual Theme Editor)
├── schema.sql                        # DDL Relasional PostgreSQL / Supabase langsung
├── superadmin/
│   ├── superadmin.html               # Panel Superadmin Multi-Tenant SaaS independen
│   ├── superadmin.js                 # Logika CRUD Tenant, paket langganan, feature matrix
│   └── superadmin.css                # Styling tema cockpit superadmin
├── assets/
│   └── images/
│       ├── songer-logo.png           # Logo bulat resmi (Favicon tab browser)
│       └── logo-songer-creative.png  # Logo horizontal resmi (Header navbar)
├── css/
│   ├── admin.css                     # CSS utama Admin, sticky subnav, radius tegas, mobile layout
│   ├── storefront.css                # Styling pendukung katalog etalase toko
│   ├── style.css                     # Bridge variabel warna dual-color branding
│   └── theme-editor.css              # Styling antarmuka kustomizer tema
├── js/
│   ├── utils.js                      # Pustaka utilitas terpusat (formatIDR, escapeHtml, hexToRgba, generateSlug)
│   ├── db.js                         # Database engine lokal client-side (100% localStorage terenkapsulasi)
│   ├── admin-app.js                  # Controller utama Admin SPA, POS kasir, pesanan, dashboard, CRM
│   ├── buyer-store.js                # Etalase pembeli: 3 card variants, kalkulator PxL, review & keranjang
│   ├── category-manager.js           # Seller Center: Kategori & Sub-Kategori CRUD + konfigurasi invoice
│   ├── product-form.js               # Engine form produk 2-step, live preview, kompresi foto WebP
│   ├── product-list.js               # Seller Center: Tabel manajemen produk Shopee style
│   ├── promo-manager.js              # Pengelolaan banner promo, kupon diskon, voucher
│   ├── review-manager.js             # Seller Center: Manajemen & moderasi ulasan pembeli
│   ├── customer-manager.js           # CRM pelanggan, riwayat transaksi kasir/web
│   ├── pricing-calculator.js         # Engine kalkulasi harga (PxL M², Kg, Lt, KombStep, KombF)
│   ├── pdp.js                        # Interaksi PDP, kalkulasi live, integrasi cart & checkout
│   ├── settings.js                   # Sinkronisasi form pengaturan toko & printer
│   └── theme-editor.js               # Live theme preview & generator variabel CSS
├── prisma/
│   ├── schema.prisma                 # Skema Multi-Tenant Prisma ORM (PostgreSQL & Supabase ready)
│   └── seed.js                       # Skrip inisialisasi awal Tenant Songer Creative & data default
├── src/
│   ├── lib/
│   │   ├── db-local/
│   │   │   └── offline-db.js         # Engine IndexedDB Offline-First Kasir + Antrean Sync Queue
│   │   ├── invoice/
│   │   │   └── invoice-generator.js  # Generator Nomor Faktur Shared Counter [A/B]-[Prefix]-[00001]-[MMYY]
│   │   └── prisma/
│   │       └── client.js             # Singleton Prisma Client Instance
│   ├── controllers/                  # API Controllers
│   ├── routes/                       # Express / API Endpoints
│   ├── services/                     # Business Logic (Kalkulator PxL, WA Gateway, Thermal Print)
│   ├── models/                       # Data Validation
│   └── database/                     # Migrations & Database Pool
└── docs/                             # Spesifikasi sistem & API contract
    ├── PRD_MASTER.md                 # Single Source of Truth (SSOT) & Technical Compass Proyek
    ├── PRODUCT_FORM_ARCHITECTURE.md  # Arsitektur teknis formulir produk Shopee-style
    └── ROADMAP.md                    # Roadmap pengembangan Laravel 12 & React 18 / Inertia v2
```

---

## 🗄️ 1. Skema Database Multi-Tenant (`prisma/schema.prisma`)

Skema Prisma mendukung arsitektur multi-tenant dengan isolasi `tenant_id` pada setiap tabel relasional:
1. **Tenant & TenantSettings**:
   - Lisensi SaaS: `PAKET_A_BASIC` (Retail simpel) vs `PAKET_B_PRO_CALCULATOR` (Kalkulator custom bertingkat + WA).
   - Pengaturan branding: Warna `#33b589`, nama toko, logo, favicon, token WhatsApp Gateway, dan mode penomoran invoice.
2. **Kategori & Label Order**:
   - Kategori & Sub-Kategori dinamis etalase pembeli dengan konfirmasi cascade delete.
   - Tabel `OrderLabel` untuk prefix faktur kasir dinamis (`DnC`, `CtK`, `DsN`, `SpL`, atau manual `00001`).
3. **Produk & Rumus Cetak**:
   - Tipe harga: `Meter (1)`, `KombF (2)`, `Paket (4)`, `Kg (5)`, `Lt (6)`, `KombStep (7)` (Tipe `Fixed (3)` dinonaktifkan).
   - `step_quantity` khusus KombStep untuk validasi kelipatan pesanan.
   - Relasi repeater `ProductMaterial` dan `ProductFinishing` dengan harga jual dan harga modal HPP.
   - `ProductDiscountTier` untuk diskon bertingkat berdasarkan kuantitas pesanan.
4. **Order & Finansial**:
   - Kolom `channel`: `A_WEB` (Storefront online) dan `B_POS` (Kasir walk-in).
   - Status produksi independen (`ANTREAN_DESAIN` → `PROSES_CETAK` → `FINISHING` → `SELESAI`) terpisah dari status pembayaran (`BELUM_BAYAR`, `DP`, `LUNAS`).
   - Kalkulasi HPP (`totalCostHpp`) dan Margin Laba Kotor (`grossProfit`) otomatis per pesanan.
5. **Review & SyncQueue**:
   - `Review`: Rating 1-5 dan komentar dengan moderasi seller (`is_approved`).
   - `SyncQueue`: Antrean sinkronisasi offline kasir ke PostgreSQL Cloud.
   - `InvoiceSequence`: Counter atomic PostgreSQL per tenant per periode bulan-tahun (`MMYY`).

---

## 📶 2. Arsitektur IndexedDB Kasir Offline (`src/lib/db-local/offline-db.js`)

Kasir POS dapat beroperasi penuh tanpa koneksi internet (Offline-First):
- **Object Stores**:
  - `orders`: Menyimpan pesanan kasir lokal.
  - `order_items`: Menyimpan rincian item, bahan, finishing, dan dimensi PxL.
  - `sync_queue`: Menyimpan mutasi transaksi berstatus `PENDING`.
  - `cached_products`: Cache katalog produk, harga bahan & finishing untuk kalkulator offline.
  - `offline_settings`: Menyimpan nomor counter lokal kasir.
- **Auto-Sync**: Mendengarkan event `window.addEventListener('online')` untuk memicu proses push data ke PostgreSQL Cloud saat internet pulih.

---

## 🧾 3. Generator Nomor Faktur Shared Counter (`src/lib/invoice/invoice-generator.js`)

Format Nomor Faktur Resmi:
```text
[A/B]-[PrefixLabel]-[Counter 5 Digit]-[MMYY]
```
- **Channel Code:**
  - `A`: Transaksi Web Storefront (Online)
  - `B`: Transaksi Kasir POS (Walk-in / Offline)
- **Prefix Label:**
  - Dengan Label Khusus: `DnC`, `CtK`, `DsN`, `SpL` (contoh: `B-DnC-00001-1026`)
  - Mode Manual (Tanpa Label): Langsung nomor urut (contoh: `B-00001-1026`)
- **Shared Counter & Zero Collision:**
  - Nomor urut counter (`00001`, `00002`, dst.) berjalan dalam 1 urutan global bersama antar-channel.
  - Pada PostgreSQL, kenaikan nomor dijamin bebas bentrokan menggunakan transaksi atomic Prisma `upsert` dengan `{ increment: 1 }`.
  - Kasir offline menggunakan alokasi prefix `OFF` (`B-DnC-OFF0001-1026`) yang direkonsiliasi otomatis ke urutan resmi cloud saat sinkronisasi.

---

## 🚀 4. Panduan Eksekusi Terminal & Migrasi Database

### A. Prasyarat Lingkungan (Environment Checklist)
Pastikan telah menginstal perangkat lunak berikut di Windows Anda:
1. **Node.js LTS (v18.x atau v20.x):** [Unduh dari nodejs.org](https://nodejs.org/)
2. **Git for Windows:** [Unduh dari git-scm.com](https://git-scm.com/)
3. **Database PostgreSQL:** Gunakan layanan cloud gratis seperti [Supabase](https://supabase.com/) atau PostgreSQL lokal.

### B. Konfigurasi Database (`.env`)
1. Salin template konfigurasi di direktori `D:\pos-songer-creative`:
   ```bash
   cd D:\pos-songer-creative
   copy .env.example .env
   ```
2. Buka berkas `.env` dan sesuaikan koneksi string PostgreSQL / Supabase Anda:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?schema=public"
   ```

### C. Instalasi Dependensi & Migrasi Prisma
Jalankan perintah berikut di PowerShell atau Command Prompt:
```bash
# 1. Pindah ke direktori proyek di Disk D
cd D:\pos-songer-creative

# 2. Instal dependensi Prisma
npm install

# 3. Sinkronkan skema ke PostgreSQL (Supabase)
npx prisma db push

# 4. (Opsional) Jalankan migrasi Prisma migration tracking
npx prisma migrate dev --name init_stage2_schema

# 5. Jalankan seed awal (Tenant Songer Creative, Branding, Kategori & Label)
npm run db:seed

# 6. Buka Prisma Studio untuk inspeksi visual tabel database
npx prisma studio
```

### D. Menjalankan Antarmuka Saat Ini (Mode Offline & Buyer/Seller)
Cukup klik dua kali berkas:
```text
D:\pos-songer-creative\Buka-Aplikasi.bat
```
Aplikasi akan langsung terbuka di browser dengan navigasi lengkap (Mode Pembeli, Manajemen Produk Shopee Style, Pengaturan Kategori, dan Moderasi Review).

---

## 🎨 5. Pembaruan Stage 3: Pricing Engine, Dedicated PDP, & Dual-Color Theme

### A. Sistem Dua (2) Warna Identitas Toko (Dual-Color Theme)
- **Warna Utama (Primary Brand):** Mendominasi website (Navbar, Header, Border Aktif, Tombol Primer). Default: `#33b589`.
- **Warna Kedua (Secondary / Accent):** Aksen kontras tinggi untuk Tombol CTA *"Beli Sekarang"*, badge promo/diskon, highlight harga, dan rating bintang emas. Default: `#f59e0b`.
- **Pengaturan Dinamis:** Tersedia 2 Color Picker native dan 6 kombinasi preset warna di Modal Pengaturan Toko. Variabel CSS otomatis disuntikkan ke `:root`:
  `--color-primary`, `--color-primary-hover`, `--color-secondary`, `--color-secondary-hover`.

### B. Core Pricing Engine (`src/lib/pricing-calculator.js` & `js/pricing-calculator.js`)
Mendukung 6 tipe rumus aktif, diskon bulanan, diskon bertingkat kuantitas, dan kalkulasi HPP / profit margin:
- **B1 (Meter):** Luas $(P \times L) / 10000$ (Minimal $1.0\text{ m}^2$) $\times$ Harga Bahan $+$ Total Finishing.
- **B2 (KombF):** Harga Bahan $+$ Total Finishing.
- **B4 (Paket):** Bundle promo dengan opsi finishing gratis/ekstra.
- **B5 (Kg):** Bobot kg $\times$ Harga per Kg $+$ Finishing.
- **B6 (Lt):** Volume liter $\times$ Harga per Liter $+$ Finishing.
- **B7 (KombStep):** Wajib kelipatan kuantitas ($\text{Bahan} \times \lceil\text{Qty}/\text{Step}\rceil + \text{Finishing} \times \text{Qty}$).

### C. Dedicated Product Detail Page (`product.html` & `js/pdp.js`)
- **URL Parameter:** Membaca ID produk dari URL `product.html?id={id}` dengan dukungan penuh riwayat browser (*Back button* kembali ke `index.html`).
- **Galeri Interaktif:** Foto utama besar + carousel thumbnail mini (klik thumbnail langsung mengganti gambar utama).
- **Konfigurator Realtime:** Radio pill bahan, input P x L (cm) khusus tipe Meter dengan feedback luas riil vs luas ditagihkan, pilihan finishing, dan selector kuantitas.
- **Tombol Aksi:** Tambah ke Keranjang, Beli Sekarang (WhatsApp Checkout langsung), dan Bagikan Link Produk (auto-copy link).
- **Tab Informasi & Ulasan:** Deskripsi produk, spesifikasi CMYK 300 DPI, ulasan pelanggan yang telah disetujui seller (*approved reviews*), rekomendasi produk serupa (minimal 4 item), dan 1 produk terlaris lintas kategori.
- **Mobile-First & Sticky Bar:** Baris aksi melayang di bagian bawah layar smartphone (Tombol WA Seller, Ikon Keranjang + badge, dan Tombol "Beli Sekarang").

---

## 🗺️ 6. Roadmap Pengembangan Proyek (`docs/ROADMAP.md`)

Seluruh perencanaan arsitektur, status modul terkini, dan peta jalan migrasi ke ekosistem **Laravel 12** dan **React 18 / Inertia.js v2** dirangkum secara lengkap pada dokumen:
👉 **[ROADMAP.md](docs/ROADMAP.md)**

Cakupan utama Roadmap:
1. **Fondasi Backend:** Multi-Tenant Prisma ORM & migrasi service layer Laravel 12.
2. **Pricing Engine & Kustom Dimensi:** 6 rumus harga, sub-toggle ambang batas minimal, toleransi 0 sah, dan volumetrik.
3. **Manajemen Pengiriman:** Pemisahan fisik vs non-fisik (jasa/digital), kurir lokal & nasional, serta pembayaran COD.
4. **Program Promo:** Promo Harian, migrasi otomatis saat Promo Bulanan/Event Besar, serta konversi [%] vs [IDR].
5. **UI/UX Mobile-First:** Galeri 9 slot Shopee style dengan Canvas auto-compress, Sub-Navbar Sticky + ScrollSpy, dan live preview overlay.
6. **AI Content Generation:** Generator deskripsi instan dan rancangan manajemen token kuota per-tenant.
7. **Frontend Modernization:** Rencana konversi imperatif JS ke komponen modular React 18 + Inertia.js v2.

---

## 🎛️ 7. Standar Antarmuka: Popover Ramping Terkendali (`clean-datalist-popover`), Integrasi Edit Produk & Modal Batal Cerdas

### A. Standar Default "Input & Pilih" (Controlled Clean Callout Popover)
- **Mandat Popover Ramping Terkendali (`.clean-datalist-popover`):** Seluruh elemen input yang membutuhkan pilihan saran cepat atau pengetikan nilai bebas di Step 1 dan Step 2 menggunakan arsitektur popover ramping bergaya callout (`clean-datalist-popover`) dengan atribut `data-datalist-id` (tanpa atribut native `list` bawaan browser agar tidak memicu popup OS Chromium yang melayang saat scroll).
- **Karakteristik & Keunggulan Tampilan Ramping:**
  - **Auto-Dismiss saat Scroll Luar:** Dilengkapi event listener scroll global (`window`, `document`, `#admin-main-viewport`) yang otomatis menutup daftar saran saat pengguna menggulir halaman di luar popover, sementara scroll di dalam popover tetap berjalan lancar.
  - **Tampilkan Seluruh Opsi Saat Berisi Nilai:** Saat input difokuskan, diklik, atau ditekan anak panah `▼`, seluruh opsi saran tetap tampil lengkap (tidak terfilter oleh teks yang sudah ada), dilengkapi highlight aksen brand (`var(--color-primary-subtle)`) dan centang aktif (`bi-check2`). Pemfilteran hanya aktif saat pengetikan keyboard.
  - **Seragamkan Kontrol Kanan (`▼` saat Kosong, `×` saat Berisi Nilai):** Saat input kosong muncul anak panah `▼` (klik untuk buka penuh saran); saat terisi nilai otomatis beralih ke tombol `×` untuk membersihkan nilai, mereset counter/chip/pratinjau, dan membuka kembali saran lengkap.
  - **Standar Nilai Saran:** Nilai `"Unlimited"` untuk Stok Produk Tanpa Variasi (`#input-stock-qty`) dan nilai `"Tanpa Batas"` untuk seluruh input Maksimal Pembelian / Max. Order (`#input-normal-max-order` dan `.combo-max-order-input`).
  - **List Variasi Produk Seragam:** Seluruh input dan tombol di tabel List Variasi Produk menggunakan sudut tegas `rounded-md` (`6px`) dan bebas ikon pada tombol Harga Grosir & Kelipatan Order.
  - **Cakupan 9 Elemen Input/Pilih:** Terpasang seragam pada Step 1 (*Label Khusus 1 & 2, Teks Footer Model C*) dan Step 2 (*Stok Produk Unlimited, Maksimal Pembelian Tanpa Batas, Max. Order Tabel Variasi, Nama Grup Variasi 1–4, Layanan Extras, Merek, Asal Produk, dan Judul Tabel Spesifikasi Manual*).

### B. Integrasi Edit Produk dari Daftar Produk ke Sistem Form Produk Baru (`ProductForm`)
- Tombol aksi **Edit** pada tabel produk (`.btn-edit-product`) secara otomatis mencatat menu asal (`lastActiveMenuBeforeForm = 'products'`), memuat data produk secara presisi ke dalam `primaryState` Step 1 & Step 2, dan membuka tampilan form baru (`view-product-form`).
- Menyimpan snapshot kondisi awal produk (`initialEditSnapshot`) untuk mendeteksi perubahan nilai secara akurat.

### C. Modal Konfirmasi Batal Cerdas (SaaS UX Writing)
- **Skenario Tambah Produk Baru (`!isEditMode`):**
  - Jika form masih kosong bersih: Langsung menutup form dan kembali ke menu asal tanpa memunculkan modal popup.
  - Jika ada data yang telah diisi: Memunculkan modal popup konfirmasi *"Batalkan Pembuatan Produk Baru?"* dengan opsi `[Ya, Batalkan]` (bersihkan form, hapus draft lokal, dan kembali ke menu asal) dan `[Tidak]` (tutup modal saja, data form tetap terjaga utuh 100%).
- **Skenario Edit Produk (`isEditMode === true`):**
  - Jika tidak ada perubahan nilai dari data awal: Langsung kembali ke menu Daftar Produk tanpa modal.
  - Jika terdapat perubahan nilai: Memunculkan modal popup konfirmasi *"Batalkan Perubahan Produk?"* dengan deskripsi *"Perubahan pada produk ini tidak akan disimpan."*

---

## ⚡ 8. Sistem Otomatisasi Cache Busting Global (`bump-version.js`) & Anti-Stale HTML Cache

### A. Masalah Cara Lama (Versi Manual & Versi Aset Belang-Belang)
Sebelum adanya sistem otomatisasi ini, setiap kali developer melakukan perubahan pada berkas JavaScript atau CSS, versi cache query string (`?v=...`) harus diedit satu per satu secara manual di dalam berkas HTML:
1. **Rawan Human Error & Versi Belang-Belang:** Sering kali file `admin.html` sudah dinaikkan ke `?v=8.1`, namun file skrip pendukung di baris bawahnya tertinggal di `?v=3.9`, atau file etalase pembeli (`index.html` dan `product.html`) lupa diperbarui sehingga pembeli tetap memuat kode usang dari cache browser.
2. **Tidak Efisien & Membuang Waktu:** Memeriksa dan mengedit belasan hingga puluhan baris tag `<link>` dan `<script>` di berbagai file HTML sangat memakan waktu dan mengaburkan riwayat `git diff`.
3. **Cache Stale pada Client/Kasir:** Jika browser pengguna atau perangkat kasir menyimpan berkas HTML lama di memori cache lokal, browser tidak akan pernah meminta aset CSS/JS versi terbaru ke server GitHub Pages.

---

### B. Solusi & Cara Kerja Engine `bump-version.js`
Skrip [bump-version.js](bump-version.js) adalah automator berbasis Node.js yang menyeragamkan seluruh referensi aset statis lokal di seluruh file HTML proyek secara instan hanya dalam satu perintah:

1. **Perhitungan Waktu Lokal Indonesia (WIB - UTC+7):**
   - Secara otomatis menghitung timestamp aktual zona waktu WIB dalam format ringkas `YYYYMMDDHHmm` (contoh: `202610280024`).
   - Fleksibel: Juga mendukung penentuan versi manual jika diberikan argumen CLI (contoh: `node bump-version.js 8.2`).
2. **Penelusuran Seluruh File HTML Aktif:**
   - Secara otomatis mendeteksi seluruh file HTML di root proyek (`admin.html`, `index.html`, `product.html`, `settings.html`, `theme-editor.html`) serta subdirektori aktif (`superadmin/superadmin.html`).
3. **Penggantian Serempak via Regular Expression Handal:**
   - Menggunakan regex global:
     ```javascript
     const versionRegex = /(\.(?:css|js)\?v=)[0-9a-zA-Z._-]+/g;
     content.replace(versionRegex, `$1${version}`);
     ```
   - Menjamin seluruh aset lokal baik di folder `css/`, `js/`, maupun `src/lib/...` (seperti `src/lib/invoice/invoice-generator.js?v=...`) diperbarui ke versi yang sama persis tanpa ada satu pun yang tertinggal.
4. **Log Terminal Informatif:**
   - Menampilkan ringkasan visual per berkas HTML beserta jumlah aset yang diperbarui dan total keseluruhan aset yang tersinkronisasi.

---

### C. Cara Menjalankan Perintah Terminal
Cukup jalankan satu perintah berikut di terminal sebelum melakukan `git add .`:
```bash
# Otomatis menggunakan timestamp WIB (YYYYMMDDHHmm):
node bump-version.js

# Atau menggunakan versi kustom jika diperlukan:
node bump-version.js 8.2
```

Contoh output eksekusi:
```text
==================================================================
 🚀 BUMP-VERSION: Global Cache Busting Automator (Songer Creative)
 🏷️  Target Versi : ?v=202610280024
==================================================================
 [✓] admin.html                   : 13 aset diseragamkan -> ?v=202610280024
 [✓] index.html                   :  6 aset diseragamkan -> ?v=202610280024
 [✓] product.html                 :  5 aset diseragamkan -> ?v=202610280024
 [✓] settings.html                :  3 aset diseragamkan -> ?v=202610280024
 [✓] theme-editor.html            :  5 aset diseragamkan -> ?v=202610280024
 [✓] superadmin\superadmin.html   :  3 aset diseragamkan -> ?v=202610280024
==================================================================
 ✨ Selesai! 6 file HTML diperbarui (35 aset seragam ke v=202610280024).
==================================================================
```

---

### D. Cakupan 6 File HTML & 35 Aset yang Otomatis Tersinkronisasi

| File HTML Induk | Jumlah Aset | Daftar Aset yang Disinkronkan |
| :--- | :---: | :--- |
| `admin.html` | 13 Aset | `admin.css`, `theme-editor.css`, `utils.js`, `invoice-generator.js`, `db.js`, `pricing-calculator.js`, `category-manager.js`, `promo-manager.js`, `review-manager.js`, `product-form.js`, `product-list.js`, `customer-manager.js`, `admin-app.js` |
| `index.html` | 6 Aset | `storefront.css`, `style.css`, `utils.js`, `db.js`, `pricing-calculator.js`, `buyer-store.js` |
| `product.html` | 5 Aset | `style.css`, `utils.js`, `db.js`, `pricing-calculator.js`, `pdp.js` |
| `settings.html` | 3 Aset | `utils.js`, `db.js`, `settings.js` |
| `theme-editor.html` | 5 Aset | `style.css`, `theme-editor.css`, `utils.js`, `db.js`, `theme-editor.js` |
| `superadmin/superadmin.html` | 3 Aset | `superadmin.css`, `../js/db.js`, `superadmin.js` |
| **TOTAL** | **35 Aset** | **100% Seragam & Terkunci ke Versi Terbaru** |

---

### E. Fungsi 3 Baris Meta Tag `No-Cache` di `<head>`
Untuk melengkapi mekanisme cache busting query string pada aset CSS/JS, seluruh berkas HTML induk telah dilengkapi dengan 3 baris meta header anti-stale cache:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

**Alasan Teknis Mengapa Ini Krusial:**
1. **`Cache-Control: no-cache, no-store, must-revalidate` (HTTP 1.1):**
   - Memaksa browser dan server perantara (proxy/CDN) untuk tidak menyimpan salinan HTML secara permanen di disk/memori cache.
   - Setiap kali halaman dibuka, browser **wajib mengirim validasi** ke GitHub Pages untuk memastikan berkas HTML yang ditampilkan adalah versi paling mutakhir.
2. **`Pragma: no-cache` (HTTP 1.0 Backward Compatibility):**
   - Menjamin perangkat kasir lawas, browser tablet lama, atau browser WebView embedded Android/iOS yang masih mengandalkan spesifikasi protokol HTTP 1.0 tetap memperlakukan berkas HTML sebagai non-cacheable.
3. **`Expires: 0`:**
   - Menyatakan bahwa masa berlaku berkas HTML langsung kedaluwarsa pada detik pertama berkas tersebut diterima, mencegah browser memuat halaman dari memori cache saat tombol *Back / Forward* ditekan.
4. **Sinergi Sempurna:**
   - HTML induk **selalu segar (fresh)** dari server $\rightarrow$ HTML memuat URL aset dengan parameter versi baru `?v=YYYYMMDDHHmm` $\rightarrow$ Browser langsung mengunduh CSS dan JS terbaru tanpa tertahan cache lama sama sekali.

