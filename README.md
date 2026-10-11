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
├── Buka-Aplikasi.bat                 # Peluncur 1-klik aplikasi langsung ke browser
├── index.html                        # Single Page Application terpadu (Buyer Storefront + Shopee Seller Center)
├── schema.sql                        # DDL Relasional PostgreSQL / Supabase langsung
├── assets/
│   └── images/
│       ├── songer-logo.png           # Logo bulat resmi (Favicon tab browser)
│       └── logo-songer-creative.png  # Logo horizontal resmi (Header navbar)
├── css/
│   └── style.css                     # Design tokens (#33b589) & styling
├── js/
│   ├── app.js                        # Router navigasi, branding sync & toast notification
│   ├── buyer-store.js                # Etalase pembeli: 3 card variants, kalkulator PxL, review & keranjang
│   ├── category-manager.js           # Seller Center: Kategori & Sub-Kategori CRUD + konfigurasi invoice
│   ├── db.js                         # Database engine lokal, ORM, label faktur & cascade delete logic
│   ├── product-form.js               # Seller Center: Formulir produk dinamis (Poin A-N)
│   ├── product-list.js               # Seller Center: Tabel manajemen produk Shopee style
│   └── review-manager.js             # Seller Center: Manajemen & moderasi ulasan pembeli
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

