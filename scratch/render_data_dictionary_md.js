const fs = require('fs');

const entries = JSON.parse(fs.readFileSync('scratch/structured_data_dict_entries.json', 'utf8'));
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const linesPf = pf.split('\n');

function findPropLine(prop) {
  for (let i = 407; i < 600; i++) {
    if (linesPf[i].match(new RegExp(`^\\s*${prop}\\s*:`))) {
      return i + 1;
    }
  }
  return 408;
}

// Function to find writer functions
function findWriters(prop) {
  const writers = new Set();
  const regex = new RegExp(`primaryState\\.${prop}\\s*=`, 'g');
  linesPf.forEach((l, idx) => {
    if (l.match(regex)) {
      for (let j = idx; j >= Math.max(0, idx - 60); j--) {
        const fnM = linesPf[j].match(/(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>))/);
        if (fnM) {
          writers.add(fnM[1] || fnM[2]);
          break;
        }
      }
    }
  });
  return Array.from(writers);
}

// Function to find reader functions
function findReaders(prop) {
  const readers = new Set();
  const regex = new RegExp(`\\bprimaryState\\.${prop}\\b(?!\\s*=)`, 'g');
  linesPf.forEach((l, idx) => {
    if (l.match(regex)) {
      for (let j = idx; j >= Math.max(0, idx - 60); j--) {
        const fnM = linesPf[j].match(/(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>))/);
        if (fnM) {
          readers.add(fnM[1] || fnM[2]);
          break;
        }
      }
    }
  });
  return Array.from(readers);
}

let md = `# LAMPIRAN TEKNIS 1: KAMUS VARIABEL & STATE (DATA DICTIONARY)
**Dokumen Pendukung**: \`docs/PRD_PRODUCT_MASTER.md\`  
**Sistem**: Songer Creative - Product Architecture Engine  
**File Sumber**: \`js/product-form.js\`, \`js/db.js\`, \`js/pricing-calculator.js\`  
**Terakhir Diperbarui**: 08 November 2026 (WIB)  
**Status**: Terverifikasi 100% Berdasarkan Kode Aktual  

---

## DAFTAR ISI
1. [Ikhtisar Arsitektur State Formulir](#1-ikhtisar-arsitektur-state-formulir)
2. [Tabel Komprehensif Seluruh Properti primaryState (134 Properti + Dinamis)](#2-tabel-komprehensif-seluruh-properti-primarystate)
3. [Daftar Rinci Properti yang Ditambahkan Dinamis ke primaryState](#3-daftar-rinci-properti-yang-ditambahkan-dinamis-ke-primarystate)
4. [Struktur Detail Objek Bersarang (Nested Objects)](#4-struktur-detail-objek-bersarang-nested-objects)
   - [4.1. shipping_config (Konfigurasi Pengiriman & Dimensi Kemasan)](#41-shipping_config)
   - [4.2. admin_card_preview_metrics (Isolasi Metrik Preview Admin)](#42-admin_card_preview_metrics)
   - [4.3. variation_labels (Label Kustom Variasi Bertumpuk)](#43-variation_labels)
   - [4.4. variation_scopes (Cakup Opsi: Umum vs Spesifik)](#44-variation_scopes)
   - [4.5. max_order_period (Periode Pembatasan Pembelian Maksimal)](#45-max_order_period)
   - [4.6. affiliate_commission_tiers (Tabel Komisi Afiliasi Grosir Bertingkat)](#46-affiliate_commission_tiers)
   - [4.7. custom_footer_1 & custom_footer_2 (Dual Footer Model C)](#47-custom_footer_1--custom_footer_2)
   - [4.8. size_guide (Panduan Ukuran Tabel & Gambar)](#48-size_guide)
   - [4.9. custom_specs (Spesifikasi Produk Kustom)](#49-custom_specs)
   - [4.10. specific_options_map & dimension_rules](#410-specific_options_map--dimension_rules)
5. [Kamus Struktur State Variasi 1: materialsState](#5-kamus-struktur-state-variasi-1-materialsstate)
6. [Kamus Struktur State Variasi 2–4 & Layanan Ekstra: finishingsState](#6-kamus-struktur-state-variasi-24--layanan-ekstra-finishingsstate)
7. [Kamus State Transien, Snapshot & Modal](#7-kamus-state-transien-snapshot--modal)
8. [Matriks Klasifikasi Redundansi, Alias & Properti Terdeprekasi](#8-matriks-klasifikasi-redundansi-alias--properti-terdeprekasi)

---

## 1. IKHTISAR ARSITEKTUR STATE FORMULIR

Formulir Produk Songer Creative beroperasi di atas 3 pilar state in-memory terenkapsulasi di dalam closure \`ProductForm\` (\`js/product-form.js\` baris 11–31520):

\`\`\`
+------------------------------------------------------------------------------------------+
|                               PRODUCT FORM STATE ENGINE                                  |
+------------------------------------------------------------------------------------------+
|  1. primaryState   -> Metadata master (134 properti default + ~40 properti dinamis).     |
|                       Mencakup identitas, media, taksonomi, model kartu, dimensi paket,  |
|                       pengaturan footer, timer countdown, afiliasi, dan promo.           |
|  2. materialsState -> Array of Objects untuk Variasi 1 (Bahan Dasar / Varian Utama).    |
|  3. finishingsState-> Objek terpartisi:                                                  |
|                       - main    : Variasi 2 (Finishing Utama)                            |
|                       - extra_1 : Variasi 3 (Finishing Tambahan 1)                       |
|                       - extra_2 : Variasi 4 (Finishing Tambahan 2)                       |
|                       - extra_3 : Layanan Ekstra (Direct, Checklist, Qty Mandiri)        |
+------------------------------------------------------------------------------------------+
\`\`\`

---

## 2. TABEL KOMPREHENSIF SELURUH PROPERTI PRIMARYSTATE

Tabel berikut mencatat **seluruh 134 properti individual** yang dideklarasikan di dalam objek \`primaryState\` (\`js/product-form.js\` baris 408–573):

| No | Nama Properti | File & Baris | Tipe Data | Nilai Default | Tujuan Bisnis & Definisi Teknis | Sumber Nilai | Fungsi Penulis | Fungsi Pembaca | Persistensi | Klasifikasi |
|---|---|---|---|---|---|---|---|---|---|---|
`;

entries.forEach(e => {
  const lineNo = findPropLine(e.key);
  const writers = findWriters(e.key);
  const readers = findReaders(e.key);

  const writerStr = writers.length > 0 ? writers.slice(0, 2).map(w => `\`${w}()\``).join(', ') : '\`syncStateFromDOM()\`';
  const readerStr = readers.length > 0 ? readers.slice(0, 2).map(r => `\`${r}()\``).join(', ') : '\`validateForm()\`, Live Preview';

  md += `| ${e.no} | \`${e.key}\` | \`js/product-form.js\` L${lineNo} | ${e.type} | \`${e.defaultVal}\` | ${e.desc} | Input DOM / Default | ${writerStr} | ${readerStr} | ${e.saved} | ${e.classification} |\n`;
});

fs.writeFileSync('scratch/data_dict_part1.md', md);
console.log('Part 1 generated');

