const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');

// Helper to check regex match
function safeReplace(str, regex, replacement, desc) {
  if (!regex.test(str)) {
    console.error(`ERROR: Pattern for ${desc} not found!`);
    process.exit(1);
  }
  const result = str.replace(regex, replacement);
  console.log(`✓ ${desc} replaced successfully.`);
  return result;
}

// 1. Add getSecondaryThemeColor() right after getPrimaryThemeColor()
const regexGetPrimary = /(function getPrimaryThemeColor\(\) \{[\s\S]*?return '#33b589';\s*\})/;
const secColorFn = `$1

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
  }`;
pf = safeReplace(pf, regexGetPrimary, secColorFn, 'getSecondaryThemeColor() definition');

// 2. Add isFooterTouched and initialCardFooterText
const regexMaterialsState = /(let materialsState = \[\];)/;
const stateVars = `let initialCardFooterText = '';
  let isFooterTouched = false;
  $1`;
pf = safeReplace(pf, regexMaterialsState, stateVars, 'initialCardFooterText & isFooterTouched state vars');

// 3. Update getUnicodeLength with Intl.Segmenter
const regexUnicodeLen = /function getUnicodeLength\(str\) \{\s*return str \? \[\.\.\.str\]\.length : 0;\s*\}/;
const newUnicodeFn = `function getUnicodeLength(str) {
    if (!str) return 0;
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        return [...segmenter.segment(str)].length;
      } catch (_) { }
    }
    return [...str].length;
  }`;
pf = safeReplace(pf, regexUnicodeLen, newUnicodeFn, 'getUnicodeLength with Intl.Segmenter');

// 4. Update initial primaryState footer_2_bg_color to getSecondaryThemeColor()
const regexPrimaryStateF2 = /(footer_2_bg_color:\s*)getPrimaryThemeColor\(\),/;
pf = safeReplace(pf, regexPrimaryStateF2, '$1getSecondaryThemeColor(),', 'initial primaryState footer_2_bg_color');

// 5. Update getLastProductFooterConfig (no text inheritance, f2 bg is secondary)
const regexLastProd = /const f1 = p\.custom_footer_1 \? \{ \.\.\.p\.custom_footer_1 \} : \{[\s\S]*?text_color: p\.footer_2_text_color \|\| '#ffffff'\s*\};\s*return \{ f1, f2 \};/;
const newLastProd = `const f1 = p.custom_footer_1 ? { ...p.custom_footer_1, text: '' } : {
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
          };
          return { f1, f2 };`;
pf = safeReplace(pf, regexLastProd, newLastProd, 'getLastProductFooterConfig');

// 6. Update getOptionsForDatalist for footer-texts-history-list
const regexDatalistFooter = /\} else if \(listId === 'footer-texts-history-list'\) \{[\s\S]*?defaultFooters\.forEach\(f => \{[\s\S]*?\}\s*\}\s*\} else if \(listId === 'datalist-stock-unlimited'\)/;
const newDatalistFooter = `} else if (listId === 'footer-texts-history-list') {
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
    } else if (listId === 'datalist-stock-unlimited')`;
pf = safeReplace(pf, regexDatalistFooter, newDatalistFooter, 'getOptionsForDatalist footer');

// 7. Update native HTML5 datalist template
const regexNativeDatalist = /<!-- Native HTML5 Datalist untuk Teks Footer Model C \(Persis Gambar 2\) -->[\s\S]*?<datalist id="footer-texts-history-list">[\s\S]*?<\/datalist>/;
const newNativeDatalist = `<!-- Native HTML5 Datalist untuk Teks Footer Model C -->
        <datalist id="footer-texts-history-list">
          <option value="Proses Cepat & Garansi Presisi"></option>
          <option value="Siap Kirim Seluruh Indonesia"></option>
          <option value="Gratis Konsultasi Desain"></option>
          <option value="Bahan Premium Tahan Cuaca"></option>
          <option value="Garansi Uang Kembali Jika Cacat"></option>
          <option value="Pengerjaan 1 Hari Jadi"></option>
          <option value="Bisa Custom Ukuran & Desain"></option>
        </datalist>`;
