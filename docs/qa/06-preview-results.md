# LAPORAN HASIL PENGUJIAN TAHAP 6/9: E2E PRODUCT PREVIEW & TEST MODE

**Proyek:** Songer Creative SaaS  
**Root Proyek:** `D:\pos-songer-creative\`  
**Test Suite:** `tests/product-preview.spec.js`  
**Waktu Eksekusi Terakhir:** 30 Oktober 2026, 02:24:51 – 02:25:36 WIB  
**Command:** `npm run test:preview` (`cmd /c npm run test:preview`)  
**Exit Code:** `0` (SUCCESS)  
**Status Akhir:** **100% PASS (4/4 Lolos)**  
**Total Durasi:** `38.2s`  

---

## 1. Ringkasan Eksekusi Pengujian

Setelah menyelesaikan perbaikan prasyarat pengujian pada `tests/product-preview.spec.js` sesuai instruksi (tanpa mengubah kode produksi aplikasi, tanpa melemahkan assertion, dan tanpa menggunakan `force: true`), seluruh skenario wajib pada Tahap 6 berhasil lolos pengujian secara riil menggunakan runner Playwright (Chromium Headless, 1 worker).

| No | Skenario Uji Wajib | Status | Durasi | Cakupan Verifikasi |
|---|---|---|---|---|
| 1 | **Preview Card Produk (Step 1)** | **PASS** | 10.6s | Interaksi pembuka Jenis Produk (Fisik) & Model Kartu (Klasik), update real-time nama produk, upload gambar deterministik, rotasi model kartu (B: Minimalis 3:4, C: Detail 4:3, A: Klasik 1:1), serta simulasi toggle promo diskon. |
| 2 | **Preview Detail Produk (Step 2 - Mode Pratinjau)** | **PASS** | 4.9s | Transisi sah ke Step 2, verifikasi chip variasi aktif ('Merah Cabe' & 'Biru Navy') di Mini PDP pasif, penolakan aktivasi Mode Uji Coba saat konfigurasi belum lengkap (`#preview-scoped-modal-root`), serta pemulihan ke Mode Uji Coba setelah konfigurasi dilengkapi. |
| 3 | **Uji Coba Qty dan Kelipatan (Step 2 - Mode Uji Coba)** | **PASS** | 7.1s | Pembukaan drawer interaktif checkout, Qty awal 1, minus disabled pada 1, notice kelipatan 5 & CTA confirm terkunci pada Qty 1–4, klik stepper (+) mencapai Qty 5 (notice hilang & CTA aktif), klik (+) ke 6 (notice muncul kembali & CTA terkunci), klik (-) kembali ke 5 (CTA aktif), dan penurunan bertahap hingga 1 (tidak bisa turun di bawah 1). |
| 4 | **Uji Coba Harga Grosir (Step 2 - Mode Uji Coba)** | **PASS** | 7.3s | Pemilihan opsi Silver Metalik (Rp50.000), kenaikan Qty ke 10 pcs via stepper (+), kalkulasi otomatis tier grosir Rp5.000 (menjadi Rp45.000), peralihan variasi ke Hitam Matte (terhitung ulang dinamis menjadi Rp55.000), penurunan Qty ke 9 via stepper (-) mengembalikan harga normal Rp60.000, dan peralihan kembali ke Silver Metalik pada Qty 9 mengembalikan harga normal Rp50.000. |

---

## 2. Masalah Prasyarat yang Ditemukan & Cara Perbaikannya

Selama audit persiapan pengujian, ditemukan beberapa prasyarat alur antarmuka dan fixture data yang sebelumnya menghalangi jalannya pengujian sebelum mencapai fungsi inti:

1. **Prasyarat Form Step 1 (Skenario 1):**
   - *Masalah:* Field Nama Produk (`#input-prod-name`) terkunci di bawah dua lapisan kondisional UI: (1) Jenis Produk (`Fisik`/`Non Fisik`) dan (2) Model Kartu (`Kartu Klasik`). Sebelum kedua radio button tersebut dipilih, field nama berstatus `hidden` (`display: none`).
   - *Perbaikan:* Ditambahkan klik terurut pada `label:has-text("Fisik")` lalu `label:has-text("Kartu Klasik")` sebelum memvalidasi dan mengisi nama produk.

