# RENCANA CAKUPAN PENGUJIAN (TEST COVERAGE PLAN) — TAHAP 2/9
**Proyek:** Songer Creative SaaS (POS & E-Commerce Percetakan Terpadu)  
**Root Direktori:** `D:\pos-songer-creative\`  
**Dokumen Acuan:** `docs/qa/00-project-inventory.md`, `docs/qa/01-feature-matrix.md`, `docs/PRD_MASTER.md`  
**Tanggal:** 29 Oktober 2026  
**Status:** Rencana Pengujian Komprehensif Resmi  

---

## 1. STRATEGI PENGUJIAN & SKALA PRIORITAS RISIKO

Pengujian difokuskan pada perlindungan nilai bisnis, integritas data, dan stabilitas operasional dengan pembagian 3 tingkat prioritas risiko:

```
+----------------------------------------------------------------------------------------------------+
|                                    SKALA PRIORITAS PENGUJIAN                                      |
+----------+--------------------+--------------------------------------------------------------------+
| Prioritas| Klasifikasi Risiko | Ruang Lingkup & Fokus Pengujian                                    |
+----------+--------------------+--------------------------------------------------------------------+
| P0       | CRITICAL (Kritis)  | Kehilangan data (data loss), kesalahan hitung harga/kebocoran laba |
|          |                    | (pricing error), integritas transaksi keuangan, isolasi data antar |
|          |                    | tenant toko (data leakage), dan akses tidak sah.                   |
+----------+--------------------+--------------------------------------------------------------------+
| P1       | MAJOR (Utama)      | Alur hidup produk (buat/edit/hapus), matriks variasi 4 tingkat,    |
|          |                    | modal grosir, kelipatan order, transaksi kasir POS, keranjang      |
|          |                    | belanja, dan alur checkout pesanan.                                |
+----------+--------------------+--------------------------------------------------------------------+
| P2       | MINOR (Tampilan)   | Standar UI/UX, tata letak mobile-first, sinkronisasi tema 2 warna  |
|          |                    | (CSS variables), perilaku popover saran, tooltip, dan bahasa baku. |
+----------+--------------------+--------------------------------------------------------------------+
```

---

## 2. KATALOG SKENARIO PENGUJIAN KOMPREHENSIF

### A. Skenario Prioritas P0 (Critical: Data Loss, Keuangan, Isolasi Tenant, & Keamanan)

| ID Skenario | Modul | Kondisi Awal (Precondition) | Tindakan Pengguna (User Action / Steps) | Hasil yang Diharapkan (Expected Result) | Prioritas | Status Implementasi | Otomasi Realistis |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **TC-P0-001** | `js/db.js` | Tenant `tenant-songer-001` aktif dengan 10 produk di `localStorage`. | Beralih ke tenant lain via `DB.resolveTenant('toko-baru-02')` lalu panggil `DB.getProducts()`. | Produk milik `tenant-songer-001` **tidak boleh bocor** ke tenant baru; sistem mengembalikan array kosong `[]` atau data milik tenant baru. | **P0** | `IMPLEMENTED` | **Ya** (Node VM) |
| **TC-P0-002** | `js/pricing-calculator.js` | Produk tipe Meter (1), harga bahan Rp50.000/m², minimal cetak 1.0 m². | Input ukuran dimensi $P = 50\text{ cm}$ dan $L = 50\text{ cm}$ (luas riil $0.25\text{ m}^2$). | Sistem menetapkan luas tagihan minimal $1.0\text{ m}^2$, menghasilkan harga Rp50.000 (bukan Rp12.500 yang merugikan toko). | **P0** | `IMPLEMENTED` | **Ya** (Node VM) |
| **TC-P0-003** | `js/pricing-calculator.js` | Produk tipe KombStep (7), harga bahan Rp10.000, kelipatan pesanan (step) = 50 pcs. | Pesan kuantitas Qty = 51 pcs. | Sistem membebankan 2 paket bahan ($2 \times 50 \times \text{Rp}10.000$), bukan menghitung 51 satuan tanpa kelipatan. | **P0** | `IMPLEMENTED` | **Ya** (Node VM) |
| **TC-P0-004** | `js/product-form.js` | Sedang mengedit produk yang sudah ada di Seller Center. | Ubah nama produk, lalu klik tombol `[Batal]`. Pada modal konfirmasi, pilih `[Tidak]`. | Modal tertutup, data perubahan form **tetap utuh 100%**, dan form tidak menutup secara tidak sengaja. | **P0** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P0-005** | `js/product-form.js` | Sedang mengedit produk tanpa melakukan perubahan nilai apa pun. | Klik tombol `[Batal]`. | Sistem mendeteksi `hasFormChanged() === false` dan langsung kembali ke Daftar Produk **tanpa memunculkan modal peringatan**. | **P0** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P0-006** | `js/product-form.js` | Form produk Step 2, opsi bahan atau finishing memiliki harga Rp0 (nol sah). | Isi harga bahan Rp0, HPP Rp0, dan simpan form. | Validasi menerima angka 0 sebagai nilai sah; produk tersimpan tanpa error *"Harga wajib diisi"*. | **P0** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P0-007** | `js/admin-app.js` | Kasir POS memiliki keranjang belanja total Rp85.000. | Masukkan uang bayar tunai Rp100.000 dan klik Proses Bayar. | Transaksi berhasil, kembalian tercatat Rp15.000, stok produk berkurang, dan pesanan tersimpan di `DB.getOrders()`. | **P0** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P0-008** | `src/lib/invoice/invoice-generator.js` | Dua transaksi kasir POS berturut-turut pada bulan Oktober 2026. | Generate invoice pertama lalu invoice kedua secara berurutan. | Nomor faktur pertama `B-00001-1026` dan kedua `B-00002-1026`; counter naik atomik tanpa duplikasi nomor. | **P0** | `IMPLEMENTED` | **Ya** (Node VM) |
| **TC-P0-009** | `js/db.js` | Pengguna login admin dengan kata sandi acak yang salah. | Panggil `DB.authenticateAdmin('songer-creative-01', 'admin', 'passwordsalah')`. | Mengembalikan `{ success: false, message: '...' }` dan memblokir akses ke sesi admin. | **P0** | `IMPLEMENTED` | **Ya** (Node VM) |
| **TC-P0-010** | `js/pdp.js` | Produk memiliki aturan batas maksimal order (Max. Order = 10 pcs). | Pembeli memasukkan kuantitas Qty = 15 pcs pada input PDP. | Nilai otomatis di-clamp kembali ke angka 10, memunculkan notifikasi batas maksimum, dan mencegah pemesanan melebihi batas. | **P0** | `IMPLEMENTED` | **Ya** (Mock DOM) |

---

### B. Skenario Prioritas P1 (Major: Alur Produk, Variasi, POS, & Checkout)

| ID Skenario | Modul | Kondisi Awal (Precondition) | Tindakan Pengguna (User Action / Steps) | Hasil yang Diharapkan (Expected Result) | Prioritas | Status Implementasi | Otomasi Realistis |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **TC-P1-001** | `js/product-form.js` | Form Tambah Produk Baru baru saja dibuka (Step 1). | Jangan pilih jenis produk fisik/non-fisik, langsung coba klik tombol `Lanjut ke Langkah 2`. | Sistem memblokir navigasi, menandai input jenis produk dengan border merah, dan menampilkan pesan error. | **P1** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P1-002** | `js/product-form.js` | Form Step 1: Radio `physical` dipilih. | Lanjut ke Step 2 dan periksa Seksi Pengiriman & Dimensi. | Seksi pengiriman aktif, mewajibkan berat paket, dan menampilkan input dimensi kemasan volumetrik PxLxT. | **P1** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P1-003** | `js/product-form.js` | Form Step 1: Radio `non_physical` dipilih. | Lanjut ke Step 2 dan periksa Seksi Pengiriman & Stok. | Modul pengiriman otomatis dinonaktifkan (`has_shipping = false`), input kurir disembunyikan, dan stok diset Unlimited. | **P1** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P1-004** | `js/product-form.js` | Produk memiliki 2 opsi Variasi 1 (Bahan A, Bahan B) dan 1 variasi finishing (Variasi 2). | Buka modal `#modal-specific-options` pada baris Bahan A, pilih `Spesifik`, lalu centang hanya Opsi Finishing 1. | Baris Bahan A hanya terhubung ke Finishing 1; baris Bahan B tetap berstatus independen (`Pilih`) tanpa ikut tercentang. | **P1** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P1-005** | `js/product-form.js` | Header checkbox Harga Grosir diaktifkan (`has_wholesale = true`). | Buka modal grosir `#modal-wholesale-config` pada baris yang masih berstatus `Pilih`. | Kedua radio `Normal` dan `Bertingkat` berstatus uncheck secara default; seluruh input field kosong tanpa angka default 10, 50, atau 500. | **P1** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P1-006** | `js/product-form.js` | Header checkbox Kelipatan Order diaktifkan (`has_order_multiple = true`). | Ketik angka `1` pada sel input `.combo-order-multiple-input`. | Muncul pesan peringatan merah `<p>Minimal Kelipatan 2</p>`, border input merah, dan baris dinyatakan belum valid. | **P1** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P1-007** | `js/product-form.js` | Header checkbox Kelipatan Order aktif. | Klik saran popover *"Tanpa Kelipatan"* pada sel input. | Input terisi `"Tanpa Kelipatan"`, pesan error hilang, border kembali abu-abu normal, dan baris dinyatakan valid bebas kelipatan. | **P1** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P1-008** | `js/pdp.js` | Produk memiliki aturan kelipatan order = 5 pcs. | Buka halaman PDP produk bersangkutan. | Nilai awal Qty selalu dimulai dari angka `1` (tidak melompat ke 5), muncul teks panduan kelipatan, dan tombol CTA terkunci `disabled`. | **P1** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P1-009** | `js/pdp.js` | Produk kelipatan 5 pcs, Qty saat ini = 1. | Klik tombol `+` (Plus) 4 kali berturut-turut. | Nilai Qty bertambah persis +1 per klik ($1 \rightarrow 2 \rightarrow 3 \rightarrow 4 \rightarrow 5$). Saat mencapai 5, teks peringatan hilang dan tombol CTA aktif. | **P1** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P1-010** | `js/pdp.js` | Produk kelipatan 5 pcs, Qty saat ini = 5. | Klik tombol `+` sekali (Qty menjadi 6). | Notifikasi muncul kembali: *"Jumlah pesanan wajib kelipatan 5 Pcs... Cth: 10,15,20,25,Dst."* dan tombol CTA kembali terkunci. | **P1** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P1-011** | `js/pdp.js` | Qty saat ini = 1. | Klik tombol `-` (Minus). | Nilai Qty tetap di angka 1 (tidak boleh bernilai 0 atau negatif), tombol `-` dinonaktifkan (`disabled`). | **P1** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P1-012** | `js/product-form.js` | Ada baris kombinasi variasi yang belum diatur (status `Pilih`). | Klik tombol `Uji Coba Produk` atau `Simpan Produk`. | Sistem memblokir aksi dan menampilkan daftar baris yang belum lengkap sebelum mengizinkan proses simpan/uji coba. | **P1** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P1-013** | `js/product-form.js` | Menambah gambar produk via upload. | Masukkan berkas gambar JPG/PNG resolusi tinggi (2000x2000px). | Sistem otomatis mengompresi senyap via HTML5 Canvas menjadi format WebP $\le 1200\times 1200\text{px}$ kualitas 0.8 tanpa alert mengganggu. | **P1** | `IMPLEMENTED` | **Ya** (Canvas API) |
| **TC-P1-014** | `js/buyer-store.js` | Pembeli menambahkan produk ke keranjang belanja di storefront. | Buka cart drawer dan klik tombol Checkout WhatsApp. | Pesanan tercatat di `DB.getOrders()` dan peramban membuka URL `wa.me` dengan rincian pesanan yang rapi. | **P1** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P1-015** | `js/admin-app.js` | Kasir POS menambahkan 3 item berbeda ke keranjang. | Hapus item kedua dari keranjang belanja. | Item kedua terhapus, subtotal dan total kasir langsung diperbarui secara reaktif. | **P1** | `IMPLEMENTED` | **Ya** (Mock DOM) |

