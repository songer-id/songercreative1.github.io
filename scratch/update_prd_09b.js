const fs = require('fs');
let content = fs.readFileSync('docs/PRD_MASTER.md', 'utf8');
const isCrlf = content.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

const target = `        - *Status Verifikasi*: Pengujian sintaks JavaScript (\`node --check\`), unit test logic (\`scratch/test_card_editor_09a_r1.js\`), dan runtime simulation mock (\`scratch/test_runtime_09a_r1.js\`) lulus 100% PASS. Hasil visual akhir dicatat berstatus menunggu pemeriksaan visual pengguna (*pending user visual inspection*).`.replace(/\n/g, eol);

const addition = `        - *Status Verifikasi*: Pengujian sintaks JavaScript (\`node --check\`), unit test logic (\`scratch/test_card_editor_09a_r1.js\`), dan runtime simulation mock (\`scratch/test_runtime_09a_r1.js\`) lulus 100% PASS. Hasil visual akhir dicatat berstatus menunggu pemeriksaan visual pengguna (*pending user visual inspection*).
      - **Pengaturan Bingkai Kartu Produk (Ketebalan Garis Tepi & Radius Sudut) (\`SC-ADMIN-CARD-FRAME-09B\`)**:
        - **Cakupan & Fokus**: Admin → Tambah/Edit Produk → Step 1 → Tab Desain Kartu → Kelompok Bingkai Kartu pada desktop, tablet, dan drawer mobile, serta sinkronisasi renderer kartu etalase pembeli (\`js/buyer-store.js\`).
        - **Ketebalan Garis Tepi (Border Width)**:
          - Menambahkan slider rentang 0–3 px (step 1) dengan label nilai aktif dinamis (\`\${val} px\`) dan tombol pilihan cepat (*quick preset buttons*) 0 px, 1 px, 2 px, dan 3 px pada desktop dan mobile.
          - Penanganan nilai 0: Benar-benar menghilangkan border melalui \`border: none; border-width: 0px;\` secara presisi tanpa tertimpa fallback CSS atau class bawaan.
          - Menegakkan \`box-sizing: border-box;\` pada kontainer kartu produk sehingga perubahan ketebalan border tidak menambah dimensi luar kartu ataupun menyebabkan overflow layout.
        - **Radius Sudut Kartu (Border Radius)**:
          - Mengganti dropdown lama menjadi slider rentang 0–24 px (step 1) dengan label nilai aktif (\`\${val} px\`) dan pilihan cepat 0 px (Kotak), 8 px (Kecil), 16 px (Sedang), dan 24 px (Besar).
          - Sinkronisasi penuh dua arah antara slider, tombol pilihan cepat, label nilai, dan live reactive preview kartu produk.
          - Penyelarasan sudut atas foto produk: Menggunakan \`border-top-left-radius: inherit; border-top-right-radius: inherit;\` pada kontainer foto produk dan elemen \`<img>\`, serta menghapus utility class radius kaku (\`rounded-2xl\`, \`rounded-t-lg\`, \`rounded-t-2xl\`) agar foto terpotong rapi mengikuti radius kartu tanpa celah atau benturan. Sudut countdown dan elemen lainnya tetap terjaga tanpa modifikasi.
        - **Default Tema, Model Aktif & Kompatibilitas Data**:
          - Sumber nilai default kartu aktif mengikuti model terpilih: Model A (\`#e2e8f0\`), Model B (\`#e9d5ff\`), Model C (\`#fed7aa\`), warna latar \`#ffffff\`, ketebalan border 1px, dan radius 16px.
          - Kartu yang belum dikustomisasi (\`use_default_card_design: true\`) secara otomatis mengikuti default model/tema aktif.
          - Membuka editor atau berpindah accordion tidak mengubah status kartu menjadi kustom. Mengubah radius atau ketebalan border mempertahankan warna yang sudah dipilih pengguna tanpa ter-reset ke default.
          - Kompatibilitas basis data: Konfigurasi lama tanpa atribut \`border_width\` tetap menampilkan border 1px. Validasi batas 0–3 px untuk border width dan 0–24 px untuk border radius diterapkan pada pembacaan, penyimpanan, dan rendering.
        - **Integrasi Etalase Pembeli (\`js/buyer-store.js\`)**:
          - Memperbarui renderer kartu \`renderCardVariantA\`, \`renderCardVariantB\`, dan \`renderCardVariantC\` agar mengonsumsi \`border_width\` dan \`border_radius\` secara identik dengan tampilan admin.
          - Menjamin tidak ada perubahan pada Mini PDP, kalkulasi harga, transaksi, stok, maupun alur checkout pembeli.
        - *Status Verifikasi*: Pengujian sintaks JavaScript (\`node --check\`), assert rule unit test (\`scratch/test_card_frame_09b.js\`), dan runtime simulation test (\`scratch/test_runtime_frame_09b.js\`) lulus 100% PASS. Hasil visual akhir dicatat berstatus menunggu pemeriksaan visual pengguna (*pending user visual inspection*).`.replace(/\n/g, eol);

if (!content.includes(target)) {
  console.error('Target not found in PRD_MASTER.md');
  process.exit(1);
}

content = content.replace(target, addition);
fs.writeFileSync('docs/PRD_MASTER.md', content, 'utf8');
console.log('PRD_MASTER.md updated successfully');

