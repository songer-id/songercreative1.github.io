const fs = require('fs');

let db = fs.readFileSync('js/db.js', 'utf8');

// 1. In DEFAULT_CARD_VARIANTS_CONFIG.variant_c: footer_2_bg_color should be '#f59e0b'
db = db.replace(
  /footer_2_bg_color:\s*'#047857',/,
  "footer_2_bg_color: '#f59e0b',"
);
console.log('1. DEFAULT_CARD_VARIANTS_CONFIG.variant_c footer_2_bg_color updated to #f59e0b');

// 2. In saveCardModelPreset: delete footer texts & metric sources from preset
const oldSavePreset = `    saveCardModelPreset(variantCode, config) {
      if (!variantCode || !config) return;
      const key = variantCode === 'A' ? 'variant_a' : (variantCode === 'B' ? 'variant_b' : 'variant_c');
      const sets = this.getSettings();
      if (!sets.card_variants_config) sets.card_variants_config = {};
      sets.card_variants_config[key] = {
        ...(sets.card_variants_config[key] || {}),
        ...config
      };
      this.saveSettings(sets);
      return sets.card_variants_config[key];
    },`;

const newSavePreset = `    saveCardModelPreset(variantCode, config) {
      if (!variantCode || !config) return;
      const key = variantCode === 'A' ? 'variant_a' : (variantCode === 'B' ? 'variant_b' : 'variant_c');
      const sets = this.getSettings();
      if (!sets.card_variants_config) sets.card_variants_config = {};

      // Pisahkan konten produk dan metrik manual dari preset visual tema
      const cleanConfig = { ...config };
      delete cleanConfig.card_footer_text;
      delete cleanConfig.card_footer_2_text;
      delete cleanConfig.footer_text;
      delete cleanConfig.footer_2_text;
      delete cleanConfig.admin_card_preview_metrics;
      delete cleanConfig.rating_source;
      delete cleanConfig.sales_source;
      delete cleanConfig.manual_rating;
      delete cleanConfig.manual_sales;

      sets.card_variants_config[key] = {
        ...(sets.card_variants_config[key] || {}),
        ...cleanConfig
      };
      this.saveSettings(sets);
      return sets.card_variants_config[key];
    },`;

if (db.includes(oldSavePreset)) {
  db = db.replace(oldSavePreset, newSavePreset);
  console.log('2. saveCardModelPreset updated with content stripping!');
} else {
  // Try CRLF / LF matching
  const normDb = db.replace(/\r\n/g, '\n');
  const normOld = oldSavePreset.replace(/\r\n/g, '\n');
  if (normDb.includes(normOld)) {
    const idx = normDb.indexOf(normOld);
    const before = db.slice(0, idx);
    const after = db.slice(idx + normOld.length);
    db = before + newSavePreset + after;
    console.log('2. saveCardModelPreset updated with content stripping (CRLF normalized)!');
  } else {
    console.error('ERROR: oldSavePreset not found in js/db.js!');
    process.exit(1);
  }
}

// 3. Update getFooterTextsHistory and saveFooterTextToHistory in both locations
const historyImpl = `    getFooterTextsHistory() {
      const history = getTable(STORAGE_KEYS.FOOTER_TEXTS_HISTORY) || [];
      const products = getTable(STORAGE_KEYS.PRODUCTS) || [];
      const fromProds = [];
      const placeholders = [
        'tersedia berbagai variasi',
        'pengiriman cepat',
        'proses hanya dalam 1jam',
        'proses hanya dalam 1 jam',
        'variasi paket tersedia/tidak tersedia'
      ];
      products.forEach(p => {
        ['card_footer_text', 'card_footer_2_text'].forEach(key => {
          const t = p && p[key];
          if (t && typeof t === 'string') {
            const trimmed = t.trim();
            if (trimmed && !placeholders.includes(trimmed.toLowerCase())) {
              fromProds.push(trimmed);
            }
          }
        });
      });
      const defaults = [
        'Proses Cepat & Garansi Presisi',
        'Siap Kirim Seluruh Indonesia',
        'Gratis Konsultasi Desain',
        'Bahan Premium Tahan Cuaca',
        'Garansi Uang Kembali Jika Cacat',
        'Pengerjaan 1 Hari Jadi',
        'Bisa Custom Ukuran & Desain'
      ];
      const combined = [...history, ...fromProds, ...defaults];
      const seen = new Set();
      const result = [];
      for (const item of combined) {
        if (!item || typeof item !== 'string') continue;
        const trimmed = item.trim();
        if (!trimmed) continue;
        const lower = trimmed.toLowerCase();
        if (placeholders.includes(lower)) continue;
        if (!seen.has(lower)) {
          seen.add(lower);
          result.push(trimmed);
        }
      }
      return result.slice(0, 30);
    },

    saveFooterTextToHistory(text) {
      if (!text || typeof text !== 'string') return;
      const val = text.trim();
      if (!val) return;
      const placeholders = [
        'tersedia berbagai variasi',
        'pengiriman cepat',
        'proses hanya dalam 1jam',
        'proses hanya dalam 1 jam',
        'variasi paket tersedia/tidak tersedia'
      ];
      if (placeholders.includes(val.toLowerCase())) return;
      const len = [...val].length;
      if (len > 32) return;
      const list = getTable(STORAGE_KEYS.FOOTER_TEXTS_HISTORY) || [];
      const existingIdx = list.findIndex(item => (typeof item === 'string' ? item : '').trim().toLowerCase() === val.toLowerCase());
      if (existingIdx !== -1) {
        list.splice(existingIdx, 1);
      }
      list.unshift(val);
      setTable(STORAGE_KEYS.FOOTER_TEXTS_HISTORY, list.slice(0, 30));
    },`;

// Replace first block around line 2045
const block1Regex = /getFooterTextsHistory\(\)\s*\{[\s\S]*?saveFooterTextToHistory\s*\([^)]*\)\s*\{[\s\S]*?\n\s*\},/;
if (block1Regex.test(db)) {
  db = db.replace(block1Regex, historyImpl.trim());
  console.log('3. First getFooterTextsHistory block replaced!');
} else {
  console.error('ERROR: block1Regex did not match!');
  process.exit(1);
}

// Replace second block around line 3107
if (block1Regex.test(db)) {
  db = db.replace(block1Regex, historyImpl.trim());
  console.log('4. Second getFooterTextsHistory block replaced!');
} else {
  console.log('Note: Only one block remained or was replaced.');
}

fs.writeFileSync('js/db.js', db);
console.log('Successfully written js/db.js!');

