const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');

// 1. Add getSecondaryThemeColor() after getPrimaryThemeColor()
const getSecFn = `
  /**
   * Mengambil warna tema sekunder aktif dari settings / :root CSS (--color-secondary)
   */
  function getSecondaryThemeColor() {
    try {
      if (typeof DB !== 'undefined' && DB.getSettings) {
        const s = DB.getSettings();
        if (s && s.secondary_color) {
          syncThemeCSSVariables();
          return s.secondary_color;
        }
      }
      const rootColor = getComputedStyle(document.documentElement).getPropertyValue('--color-secondary').trim();
      if (rootColor) return rootColor;
    } catch (_) { }
    return '#f59e0b';
  }
`;

if (!pf.includes('function getSecondaryThemeColor()')) {
  const marker = 'function getPrimaryThemeColor() {';
  const markerIdx = pf.indexOf(marker);
  if (markerIdx === -1) {
    console.error('ERROR: getPrimaryThemeColor not found!');
    process.exit(1);
  }
  // Find closing brace of getPrimaryThemeColor
  let braceDepth = 0;
  let endIdx = -1;
  for (let i = markerIdx; i < pf.length; i++) {
    if (pf[i] === '{') braceDepth++;
    else if (pf[i] === '}') {
      braceDepth--;
      if (braceDepth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }
  pf = pf.slice(0, endIdx) + '\n' + getSecFn + pf.slice(endIdx);
  console.log('1. getSecondaryThemeColor() added!');
} else {
  console.log('1. getSecondaryThemeColor() already present.');
}

// 2. Add isFooterTouched and initialCardFooterText tracking
if (!pf.includes('let isFooterTouched = false;')) {
  const stateMarker = 'let materialsState = [];';
  if (pf.includes(stateMarker)) {
    pf = pf.replace(stateMarker, `let initialCardFooterText = '';\n  let isFooterTouched = false;\n  let materialsState = [];`);
    console.log('2. isFooterTouched & initialCardFooterText variables added!');
  } else {
    console.error('ERROR: materialsState not found!');
    process.exit(1);
  }
}

// 3. Update getUnicodeLength with Intl.Segmenter
const oldGetUnicode = `  function getUnicodeLength(str) {
    return str ? [...str].length : 0;
  }`;

const newGetUnicode = `  function getUnicodeLength(str) {
    if (!str) return 0;
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        return [...segmenter.segment(str)].length;
      } catch (_) { }
    }
    return [...str].length;
  }`;

if (pf.includes(oldGetUnicode)) {
  pf = pf.replace(oldGetUnicode, newGetUnicode);
  console.log('3. getUnicodeLength updated with Intl.Segmenter!');
} else {
  console.log('3. getUnicodeLength check: already updated or slight format difference');
}

// 4. Update initial primaryState footer_2_bg_color
pf = pf.replace(
  /footer_2_bg_color:\s*getPrimaryThemeColor\(\),/,
  "footer_2_bg_color: getSecondaryThemeColor(),"
);
console.log('4. Initial primaryState footer_2_bg_color updated to getSecondaryThemeColor()');

// 5. Update getLastProductFooterConfig: text is always empty string, f2 bg is secondary
const oldLastProdCfg = `          const f1 = p.custom_footer_1 ? { ...p.custom_footer_1 } : {
            text: p.card_footer_text || '',
            icon: p.footer_badge_icon || 'truck',
            bg_color: p.footer_bg_color || getPrimaryThemeColor(),
            text_color: p.footer_text_color || '#ffffff'
          };
          const f2 = p.custom_footer_2 ? { ...p.custom_footer_2 } : {
            text: p.card_footer_2_text || '',
            icon: p.footer_2_badge_icon || 'minus',
            bg_color: p.footer_2_bg_color || getPrimaryThemeColor(),
            text_color: p.footer_2_text_color || '#ffffff'
          };`;

const newLastProdCfg = `          const f1 = p.custom_footer_1 ? { ...p.custom_footer_1, text: '' } : {
            text: '',
            icon: p.footer_badge_icon || 'truck',
            bg_color: p.footer_bg_color || getPrimaryThemeColor(),
            text_color: p.footer_text_color || '#ffffff'
          };
          const f2 = p.custom_footer_2 ? { ...p.custom_footer_2, text: '' } : {
            text: '',
            icon: p.footer_2_badge_icon || 'minus',
            bg_color: p.footer_2_bg_color || getSecondaryThemeColor(),
            text_color: p.footer_2_text_color || '#ffffff'
          };`;

if (pf.includes(oldLastProdCfg)) {
  pf = pf.replace(oldLastProdCfg, newLastProdCfg);
  console.log('5. getLastProductFooterConfig updated (empty text, secondary f2 bg)!');
} else {
  // Try CRLF normalize
  const normPf = pf.replace(/\r\n/g, '\n');
  const normOld = oldLastProdCfg.replace(/\r\n/g, '\n');
  if (normPf.includes(normOld)) {
    const idx = normPf.indexOf(normOld);
    pf = pf.slice(0, idx) + newLastProdCfg + pf.slice(idx + normOld.length);
    console.log('5. getLastProductFooterConfig updated (CRLF normalized)!');
  } else {
    console.log('5. Note: oldLastProdCfg not matched directly.');
  }
}

// 6. Update getOptionsForDatalist for footer-texts-history-list
const oldDatalistFooter = `    } else if (listId === 'footer-texts-history-list') {
      const defaultFooters = [
        'Proses Hanya Dalam 1Jam',
        'Variasi Paket Tersedia/tidak tersedia',
        'Proses Cepat & Garansi Kualitas',
        'Siap Kirim Seluruh Indonesia',
        'Bahan Premium Berkualitas',
        'Garansi 100% Produk Original'
      ];
      defaultFooters.forEach(f => {
        if (!options.includes(f)) options.push(f);
      });
      if (typeof DB !== 'undefined' && typeof DB.getFooterTextsHistory === 'function') {
        try {
          const history = DB.getFooterTextsHistory();
          if (Array.isArray(history)) {
            history.forEach(h => {
              const val = (typeof h === 'string' ? h : h?.name || '').trim();
              if (val && !options.includes(val)) options.push(val);
            });
          }
        } catch (_) { }
      }
    }`;

const newDatalistFooter = `    } else if (listId === 'footer-texts-history-list') {
      if (typeof DB !== 'undefined' && typeof DB.getFooterTextsHistory === 'function') {
        try {
          const history = DB.getFooterTextsHistory();
          if (Array.isArray(history)) {
            history.forEach(h => {
              const val = (typeof h === 'string' ? h : h?.name || '').trim();
              if (val && !options.includes(val)) options.push(val);
            });
          }
        } catch (_) { }
      }
      if (!options || options.length === 0) {
        options = [
          'Proses Cepat & Garansi Presisi',
          'Siap Kirim Seluruh Indonesia',
          'Gratis Konsultasi Desain',
          'Bahan Premium Tahan Cuaca',
          'Garansi Uang Kembali Jika Cacat',
          'Pengerjaan 1 Hari Jadi',
          'Bisa Custom Ukuran & Desain'
        ];
      }
    }`;

if (pf.includes(oldDatalistFooter)) {
  pf = pf.replace(oldDatalistFooter, newDatalistFooter);
  console.log('6. getOptionsForDatalist updated for footer-texts-history-list!');
} else {
  const normPf = pf.replace(/\r\n/g, '\n');
  const normOld = oldDatalistFooter.replace(/\r\n/g, '\n');
  if (normPf.includes(normOld)) {
    const idx = normPf.indexOf(normOld);
    pf = pf.slice(0, idx) + newDatalistFooter + pf.slice(idx + normOld.length);
    console.log('6. getOptionsForDatalist updated (CRLF normalized)!');
  } else {
    console.log('6. Note: oldDatalistFooter not matched directly.');
  }
}

// 7. Update <datalist id="footer-texts-history-list"> template options
const oldDatalistMarkup = `        <!-- Native HTML5 Datalist untuk Teks Footer Model C (Persis Gambar 2) -->
        <datalist id="footer-texts-history-list">
          <option value="Proses Hanya Dalam 1Jam"></option>
          <option value="Variasi Paket Tersedia"></option>
          <option value="Garansi Kualitas 100%"></option>
          <option value="Bisa Cetak Satuan"></option>
          <option value="Kirim Cepat Hari Ini"></option>
          <option value="Desain Custom Tersedia"></option>
          <option value="Siap Pakai & Praktis"></option>
        </datalist>`;

const newDatalistMarkup = `        <!-- Native HTML5 Datalist untuk Teks Footer Model C -->
        <datalist id="footer-texts-history-list">
          <option value="Proses Cepat & Garansi Presisi"></option>
          <option value="Siap Kirim Seluruh Indonesia"></option>
          <option value="Gratis Konsultasi Desain"></option>
          <option value="Bahan Premium Tahan Cuaca"></option>
          <option value="Garansi Uang Kembali Jika Cacat"></option>
          <option value="Pengerjaan 1 Hari Jadi"></option>
          <option value="Bisa Custom Ukuran & Desain"></option>
        </datalist>`;

if (pf.includes(oldDatalistMarkup)) {
  pf = pf.replace(oldDatalistMarkup, newDatalistMarkup);
  console.log('7. datalist template markup updated!');
} else {
  const normPf = pf.replace(/\r\n/g, '\n');
  const normOld = oldDatalistMarkup.replace(/\r\n/g, '\n');
  if (normPf.includes(normOld)) {
    const idx = normPf.indexOf(normOld);
    pf = pf.slice(0, idx) + newDatalistMarkup + pf.slice(idx + normOld.length);
    console.log('7. datalist template markup updated (CRLF normalized)!');
  }
}

// 8. Add inline error divs in accordion footer bodies
// Desktop Strip 1 error
if (!pf.includes('id="error-card-footer-text-side"')) {
  const deskF1Anchor = '<input type="text" id="input-card-footer-text-side" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Tersedia berbagai Variasi" value="${escapeHtml(primaryState.card_footer_text || \'\')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />\n                        </div>';
  const deskF1Error = '\n                        <div id="error-card-footer-text-side" class="hidden text-[10px] text-red-600 font-normal mt-1 flex items-center gap-1"><i class="bi bi-exclamation-circle text-[10px]"></i><span class="error-msg">Label Footer 1 wajib diisi.</span></div>';
  if (pf.includes(deskF1Anchor)) {
    pf = pf.replace(deskF1Anchor, deskF1Anchor + deskF1Error);
    console.log('8. Desktop Strip 1 error element added!');
  }
}

// Desktop Strip 2 error
if (!pf.includes('id="error-card-footer-2-text-side"')) {
  const deskF2Anchor = '<input type="text" id="input-card-footer-2-text-side" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Pengiriman Cepat" value="${escapeHtml(primaryState.card_footer_2_text || \'\')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />\n                        </div>';
  const deskF2Error = '\n                        <div id="error-card-footer-2-text-side" class="hidden text-[10px] text-red-600 font-normal mt-1 flex items-center gap-1"><i class="bi bi-exclamation-circle text-[10px]"></i><span class="error-msg"></span></div>';
  if (pf.includes(deskF2Anchor)) {
    pf = pf.replace(deskF2Anchor, deskF2Anchor + deskF2Error);
    console.log('8. Desktop Strip 2 error element added!');
  }
}

// Mobile Strip 1 error
if (!pf.includes('id="error-card-footer-text-mob"')) {
  const mobF1Anchor = '<input type="text" id="input-card-footer-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Tersedia berbagai Variasi" value="${escapeHtml(primaryState.card_footer_text || \'\')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />\n                        </div>';
  const mobF1Error = '\n                        <div id="error-card-footer-text-mob" class="hidden text-[10px] text-red-600 font-normal mt-1 flex items-center gap-1"><i class="bi bi-exclamation-circle text-[10px]"></i><span class="error-msg">Label Footer 1 wajib diisi.</span></div>';
  if (pf.includes(mobF1Anchor)) {
    pf = pf.replace(mobF1Anchor, mobF1Anchor + mobF1Error);
    console.log('8. Mobile Strip 1 error element added!');
  }
}

// Mobile Strip 2 error
if (!pf.includes('id="error-card-footer-2-text-mob"')) {
  const mobF2Anchor = '<input type="text" id="input-card-footer-2-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Pengiriman Cepat" value="${escapeHtml(primaryState.card_footer_2_text || \'\')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />\n                        </div>';
  const mobF2Error = '\n                        <div id="error-card-footer-2-text-mob" class="hidden text-[10px] text-red-600 font-normal mt-1 flex items-center gap-1"><i class="bi bi-exclamation-circle text-[10px]"></i><span class="error-msg"></span></div>';
  if (pf.includes(mobF2Anchor)) {
    pf = pf.replace(mobF2Anchor, mobF2Anchor + mobF2Error);
    console.log('8. Mobile Strip 2 error element added!');
  }
}

// 9. Update Footer 2 background color fallback in template strings (cfg-footer-2-bg-color-side and mob)
pf = pf.replace(
  /id="cfg-footer-2-bg-color-side" value="\${primaryState\.footer_2_bg_color \|\| getPrimaryThemeColor\(\)}"/g,
  'id="cfg-footer-2-bg-color-side" value="${primaryState.footer_2_bg_color || getSecondaryThemeColor()}"'
);
pf = pf.replace(
  /id="cfg-footer-2-bg-hex-side" value="\${primaryState\.footer_2_bg_color \|\| getPrimaryThemeColor\(\)}"/g,
  'id="cfg-footer-2-bg-hex-side" value="${primaryState.footer_2_bg_color || getSecondaryThemeColor()}"'
);
pf = pf.replace(
  /id="cfg-footer-2-bg-color-mob" value="\${primaryState\.footer_2_bg_color \|\| getPrimaryThemeColor\(\)}"/g,
  'id="cfg-footer-2-bg-color-mob" value="${primaryState.footer_2_bg_color || getSecondaryThemeColor()}"'
);
pf = pf.replace(
  /id="cfg-footer-2-bg-hex-mob" value="\${primaryState\.footer_2_bg_color \|\| getPrimaryThemeColor\(\)}"/g,
  'id="cfg-footer-2-bg-hex-mob" value="${primaryState.footer_2_bg_color || getSecondaryThemeColor()}"'
);
console.log('9. Footer 2 background color inputs updated to getSecondaryThemeColor()');

// 10. Update loadCardConfigInputs: Footer 2 fallback to getSecondaryThemeColor()
pf = pf.replace(
  /const f2Bg = primaryState\.footer_2_bg_color \|\| cfg\.footer_2_bg_color \|\| defThemeColor;/,
  "const f2Bg = primaryState.footer_2_bg_color || cfg.footer_2_bg_color || getSecondaryThemeColor();"
);
console.log('10. loadCardConfigInputs updated with getSecondaryThemeColor()');

// 11. Update updateProductCardLivePreview: Footer 2 fallback to getSecondaryThemeColor()
pf = pf.replace(
  /const footer2BgColor = document\.getElementById\('cfg-footer-2-bg-color-side'\)\?\.value \|\| document\.getElementById\('cfg-footer-2-bg-color'\)\?\.value \|\| primaryState\.footer_2_bg_color \|\| defCardThemeColor;/,
  "const footer2BgColor = document.getElementById('cfg-footer-2-bg-color-side')?.value || document.getElementById('cfg-footer-2-bg-color')?.value || primaryState.footer_2_bg_color || (cfg && cfg.footer_2_bg_color) || getSecondaryThemeColor();"
);
console.log('11. updateProductCardLivePreview updated with getSecondaryThemeColor()');

// 12. Update submitForm: Footer 2 fallback to getSecondaryThemeColor()
pf = pf.replace(
  /const footer2BgVal = document\.getElementById\('cfg-footer-2-bg-color-side'\)\?\.value \|\| document\.getElementById\('cfg-footer-2-bg-color'\)\?\.value \|\| primaryState\.custom_footer_2\?\.bg_color \|\| primaryState\.footer_2_bg_color \|\| getPrimaryThemeColor\(\);/,
  "const footer2BgVal = document.getElementById('cfg-footer-2-bg-color-side')?.value || document.getElementById('cfg-footer-2-bg-color')?.value || primaryState.custom_footer_2?.bg_color || primaryState.footer_2_bg_color || getSecondaryThemeColor();"
);
console.log('12. submitForm updated with getSecondaryThemeColor()');

// 13. Update handleSaveCardDesign
const oldHandleSave = `  function handleSaveCardDesign() {
    try {
      syncStateFromDOM();
      const f1Len = getUnicodeLength(primaryState.card_footer_text);
      const f2Len = getUnicodeLength(primaryState.card_footer_2_text);
      if (primaryState.card_variant === 'C' && f1Len > 32) {
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast(\`Teks Footer 1 melebihi batas 32 karakter (\${f1Len}/32). Harap persingkat teks terlebih dahulu.\`, 'error');
        } else {
          alert(\`Teks Footer 1 melebihi batas 32 karakter (\${f1Len}/32). Harap persingkat teks terlebih dahulu.\`);
        }
        return false;
      }
      if (primaryState.card_variant === 'C' && f2Len > 32) {
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast(\`Teks Footer 2 melebihi batas 32 karakter (\${f2Len}/32). Harap persingkat teks terlebih dahulu.\`, 'error');
        } else {
          alert(\`Teks Footer 2 melebihi batas 32 karakter (\${f2Len}/32). Harap persingkat teks terlebih dahulu.\`);
        }
        return false;
      }
      saveCardConfigInputs();
      const saveDefToggle = document.getElementById('cfg-save-as-default-toggle');
      const saveDefToggleMob = document.getElementById('cfg-save-as-default-toggle-mob');
      const isSaveDefault = (saveDefToggle?.checked || saveDefToggleMob?.checked);
      if (isSaveDefault) {
        if (typeof DB !== 'undefined' && DB.saveCardModelPreset) {
          DB.saveCardModelPreset(primaryState.card_variant, primaryState.card_config);
        }
      }
      if (saveDefToggle) saveDefToggle.checked = false;
      if (saveDefToggleMob) saveDefToggleMob.checked = false;

      // Simpan berhasil -> hasil simpan menjadi nilai baseline untuk pengeditan berikutnya
      captureCardDesignSnapshot(true);

      if (typeof App !== 'undefined' && App.showToast) {
        const mLabel = primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik');
        App.showToast(\`Desain kartu \${mLabel} berhasil disimpan!\`, 'success');
      }
      updateProductCardLivePreview();
    } catch (e) {
      console.warn('Gagal menyimpan desain kartu:', e);
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('Gagal menyimpan desain kartu.', 'error');
      }
    }
  }`;

const newHandleSave = `  function handleSaveCardDesign() {
    try {
      syncStateFromDOM();
      const f1Val = (primaryState.card_footer_text || '').trim();
      const f2Val = (primaryState.card_footer_2_text || '').trim();
      const f1Len = getUnicodeLength(primaryState.card_footer_text);
      const f2Len = getUnicodeLength(primaryState.card_footer_2_text);

      if (primaryState.card_variant === 'C') {
        let hasErr = false;
        if (!f1Val) {
          ['error-card-footer-text-side', 'error-card-footer-text-mob'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
              const msgEl = el.querySelector('.error-msg') || el;
              msgEl.textContent = 'Label Footer 1 wajib diisi.';
              el.classList.remove('hidden');
            }
          });
          [document.getElementById('input-card-footer-text-side'), document.getElementById('input-card-footer-text-mob')].forEach(inp => {
            if (inp) inp.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
          });
          hasErr = true;
        } else if (f1Len > 32) {
          ['error-card-footer-text-side', 'error-card-footer-text-mob'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
              const msgEl = el.querySelector('.error-msg') || el;
              msgEl.textContent = \`Label Footer 1 melebihi batas 32 karakter (\${f1Len}/32).\`;
              el.classList.remove('hidden');
            }
          });
          [document.getElementById('input-card-footer-text-side'), document.getElementById('input-card-footer-text-mob')].forEach(inp => {
            if (inp) inp.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
          });
          hasErr = true;
        }

        if (f2Len > 32) {
          ['error-card-footer-2-text-side', 'error-card-footer-2-text-mob'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
              const msgEl = el.querySelector('.error-msg') || el;
              msgEl.textContent = \`Label Footer 2 melebihi batas 32 karakter (\${f2Len}/32).\`;
              el.classList.remove('hidden');
            }
          });
          [document.getElementById('input-card-footer-2-text-side'), document.getElementById('input-card-footer-2-text-mob')].forEach(inp => {
            if (inp) inp.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
          });
          hasErr = true;
        }

        if (hasErr) {
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('Harap periksa kesalahan input footer terlebih dahulu.', 'error');
          }
          return false;
        }
      }

      // Sembunyikan inline error jika valid
      ['error-card-footer-text-side', 'error-card-footer-text-mob', 'error-card-footer-2-text-side', 'error-card-footer-2-text-mob'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
      });
      ['input-card-footer-text-side', 'input-card-footer-text-mob', 'input-card-footer-2-text-side', 'input-card-footer-2-text-mob'].forEach(id => {
        document.getElementById(id)?.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
      });

      saveCardConfigInputs();
      const saveDefToggle = document.getElementById('cfg-save-as-default-toggle');
      const saveDefToggleMob = document.getElementById('cfg-save-as-default-toggle-mob');
      const isSaveDefault = (saveDefToggle?.checked || saveDefToggleMob?.checked);
      if (isSaveDefault) {
        if (typeof DB !== 'undefined' && DB.saveCardModelPreset) {
          DB.saveCardModelPreset(primaryState.card_variant, primaryState.card_config);
        }
      }
      if (saveDefToggle) saveDefToggle.checked = false;
      if (saveDefToggleMob) saveDefToggleMob.checked = false;

      // Simpan teks manual yang valid ke riwayat saran dropdown setelah penyimpanan berhasil
      if (primaryState.card_variant === 'C') {
        if (f1Val && typeof DB !== 'undefined' && DB.saveFooterTextToHistory) {
          DB.saveFooterTextToHistory(f1Val);
        }
        if (f2Val && typeof DB !== 'undefined' && DB.saveFooterTextToHistory) {
          DB.saveFooterTextToHistory(f2Val);
        }
      }

      isFooterTouched = true;
      // Simpan berhasil -> hasil simpan menjadi nilai baseline untuk pengeditan berikutnya
      captureCardDesignSnapshot(true);

      if (typeof App !== 'undefined' && App.showToast) {
        const mLabel = primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik');
        App.showToast(\`Desain kartu \${mLabel} berhasil disimpan!\`, 'success');
      }
      updateProductCardLivePreview();
    } catch (e) {
      console.warn('Gagal menyimpan desain kartu:', e);
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('Gagal menyimpan desain kartu.', 'error');
      }
    }
  }`;

if (pf.includes(oldHandleSave)) {
  pf = pf.replace(oldHandleSave, newHandleSave);
  console.log('13. handleSaveCardDesign updated with inline errors and history saving!');
} else {
  const normPf = pf.replace(/\r\n/g, '\n');
  const normOld = oldHandleSave.replace(/\r\n/g, '\n');
  if (normPf.includes(normOld)) {
    const idx = normPf.indexOf(normOld);
    pf = pf.slice(0, idx) + newHandleSave + pf.slice(idx + normOld.length);
    console.log('13. handleSaveCardDesign updated (CRLF normalized)!');
  } else {
    console.error('ERROR: oldHandleSave not matched!');
    process.exit(1);
  }
}

// 14. Update handleCancelCardDesign: hide inline errors and restore
const oldCancelClear = `      updateFooterCharCounter(inpF2TextSide, document.getElementById('footer-2-text-char-count-side'));
      updateFooterCharCounter(inpF2TextMob, document.getElementById('footer-2-text-char-count-mob'));`;

const newCancelClear = `      updateFooterCharCounter(inpF2TextSide, document.getElementById('footer-2-text-char-count-side'));
      updateFooterCharCounter(inpF2TextMob, document.getElementById('footer-2-text-char-count-mob'));

      // Sembunyikan inline error saat Batal
      ['error-card-footer-text-side', 'error-card-footer-text-mob', 'error-card-footer-2-text-side', 'error-card-footer-2-text-mob'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
      });
      ['input-card-footer-text-side', 'input-card-footer-text-mob', 'input-card-footer-2-text-side', 'input-card-footer-2-text-mob'].forEach(id => {
        document.getElementById(id)?.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
      });`;

if (pf.includes(oldCancelClear)) {
  pf = pf.replace(oldCancelClear, newCancelClear);
  console.log('14. handleCancelCardDesign updated to clear inline errors!');
} else {
  const normPf = pf.replace(/\r\n/g, '\n');
  const normOld = oldCancelClear.replace(/\r\n/g, '\n');
  if (normPf.includes(normOld)) {
    const idx = normPf.indexOf(normOld);
    pf = pf.slice(0, idx) + newCancelClear + pf.slice(idx + normOld.length);
    console.log('14. handleCancelCardDesign updated (CRLF normalized)!');
  }
}

// 15. Update syncF1Str and syncF2Str: clear errors on typing if valid, set isFooterTouched
const oldSyncF1 = `    const syncF1Str = (val) => {
      [inpF1Text, inpF1TextSide, inpF1TextMob].forEach(x => { if (x && x.value !== val) x.value = val; });
      primaryState.card_footer_text = val;
      if (!primaryState.custom_footer_1) primaryState.custom_footer_1 = {};
      primaryState.custom_footer_1.text = val;
      updateFooterCharCounter(inpF1TextSide, document.getElementById('footer-text-char-count-side'));
      updateFooterCharCounter(inpF1TextMob, document.getElementById('footer-text-char-count-mob'));
    };`;

const newSyncF1 = `    const syncF1Str = (val) => {
      [inpF1Text, inpF1TextSide, inpF1TextMob].forEach(x => { if (x && x.value !== val) x.value = val; });
      primaryState.card_footer_text = val;
      if (!primaryState.custom_footer_1) primaryState.custom_footer_1 = {};
      primaryState.custom_footer_1.text = val;
      isFooterTouched = true;
      updateFooterCharCounter(inpF1TextSide, document.getElementById('footer-text-char-count-side'));
      updateFooterCharCounter(inpF1TextMob, document.getElementById('footer-text-char-count-mob'));
      if (val.trim() && getUnicodeLength(val) <= 32) {
        ['error-card-footer-text-side', 'error-card-footer-text-mob'].forEach(id => {
          document.getElementById(id)?.classList.add('hidden');
        });
        [inpF1TextSide, inpF1TextMob].forEach(inp => {
          if (inp) inp.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
        });
      }
    };`;

if (pf.includes(oldSyncF1)) {
  pf = pf.replace(oldSyncF1, newSyncF1);
  console.log('15. syncF1Str updated with reactive error clearing!');
} else {
  const normPf = pf.replace(/\r\n/g, '\n');
  const normOld = oldSyncF1.replace(/\r\n/g, '\n');
  if (normPf.includes(normOld)) {
    const idx = normPf.indexOf(normOld);
    pf = pf.slice(0, idx) + newSyncF1 + pf.slice(idx + normOld.length);
    console.log('15. syncF1Str updated (CRLF normalized)!');
  }
}

const oldSyncF2 = `    const syncF2Str = (val) => {
      [inpF2Text, inpF2TextSide, inpF2TextMob].forEach(x => { if (x && x.value !== val) x.value = val; });
      primaryState.card_footer_2_text = val;
      if (!primaryState.custom_footer_2) primaryState.custom_footer_2 = {};
      primaryState.custom_footer_2.text = val;
      updateFooterCharCounter(inpF2TextSide, document.getElementById('footer-2-text-char-count-side'));
      updateFooterCharCounter(inpF2TextMob, document.getElementById('footer-2-text-char-count-mob'));
    };`;

const newSyncF2 = `    const syncF2Str = (val) => {
      [inpF2Text, inpF2TextSide, inpF2TextMob].forEach(x => { if (x && x.value !== val) x.value = val; });
      primaryState.card_footer_2_text = val;
      if (!primaryState.custom_footer_2) primaryState.custom_footer_2 = {};
      primaryState.custom_footer_2.text = val;
      isFooterTouched = true;
      updateFooterCharCounter(inpF2TextSide, document.getElementById('footer-2-text-char-count-side'));
      updateFooterCharCounter(inpF2TextMob, document.getElementById('footer-2-text-char-count-mob'));
      if (getUnicodeLength(val) <= 32) {
        ['error-card-footer-2-text-side', 'error-card-footer-2-text-mob'].forEach(id => {
          document.getElementById(id)?.classList.add('hidden');
        });
        [inpF2TextSide, inpF2TextMob].forEach(inp => {
          if (inp) inp.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
        });
      }
    };`;

if (pf.includes(oldSyncF2)) {
  pf = pf.replace(oldSyncF2, newSyncF2);
  console.log('16. syncF2Str updated with reactive error clearing!');
} else {
  const normPf = pf.replace(/\r\n/g, '\n');
  const normOld = oldSyncF2.replace(/\r\n/g, '\n');
  if (normPf.includes(normOld)) {
    const idx = normPf.indexOf(normOld);
    pf = pf.slice(0, idx) + newSyncF2 + pf.slice(idx + normOld.length);
    console.log('16. syncF2Str updated (CRLF normalized)!');
  }
}

// 17. Update validateForm: Footer 1 mandatory for final save, with untouched legacy exception
const oldValFooter = `    if (!draftMode && primaryState.card_variant === 'C') {
      const f1Len = getUnicodeLength(primaryState.card_footer_text);
      const f2Len = getUnicodeLength(primaryState.card_footer_2_text);
      if (f1Len > 32) {
        addError(\`Teks Footer 1 melebihi batas 32 karakter (\${f1Len}/32). Harap persingkat teks terlebih dahulu.\`, document.getElementById('input-card-footer-text-side') || document.getElementById('input-card-footer-text'));
      }
      if (f2Len > 32) {
        addError(\`Teks Footer 2 melebihi batas 32 karakter (\${f2Len}/32). Harap persingkat teks terlebih dahulu.\`, document.getElementById('input-card-footer-2-text-side') || document.getElementById('input-card-footer-2-text'));
      }
    }`;

const newValFooter = `    if (!draftMode && primaryState.card_variant === 'C') {
      const f1Val = (primaryState.card_footer_text || '').trim();
      const f2Val = (primaryState.card_footer_2_text || '').trim();
      const f1Len = getUnicodeLength(primaryState.card_footer_text);
      const f2Len = getUnicodeLength(primaryState.card_footer_2_text);
      if (f1Len > 32) {
        addError(\`Label Footer 1 melebihi batas 32 karakter (\${f1Len}/32). Harap persingkat teks terlebih dahulu.\`, document.getElementById('input-card-footer-text-side') || document.getElementById('input-card-footer-text-mob') || document.getElementById('input-card-footer-text'));
      }
      if (f2Len > 32) {
        addError(\`Label Footer 2 melebihi batas 32 karakter (\${f2Len}/32). Harap persingkat teks terlebih dahulu.\`, document.getElementById('input-card-footer-2-text-side') || document.getElementById('input-card-footer-2-text-mob') || document.getElementById('input-card-footer-2-text'));
      }

      // Validasi Footer 1 wajib diisi untuk simpan produk final
      if (!f1Val) {
        const isUntouchedLegacy = (formMode === 'edit' && !isFooterTouched && !initialCardFooterText);
        if (!isUntouchedLegacy) {
          addError('Label Footer 1 wajib diisi untuk Model Kartu Detail.', document.getElementById('input-card-footer-text-side') || document.getElementById('input-card-footer-text-mob') || document.getElementById('input-card-footer-text'));
        }
      }
    }`;

if (pf.includes(oldValFooter)) {
  pf = pf.replace(oldValFooter, newValFooter);
  console.log('17. validateForm updated with mandatory Footer 1 rule & legacy exception!');
} else {
  const normPf = pf.replace(/\r\n/g, '\n');
  const normOld = oldValFooter.replace(/\r\n/g, '\n');
  if (normPf.includes(normOld)) {
    const idx = normPf.indexOf(normOld);
    pf = pf.slice(0, idx) + newValFooter + pf.slice(idx + normOld.length);
    console.log('17. validateForm updated (CRLF normalized)!');
  } else {
    console.error('ERROR: oldValFooter not matched!');
    process.exit(1);
  }
}

// 18. Update loadProductForEdit: track initialCardFooterText and isFooterTouched
const oldLoadEdit = `    const inheritedFooter = getLastProductFooterConfig();
    const f1Prod = prod.custom_footer_1 ? { ...prod.custom_footer_1 } : (
      (prod.card_footer_text || prod.footer_bg_color) ? {
        text: prod.card_footer_text || '',
        icon: prod.footer_badge_icon || 'truck',
        bg_color: prod.footer_bg_color || getPrimaryThemeColor(),
        text_color: prod.footer_text_color || '#ffffff'
      } : (inheritedFooter?.f1 || {
        text: '',
        icon: 'truck',
        bg_color: getPrimaryThemeColor(),
        text_color: '#ffffff'
      })
    );

    const f2Prod = prod.custom_footer_2 ? { ...prod.custom_footer_2 } : (
      (prod.card_footer_2_text || prod.footer_2_bg_color) ? {
        text: prod.card_footer_2_text || '',
        icon: prod.footer_2_badge_icon || 'minus',
        bg_color: prod.footer_2_bg_color || getPrimaryThemeColor(),
        text_color: prod.footer_2_text_color || '#ffffff'
      } : (inheritedFooter?.f2 || {
        text: '',
        icon: 'minus',
        bg_color: getPrimaryThemeColor(),
        text_color: '#ffffff'
      })
    );`;

const newLoadEdit = `    initialCardFooterText = (prod.card_footer_text || prod.custom_footer_1?.text || '').trim();
    isFooterTouched = false;
    const f1Prod = prod.custom_footer_1 ? { ...prod.custom_footer_1 } : {
      text: prod.card_footer_text || '',
      icon: prod.footer_badge_icon || 'truck',
      bg_color: prod.footer_bg_color || getPrimaryThemeColor(),
      text_color: prod.footer_text_color || '#ffffff'
    };

    const f2Prod = prod.custom_footer_2 ? { ...prod.custom_footer_2 } : {
      text: prod.card_footer_2_text || '',
      icon: prod.footer_2_badge_icon || 'minus',
      bg_color: prod.footer_2_bg_color || getSecondaryThemeColor(),
      text_color: prod.footer_2_text_color || '#ffffff'
    };`;

if (pf.includes(oldLoadEdit)) {
  pf = pf.replace(oldLoadEdit, newLoadEdit);
  console.log('18. loadProductForEdit updated with clean non-inheriting footer & tracking!');
} else {
  const normPf = pf.replace(/\r\n/g, '\n');
  const normOld = oldLoadEdit.replace(/\r\n/g, '\n');
  if (normPf.includes(normOld)) {
    const idx = normPf.indexOf(normOld);
    pf = pf.slice(0, idx) + newLoadEdit + pf.slice(idx + normOld.length);
    console.log('18. loadProductForEdit updated (CRLF normalized)!');
  } else {
    console.log('18. Note: oldLoadEdit not matched directly.');
  }
}

// 19. Update initCreateProduct: clean non-inheriting footer & tracking
const oldInitCreate = `    const inheritedFooter = getLastProductFooterConfig();
    const f1Default = inheritedFooter?.f1 || {
      text: '',
      icon: 'truck',
      bg_color: getPrimaryThemeColor(),
      text_color: '#ffffff'
    };
    const f2Default = inheritedFooter?.f2 || {
      text: '',
      icon: 'minus',
      bg_color: getPrimaryThemeColor(),
      text_color: '#ffffff'
    };`;

const newInitCreate = `    initialCardFooterText = '';
    isFooterTouched = true;
    const f1Default = {
      text: '',
      icon: 'truck',
      bg_color: getPrimaryThemeColor(),
      text_color: '#ffffff'
    };
    const f2Default = {
      text: '',
      icon: 'minus',
      bg_color: getSecondaryThemeColor(),
      text_color: '#ffffff'
    };`;

if (pf.includes(oldInitCreate)) {
  pf = pf.replace(oldInitCreate, newInitCreate);
  console.log('19. initCreateProduct updated with empty text & secondary f2 bg!');
} else {
  const normPf = pf.replace(/\r\n/g, '\n');
  const normOld = oldInitCreate.replace(/\r\n/g, '\n');
  if (normPf.includes(normOld)) {
    const idx = normPf.indexOf(normOld);
    pf = pf.slice(0, idx) + newInitCreate + pf.slice(idx + normOld.length);
    console.log('19. initCreateProduct updated (CRLF normalized)!');
  } else {
    console.log('19. Note: oldInitCreate not matched directly.');
  }
}

fs.writeFileSync('js/product-form.js', pf);
console.log('Successfully written js/product-form.js!');

