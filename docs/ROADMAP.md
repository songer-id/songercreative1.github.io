# 🗺️ ROADMAP PENGEMBANGAN SISTEM E-COMMERCE & POS
**Proyek:** POS & E-Commerce By Songer Creative (Multi-Tenant Printing & Retail SaaS)  
**Target Arsitektur:** Laravel 12 (Backend & Inertia API) + React 18 / Inertia.js v2 (Frontend SPA) + PostgreSQL / Supabase  
**Status Dokumen:** Aktif & Terkonsolidasi (Per Oktober 2026)

---

## 📌 Status Terkini & Capaian (Executive Summary)

Aplikasi saat ini telah berhasil mengimplementasikan fondasi bisnis percetakan dan retail tingkat tinggi dengan arsitektur **Single-Source-of-Truth (SSOT)**:
- **Toko Web Pembeli & PDP:** Storefront dinamis dengan 3 model kartu etalase, Dedicated PDP (`product.html`), konfigurator interaktif bahan & finishing, kalkulator instan PxL, serta tombol checkout WhatsApp.
- **Seller Center & Kasir POS:** Manajemen produk bertahap (*wizard form*), kalkulasi HPP dan estimasi laba kotor real-time, manajemen promo terpadu dengan migrasi otomatis ke event bulanan, manajemen pengiriman fisik vs non-fisik, dan kasir walk-in berfitur *Shared Counter Invoice*.
- **Pembersihan Repositori:** File tes sementara (`test_stage1_results.html`, `test_syntax.html`) dan aset tidak terpakai (`download.png`) telah dibersihkan secara tuntas. Konfigurasi `.gitignore` resmi telah ditambahkan untuk mencegah file sampah mencemari repositori.

---

## 🎯 Rincian Milestone & Tahapan Pengembangan

### MILESTONE 1: Fondasi Backend & Database Relasional (Laravel 12 & PostgreSQL)
- [x] **Arsitektur Multi-Tenant:**
  - Isolasi data per-toko via `tenant_id` pada seluruh entitas relasional.
  - Pembagian lisensi SaaS: `PAKET_A_BASIC` (Retail simpel) vs `PAKET_B_PRO_CALCULATOR` (Kalkulator custom PxL + WA Gateway).
- [x] **Skema Basis Data Relasional (`prisma/schema.prisma` & `schema.sql`):**
  - Model: `Tenant`, `TenantSettings`, `Category`, `SubCategory`, `Product`, `ProductMaterial`, `ProductFinishing`, `ProductDiscountTier`, `Order`, `OrderItem`, `Review`, `InvoiceSequence`.
- [x] **Generator Nomor Faktur Bersama (Shared Counter):**
  - Standar format: `[A/B]-[PrefixLabel]-[Counter 5 Digit]-[MMYY]` (A: Web Storefront, B: Kasir POS).
  - Anti-bentrokan (*zero-collision*) atomic increment pada PostgreSQL dan rekonsiliasi prefix `OFF` kasir offline.
- [ ] **Migrasi Service Layer Laravel 12:**
  - Pembuatan Controller RESTful & Inertia v2 endpoints untuk manajemen produk, kategori, pelanggan, dan faktur kasir.
  - Middleware autentikasi multi-tenant dan role management (Superadmin vs Tenant Store Owner).

---

### MILESTONE 2: Core Pricing Engine & Modul Kustom Dimensi (P x L)
- [x] **Kalkulator 6 Rumus Aktif (`pricing-calculator.js`):**
  - `Meter (1)`: Luas $(P \times L) / 10000 \times \text{Bahan} + \text{Finishing}$.
  - `KombF (2)`: Harga Bahan $+$ Total Finishing terpilih.
  - `Paket (4)`: Bundle paket hemat dengan finishing gratis/ekstra.
  - `Kg (5)`: Bobot riil kg $\times$ Harga Bahan per Kg $+$ Finishing.
  - `Lt (6)`: Volume liter $\times$ Harga Bahan per Liter $+$ Finishing.
  - `KombStep (7)`: Wajib kelipatan kuantitas ($\text{Bahan} \times \lceil\text{Qty}/\text{Step}\rceil + \text{Finishing} \times \text{Qty}$).
- [x] **Kustomisasi Batas Minimal Ukuran & Pembulatan Luas:**
  - Sub-toggle *"Atur Batas Angka Kustom"* untuk ambang batas (*threshold*) dan pengenaan biaya minimal (*charge*).
  - Input tanpa default `1` yang memaksa (bersih dengan placeholder kontekstual).
  - Pengecekan nilai `0` (nol) yang sah pada harga dan HPP (tidak dianggap kosong).
  - Drawer simulasi perhitungan luas efektif vs luas tagihan dengan breakdown margin laba / rugi.
- [x] **Kalkulator Volumetrik Otomatis:**
  - Konversi dimensi paket $(P \times L \times T) / 6000$ (reguler) dan $/ 4000$ (kargo) disandingkan dengan berat riil.

---

### MILESTONE 3: Manajemen Pengiriman Fisik vs Non-Fisik & Kurir
- [x] **Klasifikasi Tipe Produk Interaktif:**
  - **Produk Fisik:** Membuka manajemen stok, dimensi kemasan, bobot volumetrik, dan pilihan ekspedisi.
  - **Non-Fisik (Jasa/Digital):** Menonaktifkan modul pengiriman secara otomatis, menyembunyikan input kurir dan berat, serta menjaga tampilan form bersih.