pf = safeReplace(pf, regexNativeDatalist, newNativeDatalist, 'HTML5 datalist template');

// 8. Update initCreateProduct
const regexInitCreate = /const inheritedFooter = getLastProductFooterConfig\(\);\s*const f1Default = inheritedFooter\?\.f1 \|\| \{[\s\S]*?const f2Default = inheritedFooter\?\.f2 \|\| \{[\s\S]*?text_color: '#ffffff'\s*\};/;
const newInitCreate = `initialCardFooterText = '';
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
pf = safeReplace(pf, regexInitCreate, newInitCreate, 'initCreateProduct');

// 9. Update loadProductForEdit
const regexLoadEdit = /const inheritedFooter = getLastProductFooterConfig\(\);\s*const f1Prod = prod\.custom_footer_1 \? \{ \.\.\.prod\.custom_footer_1 \} : \([\s\S]*?const f2Prod = prod\.custom_footer_2 \? \{ \.\.\.prod\.custom_footer_2 \} : \([\s\S]*?text_color: '#ffffff'\s*\}\)\s*\);/;
const newLoadEdit = `initialCardFooterText = (prod.card_footer_text || prod.custom_footer_1?.text || '').trim();
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
pf = safeReplace(pf, regexLoadEdit, newLoadEdit, 'loadProductForEdit');

// 10. Update loadCardConfigInputs: Footer 2 fallback to getSecondaryThemeColor()
const regexLoadCfgF2 = /(const f2Bg = primaryState\.footer_2_bg_color \|\| cfg\.footer_2_bg_color \|\| )defThemeColor;/;
pf = safeReplace(pf, regexLoadCfgF2, '$1getSecondaryThemeColor();', 'loadCardConfigInputs f2Bg');

// 11. Update updateProductCardLivePreview: Footer 2 fallback to getSecondaryThemeColor()
const regexLivePreviewF2 = /(const footer2BgColor = document\.getElementById\('cfg-footer-2-bg-color-side'\)\?\.value \|\| document\.getElementById\('cfg-footer-2-bg-color'\)\?\.value \|\| primaryState\.footer_2_bg_color \|\| )defCardThemeColor;/;
const newLivePreviewF2 = `$1(cfg && cfg.footer_2_bg_color) || getSecondaryThemeColor();`;
pf = safeReplace(pf, regexLivePreviewF2, newLivePreviewF2, 'updateProductCardLivePreview footer2BgColor');

// 12. Update submitForm: Footer 2 fallback to getSecondaryThemeColor()
const regexSubmitF2 = /(const footer2BgVal = document\.getElementById\('cfg-footer-2-bg-color-side'\)\?\.value \|\| document\.getElementById\('cfg-footer-2-bg-color'\)\?\.value \|\| primaryState\.custom_footer_2\?\.bg_color \|\| primaryState\.footer_2_bg_color \|\| )getPrimaryThemeColor\(\);/;
pf = safeReplace(pf, regexSubmitF2, '$1getSecondaryThemeColor();', 'submitForm footer2BgVal');

// 13. Update syncF1Str & syncF2Str with reactive error clearing and isFooterTouched
const regexSyncF1 = /const syncF1Str = \(val\) => \{[\s\S]*?updateFooterCharCounter\(inpF1TextMob, document\.getElementById\('footer-text-char-count-mob'\)\);\s*\};/;
const newSyncF1 = `const syncF1Str = (val) => {
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
pf = safeReplace(pf, regexSyncF1, newSyncF1, 'syncF1Str');

const regexSyncF2 = /const syncF2Str = \(val\) => \{[\s\S]*?updateFooterCharCounter\(inpF2TextMob, document\.getElementById\('footer-2-text-char-count-mob'\)\);\s*\};/;
const newSyncF2 = `const syncF2Str = (val) => {
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
pf = safeReplace(pf, regexSyncF2, newSyncF2, 'syncF2Str');

// 14. Update handleSaveCardDesign
const regexHandleSave = /function handleSaveCardDesign\(\) \{[\s\S]*?captureCardDesignSnapshot\(true\);[\s\S]*?updateProductCardLivePreview\(\);[\s\S]*?catch \(e\) \{[\s\S]*?\}\s*\}/;
const newHandleSave = `function handleSaveCardDesign() {
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
pf = safeReplace(pf, regexHandleSave, newHandleSave, 'handleSaveCardDesign');

// 15. Update handleCancelCardDesign
const regexCancelCounters = /updateFooterCharCounter\(inpF2TextMob, document\.getElementById\('footer-2-text-char-count-mob'\)\);/;
const newCancelCounters = `updateFooterCharCounter(inpF2TextMob, document.getElementById('footer-2-text-char-count-mob'));

      // Sembunyikan inline error saat Batal
      ['error-card-footer-text-side', 'error-card-footer-text-mob', 'error-card-footer-2-text-side', 'error-card-footer-2-text-mob'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
      });
      ['input-card-footer-text-side', 'input-card-footer-text-mob', 'input-card-footer-2-text-side', 'input-card-footer-2-text-mob'].forEach(id => {
        document.getElementById(id)?.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
      });`;
pf = safeReplace(pf, regexCancelCounters, newCancelCounters, 'handleCancelCardDesign');

// 16. Update validateForm
const regexValidateFooter = /if \(!draftMode && primaryState\.card_variant === 'C'\) \{[\s\S]*?addError\(`Teks Footer 2 melebihi batas 32 karakter[\s\S]*?\}\s*\}/;
const newValidateFooter = `if (!draftMode && primaryState.card_variant === 'C') {
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
pf = safeReplace(pf, regexValidateFooter, newValidateFooter, 'validateForm footer rules');

// 17. Update Desktop & Mobile Footer Markup: Add inline error elements & secondary color
// Desktop F1 inline error:
const deskF1Anchor = /(<input type="text" id="input-card-footer-text-side"[^>]*\/>\s*<\/div>)/;
const deskF1WithErr = `$1
                        <div id="error-card-footer-text-side" class="hidden text-[10px] text-red-600 font-normal mt-1 flex items-center gap-1"><i class="bi bi-exclamation-circle text-[10px]"></i><span class="error-msg">Label Footer 1 wajib diisi.</span></div>`;
pf = safeReplace(pf, deskF1Anchor, deskF1WithErr, 'Desktop F1 inline error markup');

// Desktop F2 inline error:
const deskF2Anchor = /(<input type="text" id="input-card-footer-2-text-side"[^>]*\/>\s*<\/div>)/;
const deskF2WithErr = `$1
                        <div id="error-card-footer-2-text-side" class="hidden text-[10px] text-red-600 font-normal mt-1 flex items-center gap-1"><i class="bi bi-exclamation-circle text-[10px]"></i><span class="error-msg"></span></div>`;
pf = safeReplace(pf, deskF2Anchor, deskF2WithErr, 'Desktop F2 inline error markup');

// Mobile F1 inline error:
const mobF1Anchor = /(<input type="text" id="input-card-footer-text-mob"[^>]*\/>\s*<\/div>)/;
const mobF1WithErr = `$1
                        <div id="error-card-footer-text-mob" class="hidden text-[10px] text-red-600 font-normal mt-1 flex items-center gap-1"><i class="bi bi-exclamation-circle text-[10px]"></i><span class="error-msg">Label Footer 1 wajib diisi.</span></div>`;
pf = safeReplace(pf, mobF1Anchor, mobF1WithErr, 'Mobile F1 inline error markup');

// Mobile F2 inline error:
const mobF2Anchor = /(<input type="text" id="input-card-footer-2-text-mob"[^>]*\/>\s*<\/div>)/;
const mobF2WithErr = `$1
                        <div id="error-card-footer-2-text-mob" class="hidden text-[10px] text-red-600 font-normal mt-1 flex items-center gap-1"><i class="bi bi-exclamation-circle text-[10px]"></i><span class="error-msg"></span></div>`;
pf = safeReplace(pf, mobF2Anchor, mobF2WithErr, 'Mobile F2 inline error markup');

// Update Footer 2 color inputs default value in desktop and mobile markup
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
console.log('✓ Footer 2 color inputs default values updated to getSecondaryThemeColor()');

fs.writeFileSync('js/product-form.js', pf);
console.log('\nAll replacements done and js/product-form.js saved!');