---

### C. Skenario Prioritas P2 (Minor: UI/UX, Tema, Responsivitas, & Bahasa)

| ID Skenario | Modul | Kondisi Awal (Precondition) | Tindakan Pengguna (User Action / Steps) | Hasil yang Diharapkan (Expected Result) | Prioritas | Status Implementasi | Otomasi Realistis |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **TC-P2-001** | `settings.html` | Toko menggunakan warna default `#33b589`. | Merchant mengganti warna brand menjadi `#2563eb` via Color Picker di Pengaturan Toko. | Nilai `--color-primary` pada CSS `:root` otomatis berubah ke `#2563eb`, dan tombol/badge ikut berubah warna dinamis. | **P2** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P2-002** | `js/product-form.js` | Pengguna membuka popover saran (`.clean-datalist-popover`) pada salah satu input form. | Gulir halaman di luar popover (`scroll`). | Popover tertutup otomatis (*auto-dismiss on outside scroll*), sementara scroll halaman tetap berjalan lancar. | **P2** | `IMPLEMENTED` | Manual Browser |
| **TC-P2-003** | `js/product-form.js` | Grid slot foto produk menampilkan foto yang sudah diupload. | Klik radio pemilih rasio foto `4:3 (Lanskap)`. | Seluruh slot foto beralih serentak ke kelas `aspect-[4/3]` tanpa perlu memuat ulang gambar dari awal. | **P2** | `IMPLEMENTED` | **Ya** (Mock DOM) |
| **TC-P2-004** | `admin.html` | Halaman dibuka pada resolusi ponsel smartphone (< 640px). | Navigasi ke Step 2 form produk dan scroll halaman ke bawah. | Subnavbar tetap menempel rapat di `top: 0` tanpa padding melayang, dan ScrollSpy aktif memperbarui tab seksi yang aktif. | **P2** | `IMPLEMENTED` | Manual Browser |
| **TC-P2-005** | Seluruh Modul UI | Memeriksa seluruh teks antarmuka tombol, placeholder, modal, dan pesan kesalahan. | Audit teks label pada form dan storefront. | Seluruh teks menggunakan Bahasa Indonesia yang ramah pengguna awam tanpa istilah asing/koding (*zero jargon*). | **P2** | `IMPLEMENTED` | **Ya** (Regex Scan) |
| **TC-P2-006** | `css/admin.css` | Memeriksa sel tabel matriks kombinasi pada kolom Variasi 2–4, Harga Grosir, dan Kelipatan Order. | Inspeksi kotak teks dan tombol ikon aksi. | Kotak teks berwarna putih bersih (`bg-white border-slate-300 rounded-md`), dan tombol ikon gerigi/pensil berdiri bersih tanpa background kotak. | **P2** | `IMPLEMENTED` | **Ya** (DOM Check) |
| **TC-P2-007** | `bump-version.js` | Developer telah memodifikasi berkas JS/CSS. | Jalankan `node bump-version.js` di terminal. | Seluruh 35 referensi aset statis pada 6 berkas HTML tersinkronisasi ke versi timestamp WIB terbaru (`?v=YYYYMMDDHHmm`). | **P2** | `IMPLEMENTED` | **Ya** (Node CLI) |

