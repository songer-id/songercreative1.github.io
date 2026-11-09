const fs = require('fs');
let prd = fs.readFileSync('docs/PRD_MASTER.md', 'utf8');

const target = "        - *Status Verifikasi*: Pengujian sintaks dan logika event/render lulus pengujian Node.js terarah (100% PASS). Verifikasi visual rendering/scrolling langsung di perangkat/browser dicatat sebagai status tertunda menunggu tinjauan visual pemilik (*pending owner visual inspection*).";

const addition = `        - **Pembersihan Layout & Penyelarasan Garis Pemisah Form–Preview (\`SC-ADMIN-LAYOUT-CLEANUP-05\`)**:
          - **Pembersihan Breadcrumb**: Menghapus seluruh baris breadcrumb \`#product-form-top-bar\` ("Daftar Produk / Tambah Produk Baru" beserta ikon panah kembali), padding, margin berlebih, dan garis divider \`border-b\` yang sebelumnya memotong/menabrak kanvas layout.
          - **Penyelarasan Garis Vertikal Form–Preview Desktop**: Garis pemisah vertikal form–preview desktop (\`border-l border-slate-200\` pada \`#desktop-preview-sidebar\`) kini kontinu dan menyatu utuh dari batas atas area kerja (\`top: 4rem\`, persis di bawah navbar admin) hingga batas bawah layar tanpa celah atau garis ganda.
          - **Header Preview & Divider Horizontal**: Header preview berada persis di atas body preview dengan satu divider horizontal tipis (\`border-b border-slate-200\`) yang seragam baik pada sidebar desktop maupun drawer mobile, tanpa memaksakan garis melintasi form.
          - **Kompensasi Padding Responsif**: Menyesuaikan padding atas \`#step-pane-1\` secara bersih (\`1.25rem\` pada desktop/tablet dan \`0.75rem\` pada mobile) sehingga kartu pertama form memiliki jarak yang seimbang dari batas atas workspace tanpa ruang kosong sisa breadcrumb.
          - **Preservasi Fungsionalitas Navigasi**: Tombol Batal pada form (\`#btn-step-1-cancel\`) tetap terhubung normal ke handler navigasi \`handleFormCancel()\`. Seluruh fitur preview (Body color tema, Step 2 isolation, Desain Kartu CTA) dipertahankan 100%.
        - *Status Verifikasi*: Pengujian sintaks dan logika event/render lulus pengujian Node.js terarah (100% PASS). Verifikasi visual rendering/scrolling langsung di perangkat/browser dicatat sebagai status tertunda menunggu tinjauan visual pemilik (*pending owner visual inspection*).`;

if (!prd.includes(target)) {
  console.error('Target not found in docs/PRD_MASTER.md');
  process.exit(1);
}

// Replace the last occurrence of target
const lastIndex = prd.lastIndexOf(target);
prd = prd.substring(0, lastIndex) + addition + prd.substring(lastIndex + target.length);

fs.writeFileSync('docs/PRD_MASTER.md', prd, 'utf8');
console.log('Successfully updated docs/PRD_MASTER.md');

