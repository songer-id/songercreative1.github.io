const fs = require('fs');
let prd = fs.readFileSync('docs/PRD_MASTER.md', 'utf8');

const target = "- Perpindahan tab `Pratinjau`/`Desain Kartu`, tutup/buka drawer, atau rerender formulir tidak menimpa snapshot awal.";
if (!prd.includes(target)) {
  console.error('Target not found');
  process.exit(1);
}

const addition = `
        - **Penyempurnaan Penetrasi Warna Latar Preview Step 1 (\`SC-ADMIN-PREVIEW-BACKGROUND-04-R1\`)**:
          - **Penerapan Luas ke Seluruh Area Konten Preview**: Warna Body tema toko aktif (\`getThemeBodyColor()\`) diterapkan langsung pada elemen kontainer scrollable body (\`#desktop-preview-body\` pada desktop dan \`#mobile-preview-body\` pada mobile bottom sheet) serta kontainer luar sidebar/drawer (\`#desktop-preview-sidebar\` dan \`#mobile-preview-sheet\`), mengatasi masalah implementasi sebelumnya di mana pewarnaan hanya terbatas pada wrapper selebar kartu (\`max-w-[260px]\`) sehingga terhalang/tertutup seluruhnya oleh kartu produk.
          - **Transparansi Wrapper Selebar Kartu**: Latar belakang inline pada \`#preview-card-outer-wrapper\` dan \`#preview-card-outer-wrapper-mob\` dikosongkan/ditransparansikan sehingga mewarisi langsung warna latar kanvas body tanpa menimbulkan kotak/border ganda.
          - **Pertahankan Latar Internal Kartu**: Desain internal kartu produk (\`cfg.bg_color\`) tetap putih murni (\`#ffffff\`) sesuai konfigurasi seller, berkontras jelas terhadap latar kanvas toko yang dinamis.
          - **Isolasi Penuh Step 2**: Saat berpindah ke Step 2 (Mini PDP), seluruh penimpaan warna latar inline (\`style.backgroundColor = ''\`) dibersihkan kembali ke nilai default stylesheet (\`bg-white\`), mempertahankan area mockup detail produk tetap putih bersih tanpa modifikasi.
          - **Preservasi Fungsionalitas Penuh**: Tab Pratinjau/Desain Kartu, tombol Batal/Simpan, rollback snapshot, validasi, dan sinkronisasi realtime preview kartu berfungsi normal 100%.`;

prd = prd.replace(target, target + addition);
fs.writeFileSync('docs/PRD_MASTER.md', prd, 'utf8');
console.log('Successfully updated docs/PRD_MASTER.md');