---

## 3. PETA SKENARIO OTOMATIS YANG REALISTIS (AUTOMATION CANDIDATES)

Berdasarkan arsitektur client-side saat ini, skenario-skenario di atas dapat diotomasi secara realistis menggunakan lingkungan **Node.js Headless Virtual Environment (VM Sandbox)** tanpa ketergantungan pada browser aktif:

```
+---------------------------------------------------------------------------------------------------------+
|                                  ARSITEKTUR TESTING OTOMATIS REALISTIS                                   |
+------------------------------+---------------------------+----------------------------------------------+
| Kelompok Pengujian           | Target Skenario           | Mekanisme Otomasi yang Diusulkan             |
+------------------------------+---------------------------+----------------------------------------------+
| 1. Pricing Engine Suite      | TC-P0-002, TC-P0-003      | Pure Node.js unit tests terhadap fungsi      |
|                              |                           | PricingCalculator.calculateProductPrice()    |
+------------------------------+---------------------------+----------------------------------------------+
| 2. Multi-Tenant Isolation    | TC-P0-001, TC-P0-009      | Node.js sandbox dengan mock localStorage     |
|    & Data Integrity          | TC-P0-008                 | memverifikasi partisi kunci pos_{t}_{tid}    |
+------------------------------+---------------------------+----------------------------------------------+
| 3. Form Validation Pipeline  | TC-P1-001, TC-P1-004,     | Headless DOM mock memanggil fungsi validasi  |
|    & State Gating            | TC-P1-006, TC-P1-012      | ProductForm.validatePrerequisites...()       |
+------------------------------+---------------------------+----------------------------------------------+
| 4. Stepper & Rules Reaction  | TC-P1-008, TC-P1-009,     | Node.js headless event dispatch pada elemen  |
|    (PDP & Shopee Drawer)     | TC-P1-010, TC-P1-011      | btn-qty-plus dan evaluasi locking CTA button |
+------------------------------+---------------------------+----------------------------------------------+
| 5. SaaS UX & Bahasa Scan     | TC-P2-005                 | Script regex memindai seluruh string UI      |
|                              |                           | untuk mendeteksi jargon koding asing dilarang|
+------------------------------+---------------------------+----------------------------------------------+
```

