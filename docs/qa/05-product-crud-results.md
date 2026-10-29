# LAPORAN HASIL PENGUJIAN TAHAP 5/9: E2E PRODUCT CREATE, SAVE & EDIT

**Proyek:** Songer Creative SaaS  
**Root Proyek:** `D:\pos-songer-creative\`  
**Test Suite:** `tests/product-crud.spec.js`  
**Waktu Eksekusi:** 30 Oktober 2026  
**Status Akhir:** **100% PASS (4/4 Lolos)**

---

## 1. Ringkasan Eksekusi Pengujian

Pengujian Tahap 5 memvalidasi seluruh alur dasar siklus hidup Formulir Produk (*Product Form CRUD*) menggunakan simulasi interaksi pengguna riil melalui browser Chromium headless (Playwright) tanpa membypass fungsi validasi atau memodifikasi kode logika bisnis aplikasi.

| No | Skenario Uji Wajib | Status | Durasi | Deskripsi Verifikasi |
|---|---|---|---|---|
| 1 | **Tambah Produk Tunggal** | **PASS** | 12.2s | Login akun uji, navigasi via sidebar akordeon Toko, input lengkap data wajib Step 1 & Step 2, simpan, dan verifikasi data tersimpan di `localStorage` database tenant. |
| 2 | **Buka dan Edit Produk** | **PASS** | 10.0s | Buka form edit untuk produk tunggal yang telah ada, verifikasi nilai awal tersimpan (Harga: Rp45.000, Stok: 50), ubah menjadi Harga: Rp55.000 & Stok: 120, simpan ulang, dan verifikasi perubahan bertahan baik di DB maupun UI reload. |
| 3 | **Produk dengan Variasi** | **PASS** | 21.9s | Aktivasi mode variasi, buat 2 opsi Variasi 1 ('Hitam Solid' & 'Putih Bersih') lengkap dengan harga, HPP, stok, simpan, buka kembali form edit, dan verifikasi seluruh opsi tetap utuh. |
| 4 | **Validasi Sebelum Simpan** | **PASS** | 26.3s | Validasi Step 1 (nama kosong ditolak), perbaikan input nama, lanjut ke Step 2, penolakan saat harga jual kosong (border merah & error banner terisi), konfirmasi data belum tersimpan di DB, perbaikan harga, simpan kembali hingga sukses tersimpan di DB. |

---

## 2. Detail Hasil per Skenario

### 2.1 Skenario 1: Tambah Produk Tunggal (*Single Product*)
- **Tujuan:** Memvalidasi alur dari pengguna belum terotentikasi, melakukan login ke tenant uji (`songer-test-store`), membuka form tambah produk, mengisi seluruh kolom wajib (Jenis Fisik, Kartu Klasik, Gambar, Nama, Kategori, Harga Jual Rp85.000, HPP Rp45.000, Stok 75, Maksimal Order 100, Berat 250gr, Kurir Ambil di Toko, Deskripsi), dan menekan "Simpan Produk".
- **Observasi Runtime:**
  - Sidebar Toko berbentuk akordeon (`#submenu-toko`) tertutup secara default; tombol `#admin-nav-group-toko-btn` harus diekspansi sebelum menu Tambah Produk (`#admin-nav-add-product`) dapat diklik.
  - Form menerapkan transisi bertahap (*wizard*): Step 1 (`#step-pane-1`) mewajibkan nama minimal 5 karakter, jenis produk, kartu model, dan gambar sebelum tombol "Lanjutkan" mengizinkan akses ke Step 2 (`#step-pane-2`).
  - Produk berhasil tersimpan dengan `id` deterministik yang terisolasi pada `tenant-test-e2e`.
- **Hasil:** `PASS` (Data produk ditemukan di `DB.getProducts(tenantId)` dengan nilai yang persis sesuai input).

### 2.2 Skenario 2: Buka dan Edit Produk (*Edit & Update Persistence*)
- **Tujuan:** Memvalidasi pemuatan kembali (*hydration*) data produk tunggal ke dalam formulir, pengubahan atribut konfigurasi, dan persistensi perubahan setelah penyimpanan ulang.
- **Observasi Runtime:**
  - Nilai awal berhasil termuat ke input form: `#input-single-price` bernilai `"45000"`, `#input-stock-qty` bernilai `"50"`.
  - Dilakukan pengubahan nilai harga jual menjadi `"55000"` dan stok menjadi `"120"`.
  - Tombol simpan `#btn-submit-product` ditekan.
  - Verifikasi database menunjukkan pembaruan berhasil disimpan: `price = 55000` dan `stock = 120`.
  - Navigasi ulang form edit memverifikasi bahwa antarmuka membaca kembali nilai yang telah diperbarui.
- **Hasil:** `PASS`.

