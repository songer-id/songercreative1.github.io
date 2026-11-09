const fs = require('fs');

const path = 'docs/PRD_MASTER.md';
let content = fs.readFileSync(path, 'utf8');

const target = `        - **Pembersihan Sekitar Pratinjau**: Menghapus border putus-putus (\`border-dashed\`) dan kotak abu-abu di sekeliling kontainer kartu pratinjau desktop, menjaga tampilan bersih datar tanpa kotak dekoratif bersarang.
        - *Status Verifikasi*: Pengujian sintaks dan logika event/render lulus pengujian Node.js terarah (100% PASS). Verifikasi visual rendering/scrolling langsung di perangkat/browser dicatat sebagai status tertunda menunggu tinjauan visual pemilik (*pending owner visual inspection*).`;

const replacement = `        - **Pembersihan Sekitar Pratinjau**: Menghapus border putus-putus (\`border-dashed\`) dan kotak abu-abu di sekeliling kontainer kartu pratinjau desktop, menjaga tampilan bersih datar tanpa kotak dekoratif bersarang.
        - **Pembeda Visual Kartu Produk Step 1 (\`SC-ADMIN-PREVIEW-LAYOUT-03-R1\`)**:
          - Memberikan pembungkus area kartu (\`#preview-card-outer-wrapper\` desktop dan \`#preview-card-outer-wrapper-mob\` mobile) dengan latar abu-abu netral sangat muda token proyek (\`bg-slate-100/70\`) dan sudut membulat halus (\`rounded-xl\`).
          - Menerapkan padding 12px (\`p-3\`) dan lebar maksimum outer wrapper \`max-w-[284px]\` di sekeliling kontainer kartu (\`max-w-[260px]\`), sehingga keempat tepi kartu produk putih terlihat kontras dan tegas terhadap latar drawer/sidebar tanpa mempersempit dimensi kartu asli.
          - Berlaku konsisten di Step 1 pada tab \`[Pratinjau]\` maupun tab \`[Desain Kartu]\`, baik pada sidebar desktop maupun drawer mobile.
          - Terisolasi hanya di belakang kartu: header, checkbox simulasi diskon, dan panel editor tidak menerima latar abu-abu tersebut.
          - Terisolasi dari Step 2: Pada Step 2 (Mini PDP), kelas latar dan padding otomatis dilepas (reset ke \`max-w-[260px]\`) sehingga layout Mini PDP tetap utuh tanpa modifikasi.
        - *Status Verifikasi*: Pengujian sintaks dan logika event/render lulus pengujian Node.js terarah (100% PASS). Verifikasi visual rendering/scrolling langsung di perangkat/browser dicatat sebagai status tertunda menunggu tinjauan visual pemilik (*pending owner visual inspection*).`;

function safeReplace(str, search, replace) {
  const normStr = str.replace(/\r\n/g, '\n');
  const normSearch = search.replace(/\r\n/g, '\n');
  const normReplace = replace.replace(/\r\n/g, '\n');

  if (!normStr.includes(normSearch)) {
    throw new Error('Target not found in docs/PRD_MASTER.md');
  }

  const isCRLF = str.includes('\r\n');
  const result = normStr.replace(normSearch, normReplace);
  return isCRLF ? result.replace(/\n/g, '\r\n') : result;
}

try {
  content = safeReplace(content, target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('[SUCCESS] docs/PRD_MASTER.md updated with SC-ADMIN-PREVIEW-LAYOUT-03-R1 details.');
} catch (e) {
  console.error('[ERROR]', e.message);
  process.exit(1);
}