---

## 4. ANALISIS KESENJANGAN & AREA KRITIS YANG BELUM TERLINDUNGI (CRITICAL UNCOVERED AREAS)

Berikut adalah area berisiko tinggi yang saat ini **sama sekali belum memiliki perlindungan kode pengujian maupun guardrail teknis**:

1. **Risiko Kehilangan Data Transaksi Akibat Pembersihan Cache Browser**:
   - Karena sistem mengandalkan `localStorage` lokal tanpa backup cloud otomatis, pembersihan data peramban (*clear site data*) akan menghapus seluruh rekaman pesanan, invoice, dan katalog merchant tanpa opsi pemulihan (*disaster recovery*).
2. **Ketiadaan Validasi Bentrokan Nomor Faktur Lintas Saluran (Web vs Kasir)**:
   - Kasir POS memanggil `InvoiceGenerator` resmi (menghasilkan `B-xxx`), namun Storefront web menghasilkan `INV-xxx`. Skenario rekonsiliasi nomor bersama yang dijanjikan pada PRD belum terlindungi oleh sistem.
3. **Risiko Selisih Perhitungan Antar-Modul (Pricing Discrepancy)**:
   - Karena `buyer-store.js`, `product-form.js`, dan `admin-app.js` tidak memanggil `pricing-calculator.js` yang sama, ada risiko pembeli melihat harga Rp10.500 di katalog etalase, namun saat dihitung di kasir atau drawer PDP menjadi Rp11.000 akibat perbedaan rumus pembulatan luas atau diskon kuantitas.
4. **Ketiadaan Proteksi Brute-Force pada Login Admin**:
   - Fungsi `authenticateAdmin` di `js/db.js` dapat dipanggil berulang kali tanpa ada pembatasan frekuensi (*rate limiting*), penundaan (*delay throttle*), atau penguncian akun sementara.
5. **Kelebihan Beban Ukuran LocalStorage (Quota Exceeded Risk)**:
   - Penyimpanan gambar produk berformat Base64 langsung ke dalam objek produk di `localStorage` berisiko memicu error fatal `QuotaExceededError` jika merchant mengunggah banyak produk dengan variasi foto lengkap. Belum ada mekanisme peringatan kuota penyimpanan pada antarmuka admin.

---
*Dokumen Rencana Cakupan Pengujian ini sah dan melengkapi inventarisasi fitur Tahap 2.*

