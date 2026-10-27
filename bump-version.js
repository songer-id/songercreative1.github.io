/**
 * ==============================================================================
 * BUMP-VERSION.JS — Otomatisasi Global Cache Busting & Penyeragaman Versi Aset
 * POS & E-Commerce Percetakan Terpadu - Songer Creative
 * ==============================================================================
 * 
 * Penggunaan:
 *   node bump-version.js            -> Memakai timestamp WIB (UTC+7): YYYYMMDDHHmm
 *   node bump-version.js <custom>   -> Memakai versi kustom (misal: 202610280015 atau 8.2)
 * 
 * Fitur:
 *   1. Menghitung timestamp WIB (UTC+7) secara presisi dengan format YYYYMMDDHHmm.
 *   2. Membaca seluruh file .html di root proyek serta subdirektori aktif.
 *   3. Menyeragamkan seluruh query string .css?v=... dan .js?v=... secara serentak.
 *   4. Menampilkan laporan log rapi di terminal konsol.
 */

const fs = require('fs');
const path = require('path');

// 1. Fungsi penentu versi baru (Timestamp WIB UTC+7 atau argumen kustom)
function resolveTargetVersion() {
  const customArg = process.argv[2];
  if (customArg && customArg.trim()) {
    return customArg.trim();
  }

  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wibDate = new Date(utcMs + (7 * 3600000));

  const yyyy = wibDate.getFullYear();
  const mm = String(wibDate.getMonth() + 1).padStart(2, '0');
  const dd = String(wibDate.getDate()).padStart(2, '0');
  const hh = String(wibDate.getHours()).padStart(2, '0');
  const min = String(wibDate.getMinutes()).padStart(2, '0');

  return `${yyyy}${mm}${dd}${hh}${min}`;
}

// 2. Fungsi pengumpul seluruh file HTML proyek
function collectTargetHtmlFiles() {
  const baseDir = __dirname;
  const files = [];

  // Ambil semua file .html di root proyek
  if (fs.existsSync(baseDir)) {
    const rootEntries = fs.readdirSync(baseDir);
    rootEntries.forEach(entry => {
      const fullPath = path.join(baseDir, entry);
      if (entry.toLowerCase().endsWith('.html') && fs.statSync(fullPath).isFile()) {
        files.push(entry);
      }
    });
  }

  // Tambahkan file HTML di subfolder aktif jika tersedia
  const candidateSubFiles = [
    path.join('superadmin', 'superadmin.html'),
    'pdp.html'
  ];

  candidateSubFiles.forEach(subFile => {
    const fullPath = path.join(baseDir, subFile);
    if (fs.existsSync(fullPath) && !files.includes(subFile)) {
      files.push(subFile);
    }
  });

  return files;
}

// 3. Eksekusi penyeragaman versi query string
function runBumpVersion() {
  const version = resolveTargetVersion();
  const htmlFiles = collectTargetHtmlFiles();

  console.log('\n' + '='.repeat(66));
  console.log(` 🚀 BUMP-VERSION: Global Cache Busting Automator (Songer Creative)`);
  console.log(` 🏷️  Target Versi : ?v=${version}`);
  console.log('='.repeat(66));

  const versionRegex = /(\.(?:css|js)\?v=)[0-9a-zA-Z._-]+/g;
  let totalFilesUpdated = 0;
  let totalAssetsUpdated = 0;

  htmlFiles.forEach(relativeFilePath => {
    const fullPath = path.join(__dirname, relativeFilePath);
    if (!fs.existsSync(fullPath)) return;

    const originalContent = fs.readFileSync(fullPath, 'utf8');
    const matches = originalContent.match(versionRegex) || [];

    if (matches.length === 0) {
      console.log(` [-] ${relativeFilePath.padEnd(28)} : (Tidak ada aset dengan query ?v=...)`);
      return;
    }

    const updatedContent = originalContent.replace(versionRegex, `$1${version}`);
    fs.writeFileSync(fullPath, updatedContent, 'utf8');

    totalFilesUpdated++;
    totalAssetsUpdated += matches.length;

    console.log(` [✓] ${relativeFilePath.padEnd(28)} : ${matches.length.toString().padStart(2, ' ')} aset diseragamkan -> ?v=${version}`);
  });

  console.log('='.repeat(66));
  console.log(` ✨ Selesai! ${totalFilesUpdated} file HTML diperbarui (${totalAssetsUpdated} aset seragam ke v=${version}).`);
  console.log('='.repeat(66) + '\n');
}

// Jalankan script
runBumpVersion();
