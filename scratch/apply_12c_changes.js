const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');

// 1. getOptionsForDatalist update for footer-texts-history-list
const targetGetOptions = `    } else if (listId === 'footer-texts-history-list') {
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

const replGetOptions = `    } else if (listId === 'footer-texts-history-list') {
      if (typeof DB !== 'undefined' && typeof DB.getFooterTextsHistory === 'function') {
        try {
          const history = DB.getFooterTextsHistory();
          if (Array.isArray(history) && history.length > 0) {
            return history;
          }
        } catch (_) { }
      }
      return [
        'Proses Cepat & Garansi Presisi',
        'Siap Kirim Seluruh Indonesia',
        'Gratis Konsultasi Desain',
        'Bahan Premium Tahan Cuaca',
        'Garansi Uang Kembali Jika Cacat',
        'Pengerjaan 1 Hari Jadi',
        'Bisa Custom Ukuran & Desain'
      ];
    }`;

if (!pf.includes(targetGetOptions)) {
  console.error('Target getOptionsForDatalist not found!');
  process.exit(1);
}
pf = pf.replace(targetGetOptions, replGetOptions);
console.log('✓ getOptionsForDatalist updated.');

// 2. Add truncateTo32Graphemes helper near getUnicodeLength
const targetUnicodeFn = `  function getUnicodeLength(str) {
    if (!str) return 0;
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        return [...segmenter.segment(str)].length;
      } catch (_) { }
    }
    return [...str].length;
  }`;

const replUnicodeFn = `  function getUnicodeLength(str) {
    if (!str) return 0;
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        return [...segmenter.segment(str)].length;
      } catch (_) { }
    }
    return [...str].length;
  }

  function truncateTo32Graphemes(str) {
    if (!str) return '';
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        const segments = [...segmenter.segment(str)];
        if (segments.length > 32) {
          return segments.slice(0, 32).map(s => s.segment).join('');
        }
        return str;
      } catch (_) { }
    }
    return [...str].slice(0, 32).join('');
  }`;

if (!pf.includes(targetUnicodeFn)) {
  console.error('Target getUnicodeLength not found!');
  process.exit(1);
}
pf = pf.replace(targetUnicodeFn, replUnicodeFn);
console.log('✓ truncateTo32Graphemes added.');

// 3. Update bindCleanDatalistPopovers to attach _syncDatalistControls and truncate 32 chars on footer selection
const targetSyncControlButtons = `      const syncControlButtons = syncClearAndArrowVisibility;`;
const replSyncControlButtons = `      const syncControlButtons = syncClearAndArrowVisibility;
      input._syncDatalistControls = syncClearAndArrowVisibility;`;

if (!pf.includes(targetSyncControlButtons)) {
  console.error('Target syncControlButtons not found!');
  process.exit(1);
}
pf = pf.replace(targetSyncControlButtons, replSyncControlButtons);
console.log('✓ _syncDatalistControls attached.');

const targetItemMousedown = `            if (input.classList.contains('combo-max-order-input')) {`;
const replItemMousedown = `            if (input.id && input.id.includes('footer') && input.id.includes('text')) {
              input.value = truncateTo32Graphemes(val);
            } else if (input.classList.contains('combo-max-order-input')) {`;

if (!pf.includes(targetItemMousedown)) {
  console.error('Target item mousedown not found!');
  process.exit(1);
}
pf = pf.replace(targetItemMousedown, replItemMousedown);
console.log('✓ item mousedown 32 char truncation applied.');

// 4. Update Desktop and Mobile Badge Markup in renderForm
const targetDeskBadge = `              <!-- Penanda Data Contoh Desktop (Task SC-ADMIN-CARD-METRIC-SOURCES-10) -->
              <div id="preview-sample-data-badge" class="hidden inline-flex items-center justify-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mb-2 font-normal select-none">
                <i class="bi bi-info-circle text-[10px]"></i>
                <span>Data contoh</span>
              </div>`;

const replDeskBadge = `              <!-- Penanda Data Contoh Desktop (Task SC-ADMIN-CARD-METRIC-SOURCES-10) -->
              <div id="preview-sample-data-badge" class="hidden inline-flex items-center justify-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mb-2 font-normal select-none">
                <i class="bi bi-info-circle text-[10px]"></i>
                <span>Data contoh</span>
              </div>
              <!-- Penanda Footer Contoh Desktop (Task SC-ADMIN-FOOTER-COMBOBOX-PREVIEW-12C) -->
              <div id="preview-footer-sample-badge" class="hidden inline-flex items-center justify-center gap-1 text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full mb-2 font-normal select-none">
                <i class="bi bi-info-circle text-[10px]"></i>
                <span>Footer kosong ditampilkan sebagai contoh.</span>
              </div>`;

if (!pf.includes(targetDeskBadge)) {
  console.error('Target desk badge not found!');
  process.exit(1);
}
pf = pf.replace(targetDeskBadge, replDeskBadge);
console.log('✓ Desktop preview-footer-sample-badge added.');

const targetMobBadge = `              <!-- Penanda Data Contoh Mobile (Task SC-ADMIN-CARD-METRIC-SOURCES-10) -->
              <div id="preview-sample-data-badge-mob" class="hidden inline-flex items-center justify-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mb-2 font-normal select-none">
                <i class="bi bi-info-circle text-[10px]"></i>
                <span>Data contoh</span>
              </div>`;

const replMobBadge = `              <!-- Penanda Data Contoh Mobile (Task SC-ADMIN-CARD-METRIC-SOURCES-10) -->
              <div id="preview-sample-data-badge-mob" class="hidden inline-flex items-center justify-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mb-2 font-normal select-none">
                <i class="bi bi-info-circle text-[10px]"></i>
                <span>Data contoh</span>
              </div>
              <!-- Penanda Footer Contoh Mobile (Task SC-ADMIN-FOOTER-COMBOBOX-PREVIEW-12C) -->
              <div id="preview-footer-sample-badge-mob" class="hidden inline-flex items-center justify-center gap-1 text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full mb-2 font-normal select-none">
                <i class="bi bi-info-circle text-[10px]"></i>
                <span>Footer kosong ditampilkan sebagai contoh.</span>
              </div>`;

if (!pf.includes(targetMobBadge)) {
  console.error('Target mob badge not found!');
  process.exit(1);
}
pf = pf.replace(targetMobBadge, replMobBadge);
console.log('✓ Mobile preview-footer-sample-badge-mob added.');

// 5. Update Desktop Footer Inputs Markup in renderForm
const targetDeskInputs = `                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-text-side" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Tersedia berbagai Variasi" value="\${escapeHtml(primaryState.card_footer_text || '')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>`;

const replDeskInputs = `                        <div class="relative w-full">
                          <input type="text" id="input-card-footer-text-side" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Tersedia berbagai Variasi" maxlength="32" value="\${escapeHtml(primaryState.card_footer_text || '')}" class="clean-datalist-input w-full px-2.5 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>`;

if (!pf.includes(targetDeskInputs)) {
  console.error('Target desk inputs F1 not found!');
  process.exit(1);
}
pf = pf.replace(targetDeskInputs, replDeskInputs);
console.log('✓ Desktop F1 input markup updated.');

const targetDeskInputsF2 = `                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-2-text-side" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Pengiriman Cepat" value="\${escapeHtml(primaryState.card_footer_2_text || '')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>`;

const replDeskInputsF2 = `                        <div class="relative w-full">
                          <input type="text" id="input-card-footer-2-text-side" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Pengiriman Cepat" maxlength="32" value="\${escapeHtml(primaryState.card_footer_2_text || '')}" class="clean-datalist-input w-full px-2.5 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>`;

if (!pf.includes(targetDeskInputsF2)) {
  console.error('Target desk inputs F2 not found!');
  process.exit(1);
}
pf = pf.replace(targetDeskInputsF2, replDeskInputsF2);
console.log('✓ Desktop F2 input markup updated.');

// 6. Update Mobile Footer Inputs Markup in renderForm
const targetMobInputsF1 = `                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Tersedia berbagai Variasi" value="\${escapeHtml(primaryState.card_footer_text || '')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>`;

const replMobInputsF1 = `                        <div class="relative w-full">
                          <input type="text" id="input-card-footer-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Tersedia berbagai Variasi" maxlength="32" value="\${escapeHtml(primaryState.card_footer_text || '')}" class="clean-datalist-input w-full px-2.5 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>`;

if (!pf.includes(targetMobInputsF1)) {
  console.error('Target mob inputs F1 not found!');
  process.exit(1);
}
pf = pf.replace(targetMobInputsF1, replMobInputsF1);
console.log('✓ Mobile F1 input markup updated.');

const targetMobInputsF2 = `                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-2-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Pengiriman Cepat" value="\${escapeHtml(primaryState.card_footer_2_text || '')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>`;

const replMobInputsF2 = `                        <div class="relative w-full">
                          <input type="text" id="input-card-footer-2-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Pengiriman Cepat" maxlength="32" value="\${escapeHtml(primaryState.card_footer_2_text || '')}" class="clean-datalist-input w-full px-2.5 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>`;

if (!pf.includes(targetMobInputsF2)) {
  console.error('Target mob inputs F2 not found!');
  process.exit(1);
}
pf = pf.replace(targetMobInputsF2, replMobInputsF2);
console.log('✓ Mobile F2 input markup updated.');

// 7. Update bindCleanDatalistPopovers call at the end of renderForm
const targetBindScope = `    if (typeof bindCleanDatalistPopovers === 'function') {
      bindCleanDatalistPopovers(document.getElementById('step-pane-1') || document);
    }`;

const replBindScope = `    if (typeof bindCleanDatalistPopovers === 'function') {
      bindCleanDatalistPopovers(document);
    }`;

if (!pf.includes(targetBindScope)) {
  console.error('Target bindCleanDatalistPopovers in renderForm not found!');
  process.exit(1);
}
pf = pf.replace(targetBindScope, replBindScope);
console.log('✓ renderForm bindCleanDatalistPopovers set to document.');

// 8. Update syncF1Str and syncF2Str
const targetSyncF1Str = `    const syncF1Str = (val) => {
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

const replSyncF1Str = `    const syncF1Str = (val) => {
      const cleanVal = truncateTo32Graphemes(val);
      [inpF1Text, inpF1TextSide, inpF1TextMob].forEach(x => {
        if (x && x.value !== cleanVal) x.value = cleanVal;
        if (x && typeof x._syncDatalistControls === 'function') x._syncDatalistControls();
      });
      primaryState.card_footer_text = cleanVal;
      if (!primaryState.custom_footer_1) primaryState.custom_footer_1 = {};
      primaryState.custom_footer_1.text = cleanVal;
      isFooterTouched = true;
      updateFooterCharCounter(inpF1TextSide, document.getElementById('footer-text-char-count-side'));
      updateFooterCharCounter(inpF1TextMob, document.getElementById('footer-text-char-count-mob'));
      if (cleanVal.trim() && getUnicodeLength(cleanVal) <= 32) {
        ['error-card-footer-text-side', 'error-card-footer-text-mob'].forEach(id => {
          document.getElementById(id)?.classList.add('hidden');
        });
        [inpF1TextSide, inpF1TextMob].forEach(inp => {
          if (inp) inp.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
        });
      }
    };`;

if (!pf.includes(targetSyncF1Str)) {
  console.error('Target syncF1Str not found!');
  process.exit(1);
}
pf = pf.replace(targetSyncF1Str, replSyncF1Str);
console.log('✓ syncF1Str updated.');

const targetSyncF2Str = `    const syncF2Str = (val) => {
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

const replSyncF2Str = `    const syncF2Str = (val) => {
      const cleanVal = truncateTo32Graphemes(val);
      [inpF2Text, inpF2TextSide, inpF2TextMob].forEach(x => {
        if (x && x.value !== cleanVal) x.value = cleanVal;
        if (x && typeof x._syncDatalistControls === 'function') x._syncDatalistControls();
      });
      primaryState.card_footer_2_text = cleanVal;
      if (!primaryState.custom_footer_2) primaryState.custom_footer_2 = {};
      primaryState.custom_footer_2.text = cleanVal;
      isFooterTouched = true;
      updateFooterCharCounter(inpF2TextSide, document.getElementById('footer-2-text-char-count-side'));
      updateFooterCharCounter(inpF2TextMob, document.getElementById('footer-2-text-char-count-mob'));
      if (getUnicodeLength(cleanVal) <= 32) {
        ['error-card-footer-2-text-side', 'error-card-footer-2-text-mob'].forEach(id => {
          document.getElementById(id)?.classList.add('hidden');
        });
        [inpF2TextSide, inpF2TextMob].forEach(inp => {
          if (inp) inp.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
        });
      }
    };`;

if (!pf.includes(targetSyncF2Str)) {
  console.error('Target syncF2Str not found!');
  process.exit(1);
}
pf = pf.replace(targetSyncF2Str, replSyncF2Str);
console.log('✓ syncF2Str updated.');

// 9. Update loadCardConfigInputs and handleCancelCardDesign
const targetLoadF1 = `      [inpF1Text, inpF1TextSide, inpF1TextMob].forEach(x => { if (x) x.value = f1Text; });`;
const replLoadF1 = `      [inpF1Text, inpF1TextSide, inpF1TextMob].forEach(x => {
        if (x) {
          x.value = f1Text;
          if (typeof x._syncDatalistControls === 'function') x._syncDatalistControls();
        }
      });`;

if (!pf.includes(targetLoadF1)) {
  console.error('Target load F1 not found!');
  process.exit(1);
}
pf = pf.replace(targetLoadF1, replLoadF1);
console.log('✓ load F1 updated.');

const targetLoadF2 = `      [inpF2Text, inpF2TextSide, inpF2TextMob].forEach(x => { if (x) x.value = f2Text; });`;
const replLoadF2 = `      [inpF2Text, inpF2TextSide, inpF2TextMob].forEach(x => {
        if (x) {
          x.value = f2Text;
          if (typeof x._syncDatalistControls === 'function') x._syncDatalistControls();
        }
      });`;

if (!pf.includes(targetLoadF2)) {
  console.error('Target load F2 not found!');
  process.exit(1);
}
pf = pf.replace(targetLoadF2, replLoadF2);
console.log('✓ load F2 updated.');

// 10. Update applyCardVariant and btn-step1-tab-design to re-bind and sync controls
const targetApplyVariantFooter = `      const panelF3Mob = document.getElementById('cfg-panel-footer-model3-mob');
      if (panelF3Mob) {
        if (variantCode === 'C') panelF3Mob.classList.remove('hidden');
        else panelF3Mob.classList.add('hidden');
      }`;

const replApplyVariantFooter = `      const panelF3Mob = document.getElementById('cfg-panel-footer-model3-mob');
      if (panelF3Mob) {
        if (variantCode === 'C') panelF3Mob.classList.remove('hidden');
        else panelF3Mob.classList.add('hidden');
      }
      if (variantCode === 'C') {
        if (typeof bindCleanDatalistPopovers === 'function') {
          const cDesk = document.getElementById('card-customization-section');
          const cMob = document.getElementById('card-customization-section-mob');
          if (cDesk) bindCleanDatalistPopovers(cDesk);
          if (cMob) bindCleanDatalistPopovers(cMob);
        }
        [document.getElementById('input-card-footer-text-side'), document.getElementById('input-card-footer-text-mob'), document.getElementById('input-card-footer-2-text-side'), document.getElementById('input-card-footer-2-text-mob')].forEach(inp => {
          if (inp && typeof inp._syncDatalistControls === 'function') inp._syncDatalistControls();
        });
      }`;

if (!pf.includes(targetApplyVariantFooter)) {
  console.error('Target applyVariant footer not found!');
  process.exit(1);
}
pf = pf.replace(targetApplyVariantFooter, replApplyVariantFooter);
console.log('✓ applyCardVariant footer binding updated.');

const targetTabDesignClick = `    ['btn-step1-tab-design', 'btn-step1-tab-design-mob'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.onclick = (e) => {
          e.preventDefault();
          previewStep1Tab = 'design';
          updatePreviewSidebarHeader();
          updateProductCardLivePreview();
        };
      }
    });`;

const replTabDesignClick = `    ['btn-step1-tab-design', 'btn-step1-tab-design-mob'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.onclick = (e) => {
          e.preventDefault();
          previewStep1Tab = 'design';
          if (typeof bindCleanDatalistPopovers === 'function') {
            const cDesk = document.getElementById('card-customization-section');
            const cMob = document.getElementById('card-customization-section-mob');
            if (cDesk) bindCleanDatalistPopovers(cDesk);
            if (cMob) bindCleanDatalistPopovers(cMob);
          }
          [document.getElementById('input-card-footer-text-side'), document.getElementById('input-card-footer-text-mob'), document.getElementById('input-card-footer-2-text-side'), document.getElementById('input-card-footer-2-text-mob')].forEach(inp => {
            if (inp && typeof inp._syncDatalistControls === 'function') inp._syncDatalistControls();
          });
          updatePreviewSidebarHeader();
          updateProductCardLivePreview();
        };
      }
    });`;

if (!pf.includes(targetTabDesignClick)) {
  console.error('Target tabDesign click not found!');
  process.exit(1);
}
pf = pf.replace(targetTabDesignClick, replTabDesignClick);
console.log('✓ btn-step1-tab-design click updated.');

// 11. Update updateProductCardLivePreview for local sample footers and notice badge
const targetPreviewFooters = `    // Footer 1 Custom Styles (Khusus Card C)
    const footerBgColor = document.getElementById('cfg-footer-bg-color-side')?.value || document.getElementById('cfg-footer-bg-color')?.value || primaryState.footer_bg_color || defCardThemeColor;
    const footerTextColor = document.getElementById('cfg-footer-text-color-side')?.value || document.getElementById('cfg-footer-text-color')?.value || primaryState.footer_text_color || '#ffffff';
    const footerTextInput = document.getElementById('input-card-footer-text-side') || document.getElementById('input-card-footer-text');
    const footerText = (footerTextInput ? footerTextInput.value : (primaryState.card_footer_text || '')).trim();
    const footerIcon = (primaryState.footer_badge_icon || 'truck').trim();

    // Footer 2 Custom Styles (Khusus Card C)
    const footer2BgColor = document.getElementById('cfg-footer-2-bg-color-side')?.value || document.getElementById('cfg-footer-2-bg-color')?.value || primaryState.footer_2_bg_color || (cfg && cfg.footer_2_bg_color) || getSecondaryThemeColor();
    const footer2TextColor = document.getElementById('cfg-footer-2-text-color-side')?.value || document.getElementById('cfg-footer-2-text-color')?.value || primaryState.footer_2_text_color || '#ffffff';
    const footer2TextInput = document.getElementById('input-card-footer-2-text-side') || document.getElementById('input-card-footer-2-text');
    const footer2Text = (footer2TextInput ? footer2TextInput.value : (primaryState.card_footer_2_text || '')).trim();
    const footer2Icon = (primaryState.footer_2_badge_icon || 'minus').trim();`;

const replPreviewFooters = `    // Footer 1 Custom Styles (Khusus Card C)
    const footerBgColor = document.getElementById('cfg-footer-bg-color-side')?.value || document.getElementById('cfg-footer-bg-color')?.value || primaryState.footer_bg_color || defCardThemeColor;
    const footerTextColor = document.getElementById('cfg-footer-text-color-side')?.value || document.getElementById('cfg-footer-text-color')?.value || primaryState.footer_text_color || '#ffffff';
    const footerTextInput = document.getElementById('input-card-footer-text-side') || document.getElementById('input-card-footer-text');
    const rawFooterText = (footerTextInput ? footerTextInput.value : (primaryState.card_footer_text || '')).trim();
    const footerIcon = (primaryState.footer_badge_icon || 'truck').trim();

    // Footer 2 Custom Styles (Khusus Card C)
    const footer2BgColor = document.getElementById('cfg-footer-2-bg-color-side')?.value || document.getElementById('cfg-footer-2-bg-color')?.value || primaryState.footer_2_bg_color || (cfg && cfg.footer_2_bg_color) || getSecondaryThemeColor();
    const footer2TextColor = document.getElementById('cfg-footer-2-text-color-side')?.value || document.getElementById('cfg-footer-2-text-color')?.value || primaryState.footer_2_text_color || '#ffffff';
    const footer2TextInput = document.getElementById('input-card-footer-2-text-side') || document.getElementById('input-card-footer-2-text');
    const rawFooter2Text = (footer2TextInput ? footer2TextInput.value : (primaryState.card_footer_2_text || '')).trim();
    const footer2Icon = (primaryState.footer_2_badge_icon || 'minus').trim();

    // Evaluasi Footer Model C:
    // Khusus Step 1 Admin Preview (baik tab Pratinjau maupun Desain Kartu, Desktop & Mobile):
    // Selalu tampilkan dua baris footer dengan fallback teks contoh jika input kosong.
    const isStep1CardPreview = (currentStep === 1 && variant === 'C');
    const hasUserFooter1 = Boolean(rawFooterText);
    const hasUserFooter2 = Boolean(rawFooter2Text);

    // Teks contoh lokal (TIDAK BOLEH disimpan ke primaryState, card_config, input, atau payload produk)
    const previewF1Text = hasUserFooter1 ? rawFooterText : (isStep1CardPreview ? 'Tersedia berbagai Variasi' : '');
    const previewF2Text = hasUserFooter2 ? rawFooter2Text : (isStep1CardPreview ? 'Pengiriman Cepat' : '');

    const isF1Sample = isStep1CardPreview && !hasUserFooter1;
    const isF2Sample = isStep1CardPreview && !isCountdownActive && !hasUserFooter2;
    const hasSampleFooter = isStep1CardPreview && (isF1Sample || isF2Sample);

    const hasFooter1 = Boolean(previewF1Text);
    const hasFooter2 = isCountdownActive || Boolean(previewF2Text);`;

if (!pf.includes(targetPreviewFooters)) {
  console.error('Target preview footers not found!');
  process.exit(1);
}
pf = pf.replace(targetPreviewFooters, replPreviewFooters);
console.log('✓ preview footers local calculation updated.');

// 12. Update cardHtml Model C footer render
const targetCardHtmlFooter = `          <!-- Dua Baris Strip Footer Horizontal di Bagian Bawah Kartu -->
          \${(Boolean(footerText) || isCountdownActive || Boolean(footer2Text)) ? \`
            <div class="w-full shrink-0 mt-auto flex flex-col">
              <!-- Footer 1 (Atas): Jaminan Kecepatan / Garansi -->
              \${Boolean(footerText) ? \`
                <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 tracking-wide shrink-0 \${(isCountdownActive || Boolean(footer2Text)) ? 'border-b border-black/10' : 'rounded-b-2xl'}" style="background-color: \${footerBgColor}; color: \${footerTextColor};">
                  \${(footerIcon && footerIcon !== 'none') ? \`<i data-lucide="\${escapeHtml(footerIcon)}" class="w-3.5 h-3.5 shrink-0"></i>\` : ''}
                  <span class="truncate">\${escapeHtml(footerText)}</span>
                </div>
              \` : ''}

              <!-- Footer 2 (Bawah): Otomatis Jadi Countdown saat Diskon Aktif, atau Info Paket saat Diskon Off -->
              \${(isCountdownActive || Boolean(footer2Text)) ? (
                isCountdownActive ? \`
                  <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 rounded-b-2xl tracking-wide shrink-0" style="background-color: \${countdownBgColor}; color: \${countdownTextColor};">
                    <i data-lucide="ticket-percent" class="w-3.5 h-3.5 shrink-0" style="color: \${countdownIconColor};"></i>
                    <span class="truncate">% Diskon Rp1,700RB berakhir Dalam 1Jam</span>
                  </div>
                \` : \`
                  <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 rounded-b-2xl tracking-wide shrink-0" style="background-color: \${footer2BgColor}; color: \${footer2TextColor};">
                    \${(footer2Icon && footer2Icon !== 'none') ? \`<i data-lucide="\${escapeHtml(footer2Icon)}" class="w-3.5 h-3.5 shrink-0"></i>\` : ''}
                    <span class="truncate">\${escapeHtml(footer2Text)}</span>
                  </div>
                \`
              ) : ''}
            </div>
          \` : ''}`;

const replCardHtmlFooter = `          <!-- Dua Baris Strip Footer Horizontal di Bagian Bawah Kartu -->
          \${(hasFooter1 || hasFooter2) ? \`
            <div class="w-full shrink-0 mt-auto flex flex-col">
              <!-- Footer 1 (Atas): Jaminan Kecepatan / Garansi -->
              \${hasFooter1 ? \`
                <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 tracking-wide shrink-0 \${hasFooter2 ? 'border-b border-black/10' : 'rounded-b-2xl'}" style="background-color: \${footerBgColor}; color: \${footerTextColor};">
                  \${(footerIcon && footerIcon !== 'none') ? \`<i data-lucide="\${escapeHtml(footerIcon)}" class="w-3.5 h-3.5 shrink-0"></i>\` : ''}
                  <span class="truncate">\${escapeHtml(previewF1Text)}</span>
                </div>
              \` : ''}

              <!-- Footer 2 (Bawah): Otomatis Jadi Countdown saat Diskon Aktif, atau Info Paket saat Diskon Off -->
              \${hasFooter2 ? (
                isCountdownActive ? \`
                  <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 rounded-b-2xl tracking-wide shrink-0" style="background-color: \${countdownBgColor}; color: \${countdownTextColor};">
                    <i data-lucide="ticket-percent" class="w-3.5 h-3.5 shrink-0" style="color: \${countdownIconColor};"></i>
                    <span class="truncate">% Diskon Rp1,700RB berakhir Dalam 1Jam</span>
                  </div>
                \` : \`
                  <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 rounded-b-2xl tracking-wide shrink-0" style="background-color: \${footer2BgColor}; color: \${footer2TextColor};">
                    \${(footer2Icon && footer2Icon !== 'none') ? \`<i data-lucide="\${escapeHtml(footer2Icon)}" class="w-3.5 h-3.5 shrink-0"></i>\` : ''}
                    <span class="truncate">\${escapeHtml(previewF2Text)}</span>
                  </div>
                \`
              ) : ''}
            </div>
          \` : ''}`;

if (!pf.includes(targetCardHtmlFooter)) {
  console.error('Target cardHtml footer not found!');
  process.exit(1);
}
pf = pf.replace(targetCardHtmlFooter, replCardHtmlFooter);
console.log('✓ cardHtml Model C footer render updated.');

// 13. Update sample badge visibility in updateProductCardLivePreview
const targetBadgeControl = `    // Kontrol Visibilitas Badge "Data contoh"
    const sampleBadgeDesk = document.getElementById('preview-sample-data-badge');
    const sampleBadgeMob = document.getElementById('preview-sample-data-badge-mob');
    if (isSampleData) {
      if (sampleBadgeDesk) sampleBadgeDesk.classList.remove('hidden');
      if (sampleBadgeMob) sampleBadgeMob.classList.remove('hidden');
    } else {
      if (sampleBadgeDesk) sampleBadgeDesk.classList.add('hidden');
      if (sampleBadgeMob) sampleBadgeMob.classList.add('hidden');
    }`;

const replBadgeControl = `    // Kontrol Visibilitas Badge "Data contoh"
    const sampleBadgeDesk = document.getElementById('preview-sample-data-badge');
    const sampleBadgeMob = document.getElementById('preview-sample-data-badge-mob');
    if (isSampleData) {
      if (sampleBadgeDesk) sampleBadgeDesk.classList.remove('hidden');
      if (sampleBadgeMob) sampleBadgeMob.classList.remove('hidden');
    } else {
      if (sampleBadgeDesk) sampleBadgeDesk.classList.add('hidden');
      if (sampleBadgeMob) sampleBadgeMob.classList.add('hidden');
    }

    // Kontrol Badge Penanda Footer Contoh (Task SC-ADMIN-FOOTER-COMBOBOX-PREVIEW-12C)
    const badgeFooterDesk = document.getElementById('preview-footer-sample-badge');
    const badgeFooterMob = document.getElementById('preview-footer-sample-badge-mob');
    if (hasSampleFooter) {
      if (badgeFooterDesk) badgeFooterDesk.classList.remove('hidden');
      if (badgeFooterMob) badgeFooterMob.classList.remove('hidden');
    } else {
      if (badgeFooterDesk) badgeFooterDesk.classList.add('hidden');
      if (badgeFooterMob) badgeFooterMob.classList.add('hidden');
    }`;

if (!pf.includes(targetBadgeControl)) {
  console.error('Target badge control not found!');
  process.exit(1);
}
pf = pf.replace(targetBadgeControl, replBadgeControl);
console.log('✓ preview-footer-sample-badge control updated.');

// 14. Remove duplicate datalist in Step 2 (around line 15589)
const targetDupDatalist = `              <!-- Native HTML5 Datalist untuk Teks Footer Model C (Persis Gambar 2) -->
              <datalist id="footer-texts-history-list">
                <option value="Proses Hanya Dalam 1Jam"></option>
                <option value="Variasi Paket Tersedia"></option>
                <option value="Garansi Kualitas 100%"></option>
                <option value="Bisa Cetak Satuan"></option>
                <option value="Kirim Cepat Hari Ini"></option>
                <option value="Desain Custom Tersedia"></option>
                <option value="Siap Pakai & Praktis"></option>
                \${(typeof DB !== 'undefined' && typeof DB.getFooterTextsHistory === 'function') ? (DB.getFooterTextsHistory() || []).map(txt => \`<option value="\${escapeHtml(txt)}"></option>\`).join('') : ''}
              </datalist>`;

if (pf.includes(targetDupDatalist)) {
  pf = pf.replace(targetDupDatalist, '');
  console.log('✓ Duplicate datalist in Step 2 removed.');
} else {
  console.log('Note: Duplicate datalist in Step 2 not matched or already absent.');
}

fs.writeFileSync('js/product-form.js', pf, 'utf8');
console.log('=== All 12C changes successfully written to js/product-form.js! ===');