2. **Ketergantungan Label Promosi Khusus pada Validasi Step 1 (Skenario 2–4):**
   - *Masalah:* Pemanggilan `ProductForm.goToStep(2)` secara internal memicu `validateStep1()`. Jika `show_badge` bernilai `true` (default form), sistem mewajibkan `custom_label_1` terisi, sehingga navigasi ke Step 2 tertahan.
   - *Perbaikan:* Menyelaraskan fixture dan form state dengan `show_badge: false` dan `has_custom_labels: false`, memastikan validasi Step 1 terpenuhi secara sah sebelum masuk ke Step 2.

3. **Ambiguitas Selector Desktop vs Mobile (Playwright Strict Mode):**
   - *Masalah:* Komponen tombol `.btn-preview-buy-now` dan drawer `.mini-pdp-drawer-sheet` dirender ganda di DOM (satu di desktop preview `#card-live-preview-box`, satu di mobile preview `#mobile-card-preview-container`), menyebabkan pelanggaran strict mode Playwright.
   - *Perbaikan:* Menargetkan selector secara spesifik ke container desktop `#card-live-preview-box` (menggunakan `.first()` / selector ber-scope).

4. **Kelengkapan Atribut Matriks Kombinasi (Skenario 4):**
   - *Masalah:* Pada produk dengan variasi, fungsi `canActivateTestMode()` memeriksa bahwa setiap baris matriks kombinasi memiliki batasan `max_order`. Pada fixture awal, `materials` tidak mendefinisikan `max_order`, memicu modal penolakan `Max. Order (Baris Kombinasi ...)`.
   - *Perbaikan:* Melengkapi atribut `min_order: 1` dan `max_order: 500` pada entri `materials` di fixture produk variasi.

---

## 3. Detail Hasil Eksekusi per Skenario

### 3.1 Skenario 1: Preview Card Produk (Step 1)
- **Eksekusi:**
  - Jenis Produk `Fisik` dipilih -> Model `Kartu Klasik` dipilih -> `#input-prod-name` menjadi terlihat.
  - Nama diisi `"T-Shirt Sablon DTF Premium Distro"` -> Teks pada live preview kartu terbarui seketika.
  - Gambar 1x1 PNG diunggah -> Tag `<img>` pada live preview kartu muncul.
  - Model kartu dialihkan ke `Kartu Minimalis` (Rasio 3:4) -> State kartu bernilai `'B'`.
  - Model kartu dialihkan ke `Kartu Detail` (Rasio 4:3) -> State kartu bernilai `'C'`.
  - Model kartu dikembalikan ke `Kartu Klasik` (Rasio 1:1) -> State kartu bernilai `'A'`.
  - Toggle `#cfg-simulate-countdown-preview` dicentang -> Indikator diskon/countdown tiket percent muncul di kartu preview.
- **Hasil:** `PASS` (Durasi: 10.6s).

### 3.2 Skenario 2: Preview Detail Produk (Step 2 - Mode Pratinjau Pasif)
- **Eksekusi:**
  - Form edit produk variasi dimuat dan berhasil berpindah ke Step 2 (`#step-pane-2` terlihat).
  - Mode default Step 2 terverifikasi pasif (`#btn-preview-mode-passive` aktif).
  - Chip variasi `"Merah Cabe"` dan `"Biru Navy"` tampil di Mini PDP.
  - Simulasi data belum lengkap: Nama produk dikosongkan.
  - Tombol `#btn-preview-mode-test` diklik -> Transisi ditolak, modal peringatan `#preview-scoped-modal-root` muncul dengan pesan `"Silahkan Lengkapi Informasi Penjualan Terlebih Dahulu"`.
  - Nama produk diperbaiki kembali -> Tombol `#btn-preview-mode-test` diklik -> Modal penolakan hilang dan mode Uji Coba berhasil aktif.
- **Hasil:** `PASS` (Durasi: 4.9s).