### 2.3 Skenario 3: Produk dengan Variasi (*Variant Creation & Re-hydration*)
- **Tujuan:** Memvalidasi alur aktivasi variasi multi-opsi, penyimpanan struktur relasi bahan/opsi ke database (`materials`), serta rekonstruksi tabel saat form dibuka kembali.
- **Observasi Runtime:**
  - Penekanan `#btn-enable-variants` menyembunyikan konfigurasi harga tunggal (`#single-product-purchase-settings`) dan mengaktifkan tabel variasi bertumpuk (`#card-variasi-1`).
  - Label variasi `#input-var-label-tier1` diisi `"Warna"`.
  - Opsi 1 diisi: Nama `"Hitam Solid"`, Harga `65000`, HPP `35000`, Stok `50`.
  - Opsi 2 diisi: Nama `"Putih Bersih"`, Harga `68000`, HPP `36000`, Stok `40`.
  - Setelah penyimpanan, produk tercatat memiliki properti `has_variants: true` dan 2 entri relasi `materials`.
  - Pembukaan form edit memverifikasi kedua baris opsi variasi beserta harga dan stoknya termuat kembali secara akurat.
- **Hasil:** `PASS`.

### 2.4 Skenario 4: Validasi Sebelum Simpan (*Rejection & Recovery*)
- **Tujuan:** Memvalidasi bahwa data tidak valid/kosong ditolak di Step 1 maupun Step 2 dengan pesan error yang tepat, mencegah penyimpanan dini ke DB, serta mengizinkan proses simpan berlanjut ketika input diperbaiki.
- **Observasi Runtime:**
  - **Fase 1 (Step 1):** Nama produk dikosongkan. Klik "Lanjutkan" ditolak dan menampilkan peringatan `#name-min-length-error`. Pengguna tertahan di Step 1.
  - **Fase 2 (Perbaikan Step 1):** Nama produk diisi `"Banner Spanduk Pameran Seni 3x1M"`. Klik "Lanjutkan" berhasil membuka Step 2.
  - **Fase 3 (Step 2):** Harga jual dikosongkan (`#input-single-price = ""`). Klik "Simpan Produk" ditolak.
    - Input `#input-single-price` ditandai dengan kelas penegasan visual `border-red-500`.
    - Daftar kesalahan form (`#form-error-list`) mencatat entri `"Harga Jual"`.
    - Pemeriksaan database memastikan produk `"Banner Spanduk Pameran Seni 3x1M"` **belum tersimpan** (`undefined`).
  - **Fase 4 (Pemulihan & Simpan):** Harga jual diperbaiki menjadi `45000`. Klik "Simpan Produk" berhasil menyimpan data ke DB dengan harga `45000` dan stok `30`.
- **Hasil:** `PASS`.

---

## 3. Temuan Arsitektural & Analisis Teknis (Catatan untuk Audit Perbaikan)

1. **Mekanisme Persistensi Asinkron (`setTimeout 400ms`):**
   - Pada `js/product-form.js:24124`, penyimpanan produk (`DB.createProduct` / `DB.updateProduct`) dibungkus dalam `setTimeout(..., 400)` untuk memberikan jeda animasi spinner tombol simpan.
   - *Rekomendasi:* Operasi asynchronous ini telah disinkronkan pada pengujian dengan `expect.poll` Playwright.

2. **Validasi Ketergantungan Kurir Pengiriman pada Produk Fisik:**
   - Ketika `product_type === 'physical'`, formulir mewajibkan minimal satu opsi kurir/ekspedisi dicentang (`input[name="courier_checkbox"]`).
   - Pada pembuatan produk baru, kotak centang kurir tidak memiliki centang default, sehingga pengguna wajib memilih kurir (misal: "Ambil di Toko") agar form tidak diblokir oleh pesan `"Pilih minimal 1 kurir pengiriman saat pengiriman aktif."`.

3. **Kolisi DOM ID `#form-error-banner` (Step 1 vs Step 2):**
   - Terdapat fungsi `renderFormErrorBannerHtml()` yang dipanggil di dua tempat: pada kontainer Step 1 (`#step-pane-1`, line 2142) dan kontainer Step 2 (`#step2-cards-container`, line 9824).
   - Kedua elemen memiliki `id="form-error-banner"`.
   - Pada saat submit form gagal di Step 2, `handleFormSubmit()` memanggil `document.getElementById('form-error-banner')`. Karena `document.getElementById` selalu mengembalikan elemen pertama dalam urutan pohon DOM, banner di Step 1 (yang berada di dalam kontainer tersembunyi `#step-pane-1.hidden`) yang dihapus kelas `hidden`-nya, sementara banner di Step 2 tetap tersembunyi.
   - *Catatan Audit:* Meskipun banner utama di Step 2 tidak tampil karena kolisi ini, validasi penolakan tetap bekerja sempurna (submit diblokir, input harga mendapat penanda visual `border-red-500`, dan teks inline error muncul). Ini adalah temuan bug arsitektur DOM yang siap dilaporkan/diperbaiki pada fase perbaikan form.