- [x] **Kurir Toko / Lokal & Kurir Nasional:**
  - Pilihan ekspedisi populer (JNE, J&T, SiCepat, Anteraja, Pos Indonesia, dll.).
  - Tarif khusus Satu Desa (flat), Satu Kecamatan, dan Bebas Ongkir lokal.
- [x] **Dukungan Pembayaran COD (Cash on Delivery):**
  - Saklar COD interaktif dengan perlindungan visual multi-layanan dan sinkronisasi live preview.

---

### MILESTONE 4: Program Promo Harian & Migrasi Event Kampanye
- [x] **Mode Standar Tunggal (Promo Harian):**
  - Tampilan ringkas berbasis badge status `Promo Harian` yang aktif tanpa kalender/tanggal rumit.
- [x] **Otomasi Migrasi ke Promo Bulanan / Tanggal Kembar:**
  - Saklar *"Sertakan di Promo Otomatis Bulanan / Event Besar"* yang otomatis bermigrasi saat jadwal kampanye toko tiba.
- [x] **Konversi Cerdas Diskon:**
  - Toggle tipe persen `[%]` vs nominal rupiah `[IDR]` dengan live badge preview.
  - Nilai diskon bersih tanpa default `0` semu, validasi $>0$ saat promo diaktifkan.

---

### MILESTONE 5: Standarisasi UI/UX Mobile-First & Seller Experience
- [x] **Grid Media Shopee-Style:**
  - Slot 9 foto dengan kompresi senyap (*silent canvas compression*) berformat WebP/JPEG kualitas 0.8.
  - Selektor rasio aspek foto (`1:1` Persegi vs `4:3` Lanskap).
- [x] **Sub-Navbar Sticky & Auto-ScrollSpy Mobile:**
  - Sub-navigasi melayang di bawah header dengan pelacakan scroll aktif (*ScrollSpy*).
  - Live preview drawer dengan overlay hitam penuh 100% pada layar smartphone.
- [x] **Bahasa Deskripsi Baku & Desain Bersih:**
  - Menghilangkan ikon sampah dan teks redundan yang bertele-tele.
  - Tooltip dan pesan bantuan kontekstual yang rapi dan proporsional.

---

### MILESTONE 6: AI Content Generation & Manajemen Token
- [x] **Generator Deskripsi AI Terintegrasi:**
  - Tombol *"Rangkai Deskripsi AI"* satu klik berbasis judul produk dan kategori yang dipilih.
  - Kotak tinjau hasil generasi dengan opsi *"Gunakan Teks Ini"* atau *"Batal"*.
- [ ] **Sistem Manajemen Kuota & Token AI (Next Phase):**
  - Penyimpanan sisa token AI per-tenant pada tabel database `TenantSettings.ai_token_balance`.
  - Integrasi API resmi Gemini / OpenAI via Laravel 12 Backend dengan *rate limiter* dan enkripsi kunci API.
  - Histori generasi copywriting dan fallback template lokal jika jaringan offline.

---

### MILESTONE 7: Transformasi Frontend ke React 18 / Inertia.js v2
- [ ] **Modernisasi Komponen ke React 18:**
  - Mengubah kode imperatif DOM di `product-form.js`, `buyer-store.js`, dan `pdp.js` menjadi komponen fungsional React dengan Hooks (`useState`, `useReducer`, `useMemo`).
  - Implementasi Typed Props / TypeScript untuk menjamin kekebalan tipe data (*type-safety*).
- [ ] **State Management Terpadu (Zustand / TanStack Query):**
  - Mengonsolidasikan `primaryState`, `materialsState`, dan `finishingsState` ke dalam central store yang reaktif.
  - Cache mutasi transaksi kasir offline yang tersinkronisasi via Service Worker / Workbox.
- [ ] **Integrasi Inertia.js v2:**
  - Server-driven SPA tanpa perlu membangun API terpisah untuk kebutuhan internal dashboard.
  - Dukungan partial reloads, scroll preservation, dan deferred props untuk performa maksimal.

---

## 📊 Matriks Status Fitur

| Modul Fitur | Status | File Implementasi | Catatan Kesiapan |
| :--- | :---: | :--- | :--- |
| **Kalkulator PxL & Pricing Engine** | ✅ Selesai | `js/pricing-calculator.js`, `product-form.js` | 6 rumus aktif, batas minimal ukuran, toleransi 0 |
| **Manajemen Pengiriman & COD** | ✅ Selesai | `js/product-form.js`, `css/admin.css` | Tipe fisik/non-fisik, volumetrik, kurir lokal & nasional |
| **Program Promo & Diskon** | ✅ Selesai | `js/product-form.js` | Promo Harian, migrasi otomatis Promo Bulanan |
| **Galeri Foto & Kompresi Senyap** | ✅ Selesai | `js/product-form.js` | 9 slot Shopee style, Canvas auto-compress 0.8 |
| **Sub-Navbar Sticky & Mobile UX** | ✅ Selesai | `js/product-form.js`, `admin.html` | Auto-ScrollSpy, overlay hitam live preview 100% |
| **Generator Deskripsi AI** | ✅ Selesai (UI) | `js/product-form.js` | Copywriting instan 1-klik, siap integrasi API |
| **Sistem Token AI & Quota Backend** | 🔄 Terjadwal | Backend Laravel 12 (`services/ai-service`) | Integrasi API Gemini + saldo token multi-tenant |
| **Migrasi React 18 + Inertia v2** | 🔄 Terjadwal | `resources/js/Pages/Product/` | Mengonversi imperatif JS ke komponen reaktif modern |