### 3.3 Skenario 3: Uji Coba Qty dan Kelipatan (Step 2 - Mode Uji Coba)
- **Eksekusi:**
  - Mode Uji Coba diaktifkan -> Tombol "Beli Sekarang" diklik -> Drawer checkout terbuka.
  - Qty awal bernilai 1; tombol minus (-) berstatus `disabled`.
  - Peringatan kelipatan muncul: `"Jumlah pesanan wajib kelipatan 5 Pcs..."`; tombol konfirmasi checkout `disabled`.
  - Tombol stepper (+) diklik berturut-turut:
    - Qty 2: Minus aktif, peringatan tetap ada, konfirmasi `disabled`.
    - Qty 3: Peringatan tetap ada, konfirmasi `disabled`.
    - Qty 4: Peringatan tetap ada, konfirmasi `disabled`.
    - Qty 5: Kelipatan 5 terpenuhi, peringatan hilang (`hidden`), konfirmasi `enabled`.
    - Qty 6: Peringatan kelipatan muncul kembali, konfirmasi `disabled`.
  - Tombol stepper (-) diklik:
    - Qty kembali ke 5: Peringatan hilang, konfirmasi kembali `enabled`.
  - Tombol stepper (-) diklik berulang kali hingga Qty mencapai 1: Nilai berhenti tepat di 1 dan tombol minus terkunci (`disabled`), membuktikan Qty tidak dapat turun di bawah 1.
- **Hasil:** `PASS` (Durasi: 7.1s).

### 3.4 Skenario 4: Uji Coba Harga Grosir (Step 2 - Mode Uji Coba)
- **Eksekusi:**
  - Drawer checkout dibuka dengan variasi Tumbler Custom (Tier Grosir: Min 10 pcs -> Potongan Rp5.000).
  - Opsi `"Silver Metalik"` dipilih -> Harga dasar Rp50.000 ditampilkan.
  - Tombol stepper (+) diklik hingga Qty mencapai 10 pcs.
  - Tampilan harga di drawer otomatis terdiskon: `Rp45.000` (Rp50.000 - Rp5.000).
  - Variasi dialihkan ke `"Hitam Matte"` (Harga normal Rp60.000) sementara Qty tetap 10 -> Harga langsung terhitung ulang dinamis: `Rp55.000` (Rp60.000 - Rp5.000).
  - Tombol stepper (-) diklik 1 kali sehingga Qty menjadi 9 pcs -> Karena di bawah batas 10 pcs, harga kembali normal ke `Rp60.000`.
  - Variasi dialihkan kembali ke `"Silver Metalik"` pada Qty 9 -> Harga kembali normal ke `Rp50.000`.
- **Hasil:** `PASS` (Durasi: 7.3s).

---

## 4. Dugaan Masalah Aplikasi / Catatan Arsitektural untuk Perbaikan Terpisah

1. **ID Duplikat antara Desktop Preview & Mobile Preview Sheet:**
   - Elemen antarmuka seperti `.btn-preview-buy-now`, `.mini-pdp-drawer-sheet`, dan `#preview-scoped-modal-root` dirender bersamaan baik untuk container viewport desktop maupun mobile. Jika selector Playwright tidak dibatasi container induk, Playwright akan melempar pelanggaran strict mode. Disarankan agar wrapper mobile menggunakan prefix class/id yang konsisten (misal: `#mobile-...`) untuk mencegah tabrakan query.
2. **Ketergantungan Bertingkat Step 1 (Pilihan Jenis -> Model Kartu -> Form Input):**
   - Transisi formulir Step 1 sangat ketat: field input dasar nama dan foto produk tidak ada di DOM / hidden sebelum pengguna memilih jenis fisik dan salah satu model kartu. Hal ini adalah keputusan desain bisnis yang sah, namun perlu diperhatikan dalam dokumentasi panduan pengguna (*user onboarding*).

---

## 5. Status Berkas & Git Saat Ini

Pemeriksaan status repositori Git (`git status --short`):
```text
 M .gitignore
 M package.json
?? docs/qa/
?? package-lock.json
?? playwright.config.js
?? tests/
```

- **Branch aktif:** `main` (tidak ada commit, tidak ada push ke origin).
- **Perubahan yang terjadi:**
  - `package.json` (pendaftaran script test Playwright).
  - `.gitignore` (penambahan folder `test-results/`).
  - `tests/product-preview.spec.js` (perbaikan prasyarat pengujian Tahap 6).
  - `docs/qa/06-preview-results.md` (laporan hasil pengujian 100% lolos).
- **Kode Produksi:** Seluruh file pada `js/`, `css/`, `admin.html`, dan file aplikasi lainnya **100% tidak diubah**.

---

> [!IMPORTANT]
> **Status: SELESAI & STOP.**  
> Seluruh 4 skenario pengujian pada Tahap 6 berhasil lolos validasi penuh. Sesuai batasan instruksi, eksekusi dihentikan di sini (**STOP**), tidak ada commit ke git, dan tidak melanjutkan ke Tahap 7.
