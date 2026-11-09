const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');

// Helper to check and replace safely
function safeReplace(name, target, replacement) {
  if (!pf.includes(target)) {
    throw new Error(`Target not found for: ${name}`);
  }
  pf = pf.replace(target, replacement);
  console.log(`Successfully replaced: ${name}`);
}

// 1. Add FOOTER_ICONS_CATALOG and helpers near top (after cardDesignSnapshot Key definitions)
const targetTop = `let cardDesignSnapshot = null;
  let cardDesignSnapshotKey = null;`;

const replTop = `let cardDesignSnapshot = null;
  let cardDesignSnapshotKey = null;

  const FOOTER_ICONS_CATALOG = [
    { id: 'none', label: 'Tanpa Ikon', icon: 'ban', category: 'Umum' },
    { id: 'truck', label: 'Pengiriman Cepat', icon: 'truck', category: 'Logistik' },
    { id: 'clock', label: 'Jam / Waktu', icon: 'clock', category: 'Waktu' },
    { id: 'zap', label: 'Kilat / Express', icon: 'zap', category: 'Layanan' },
    { id: 'shield-check', label: 'Garansi / Keamanan', icon: 'shield-check', category: 'Garansi' },
    { id: 'minus', label: 'Strip / Garis', icon: 'minus', category: 'Umum' },
    { id: 'check-circle', label: 'Centang / Selesai', icon: 'check-circle', category: 'Status' },
    { id: 'package', label: 'Paket / Kemasan', icon: 'package', category: 'Logistik' },
    { id: 'calendar', label: 'Kalender / Jadwal', icon: 'calendar', category: 'Waktu' },
    { id: 'layers', label: 'Lapisan / Varian', icon: 'layers', category: 'Produk' },
    { id: 'settings', label: 'Pengaturan / Kustom', icon: 'settings', category: 'Teknis' },
    { id: 'wrench', label: 'Alat / Reparasi', icon: 'wrench', category: 'Teknis' },
    { id: 'palette', label: 'Palet / Desain', icon: 'palette', category: 'Desain' },
    { id: 'tag', label: 'Label / Tag', icon: 'tag', category: 'Promo' },
    { id: 'badge-percent', label: 'Diskon / Hemat', icon: 'badge-percent', category: 'Promo' },
    { id: 'gift', label: 'Hadiah / Bonus', icon: 'gift', category: 'Promo' },
    { id: 'map-pin', label: 'Lokasi / Toko', icon: 'map-pin', category: 'Lokasi' },
    { id: 'leaf', label: 'Ramah Lingkungan', icon: 'leaf', category: 'Kualitas' },
    { id: 'graduation-cap', label: 'Pendidikan / Edukasi', icon: 'graduation-cap', category: 'Layanan' },
    { id: 'headphones', label: 'Audio / Layanan CS', icon: 'headphones', category: 'Layanan' },
    { id: 'sparkles', label: 'Kualitas Premium', icon: 'sparkles', category: 'Kualitas' },
    { id: 'award', label: 'Penghargaan / Terbaik', icon: 'award', category: 'Kualitas' },
    { id: 'printer', label: 'Percetakan / Cetak', icon: 'printer', category: 'Produksi' },
    { id: 'star', label: 'Bintang / Unggulan', icon: 'star', category: 'Kualitas' }
  ];

  function getUnicodeLength(str) {
    return str ? [...str].length : 0;
  }

  function renderFooterIconGridHtml(currentIconId, pickerId) {
    return FOOTER_ICONS_CATALOG.map(item => {
      const isSel = (currentIconId === item.id) || (!currentIconId && item.id === (pickerId.includes('footer-2') ? 'minus' : 'truck'));
      const iconInner = item.id === 'none'
        ? '<i class="bi bi-slash-circle text-slate-400 text-xs"></i>'
        : \`<i data-lucide="\${item.icon}" class="w-4.5 h-4.5"></i>\`;
      return \`
        <button type="button" class="btn-footer-icon-item w-8 h-8 rounded-md flex items-center justify-center transition cursor-pointer hover:bg-slate-100 \${isSel ? 'ring-2 ring-emerald-500 bg-emerald-50 text-emerald-600' : 'text-slate-600'}" data-icon-id="\${item.id}" data-picker="\${pickerId}" title="\${escapeHtml(item.label)}" role="menuitem">
          \${iconInner}
        </button>
      \`;
    }).join('');
  }

  function updateFooterCharCounter(inputEl, counterEl) {
    if (!counterEl) return;
    const val = inputEl ? inputEl.value : '';
    const len = getUnicodeLength(val);
    counterEl.textContent = \`\${len}/32\`;
    if (len > 32) {
      counterEl.classList.add('text-red-600', 'font-semibold');
      counterEl.classList.remove('text-slate-400');
      if (inputEl) {
        inputEl.classList.add('border-red-400', 'focus:border-red-500');
        inputEl.classList.remove('border-slate-200');
      }
    } else {
      counterEl.classList.remove('text-red-600', 'font-semibold');
      counterEl.classList.add('text-slate-400');
      if (inputEl) {
        inputEl.classList.remove('border-red-400', 'focus:border-red-500');
        inputEl.classList.add('border-slate-200');
      }
    }
  }`;

safeReplace('Top Helpers', targetTop, replTop);

// 2. Initial primaryState footer texts: empty string
const targetInitState = `card_footer_text: 'Proses Hanya Dalam 1Jam',
    footer_badge_icon: 'truck',
    footer_bg_color: getPrimaryThemeColor(),
    footer_text_color: '#ffffff',
    card_footer_2_text: 'Variasi Paket Tersedia/tidak tersedia',
    footer_2_badge_icon: 'minus',`;

const replInitState = `card_footer_text: '',
    footer_badge_icon: 'truck',
    footer_bg_color: getPrimaryThemeColor(),
    footer_text_color: '#ffffff',
    card_footer_2_text: '',
    footer_2_badge_icon: 'minus',`;

safeReplace('Init primaryState', targetInitState, replInitState);

// 3. getLastProductFooterConfig: default empty text
const targetLastConfig = `const f1 = p.custom_footer_1 ? { ...p.custom_footer_1 } : {
            text: p.card_footer_text || 'Proses Hanya Dalam 1Jam',
            icon: p.footer_badge_icon || 'truck',
            bg_color: p.footer_bg_color || getPrimaryThemeColor(),
            text_color: p.footer_text_color || '#ffffff'
          };
          const f2 = p.custom_footer_2 ? { ...p.custom_footer_2 } : {
            text: p.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia',
            icon: p.footer_2_badge_icon || 'minus',
            bg_color: p.footer_2_bg_color || getPrimaryThemeColor(),
            text_color: p.footer_2_text_color || '#ffffff'
          };`;

const replLastConfig = `const f1 = p.custom_footer_1 ? { ...p.custom_footer_1 } : {
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

safeReplace('getLastProductFooterConfig', targetLastConfig, replLastConfig);

// 4. resetProductFormState: default empty text
const targetResetState = `const f1Default = inheritedFooter?.f1 || {
      text: 'Proses Hanya Dalam 1Jam',
      icon: 'truck',
      bg_color: getPrimaryThemeColor(),
      text_color: '#ffffff'
    };
    const f2Default = inheritedFooter?.f2 || {
      text: 'Variasi Paket Tersedia/tidak tersedia',
      icon: 'minus',
      bg_color: getPrimaryThemeColor(),
      text_color: '#ffffff'
    };`;

const replResetState = `const f1Default = inheritedFooter?.f1 || {
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

safeReplace('resetProductFormState', targetResetState, replResetState);

// 5. loadProductForEdit: default empty text
const targetLoadEdit = `const f1Prod = prod.custom_footer_1 ? { ...prod.custom_footer_1 } : (
      (prod.card_footer_text || prod.footer_bg_color) ? {
        text: prod.card_footer_text || 'Proses Hanya Dalam 1Jam',
        icon: prod.footer_badge_icon || 'truck',
        bg_color: prod.footer_bg_color || getPrimaryThemeColor(),
        text_color: prod.footer_text_color || '#ffffff'
      } : (inheritedFooter?.f1 || {
        text: 'Proses Hanya Dalam 1Jam',
        icon: 'truck',
        bg_color: getPrimaryThemeColor(),
        text_color: '#ffffff'
      })
    );

    const f2Prod = prod.custom_footer_2 ? { ...prod.custom_footer_2 } : (
      (prod.card_footer_2_text || prod.footer_2_bg_color) ? {
        text: prod.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia',
        icon: prod.footer_2_badge_icon || 'minus',
        bg_color: prod.footer_2_bg_color || getPrimaryThemeColor(),
        text_color: prod.footer_2_text_color || '#ffffff'
      } : (inheritedFooter?.f2 || {
        text: 'Variasi Paket Tersedia/tidak tersedia',
        icon: 'minus',
        bg_color: getPrimaryThemeColor(),
        text_color: '#ffffff'
      })
    );`;

const replLoadEdit = `const f1Prod = prod.custom_footer_1 ? { ...prod.custom_footer_1 } : (
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

safeReplace('loadProductForEdit', targetLoadEdit, replLoadEdit);

// 6. Desktop Accordion Footer (#accordion-body-footer)
const targetDeskAccordion = `<div id="accordion-body-footer" class="hidden p-3 border-t border-slate-100 space-y-2.5" role="region" aria-labelledby="btn-accordion-footer">
                    <!-- Strip 1 -->
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div class="text-[10px] font-normal text-slate-700 flex items-center gap-1">
                        <i data-lucide="panel-bottom" class="w-3 h-3 text-[var(--color-primary)]"></i> Strip 1 (Atas)
                      </div>
                      <div>
                        <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Teks Footer 1</label>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-text-side" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" value="\${escapeHtml(primaryState.card_footer_text || 'Proses Hanya Dalam 1Jam')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Latar Footer 1</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-bg-color-side" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-bg-hex-side" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks 1</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-text-color-side" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-text-hex-side" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- Strip 2 -->
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div class="text-[10px] font-normal text-slate-700 flex items-center gap-1">
                        <i data-lucide="minus" class="w-3 h-3 text-[var(--color-primary)]"></i> Strip 2 (Bawah)
                      </div>
                      <div>
                        <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Teks Footer 2</label>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-2-text-side" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" value="\${escapeHtml(primaryState.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Latar Footer 2</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-2-bg-color-side" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-2-bg-hex-side" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks 2</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-2-text-color-side" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-2-text-hex-side" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>`;

const replDeskAccordion = `<div id="accordion-body-footer" class="hidden p-3 border-t border-slate-100 space-y-2.5" role="region" aria-labelledby="btn-accordion-footer">
                    <!-- Strip 1 -->
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div class="text-[10px] font-normal text-slate-700 flex items-center gap-1">
                        <i data-lucide="panel-bottom" class="w-3 h-3 text-[var(--color-primary)]"></i> Strip 1 (Atas)
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-0.5">
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider">Teks Footer 1</label>
                          <span id="footer-text-char-count-side" class="text-[9px] font-mono text-slate-400 font-normal">\${getUnicodeLength(primaryState.card_footer_text)}/32</span>
                        </div>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-text-side" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Tersedia berbagai Variasi" value="\${escapeHtml(primaryState.card_footer_text || '')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>
                      </div>
                      <div class="grid grid-cols-3 gap-2">
                        <!-- Ikon Footer 1 -->
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Ikon</label>
                          <div class="relative" id="container-footer-icon-picker-side">
                            <button type="button" id="btn-footer-icon-picker-side" aria-haspopup="true" aria-expanded="false" class="w-full h-7 px-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs font-normal text-slate-700 transition cursor-pointer select-none" title="Pilih Ikon Footer 1">
                              <span id="preview-footer-icon-side" class="flex items-center justify-center shrink-0">
                                \${(primaryState.footer_badge_icon && primaryState.footer_badge_icon !== 'none') ? \`<i data-lucide="\${escapeHtml(primaryState.footer_badge_icon)}" class="w-3.5 h-3.5"></i>\` : \`<i class="bi bi-slash-circle text-slate-400 text-xs"></i>\`}
                              </span>
                              <i class="bi bi-chevron-down text-[10px] text-slate-400 shrink-0 ml-1"></i>
                            </button>
                            <div id="menu-footer-icon-picker-side" class="hidden absolute left-0 top-full mt-1 z-30 w-56 p-2 bg-white rounded-lg shadow-xl border border-slate-200" role="menu">
                              <div class="text-[10px] font-semibold text-slate-500 mb-1.5 px-0.5 flex items-center justify-between">
                                <span>Pilih Ikon</span>
                                <span class="text-[9px] font-normal text-slate-400">24 ikon</span>
                              </div>
                              <div class="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-0.5" id="grid-footer-icon-picker-side">
                                \${renderFooterIconGridHtml(primaryState.footer_badge_icon || 'truck', 'footer-1-side')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Latar Footer 1</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-bg-color-side" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-bg-hex-side" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks 1</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-text-color-side" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-text-hex-side" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- Strip 2 -->
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div class="text-[10px] font-normal text-slate-700 flex items-center gap-1">
                        <i data-lucide="minus" class="w-3 h-3 text-[var(--color-primary)]"></i> Strip 2 (Bawah)
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-0.5">
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider">Teks Footer 2</label>
                          <span id="footer-2-text-char-count-side" class="text-[9px] font-mono text-slate-400 font-normal">\${getUnicodeLength(primaryState.card_footer_2_text)}/32</span>
                        </div>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-2-text-side" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Pengiriman Cepat" value="\${escapeHtml(primaryState.card_footer_2_text || '')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>
                      </div>
                      <div class="grid grid-cols-3 gap-2">
                        <!-- Ikon Footer 2 -->
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Ikon</label>
                          <div class="relative" id="container-footer-2-icon-picker-side">
                            <button type="button" id="btn-footer-2-icon-picker-side" aria-haspopup="true" aria-expanded="false" class="w-full h-7 px-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs font-normal text-slate-700 transition cursor-pointer select-none" title="Pilih Ikon Footer 2">
                              <span id="preview-footer-2-icon-side" class="flex items-center justify-center shrink-0">
                                \${(primaryState.footer_2_badge_icon && primaryState.footer_2_badge_icon !== 'none') ? \`<i data-lucide="\${escapeHtml(primaryState.footer_2_badge_icon)}" class="w-3.5 h-3.5"></i>\` : \`<i class="bi bi-slash-circle text-slate-400 text-xs"></i>\`}
                              </span>
                              <i class="bi bi-chevron-down text-[10px] text-slate-400 shrink-0 ml-1"></i>
                            </button>
                            <div id="menu-footer-2-icon-picker-side" class="hidden absolute left-0 bottom-full mb-1 z-30 w-56 p-2 bg-white rounded-lg shadow-xl border border-slate-200" role="menu">
                              <div class="text-[10px] font-semibold text-slate-500 mb-1.5 px-0.5 flex items-center justify-between">
                                <span>Pilih Ikon</span>
                                <span class="text-[9px] font-normal text-slate-400">24 ikon</span>
                              </div>
                              <div class="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-0.5" id="grid-footer-2-icon-picker-side">
                                \${renderFooterIconGridHtml(primaryState.footer_2_badge_icon || 'minus', 'footer-2-side')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Latar Footer 2</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-2-bg-color-side" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-2-bg-hex-side" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks 2</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-2-text-color-side" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-2-text-hex-side" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>`;

safeReplace('Desktop Accordion Footer', targetDeskAccordion, replDeskAccordion);

// 7. Mobile Accordion Footer (#accordion-body-footer-mob)
const targetMobAccordion = `<div id="accordion-body-footer-mob" class="hidden p-3 border-t border-slate-100 space-y-2.5" role="region" aria-labelledby="btn-accordion-footer-mob">
                    <!-- Strip 1 -->
                    <div class="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div class="text-[10px] font-normal text-slate-700 flex items-center gap-1">
                        <i data-lucide="panel-bottom" class="w-3 h-3 text-[var(--color-primary)]"></i> Strip 1 (Atas)
                      </div>
                      <div>
                        <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Teks Footer 1</label>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" value="\${escapeHtml(primaryState.card_footer_text || 'Proses Hanya Dalam 1Jam')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Latar Footer 1</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-bg-color-mob" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-bg-hex-mob" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Warna Teks 1</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-text-color-mob" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-text-hex-mob" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- Strip 2 -->
                    <div class="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div class="text-[10px] font-normal text-slate-700 flex items-center gap-1">
                        <i data-lucide="minus" class="w-3 h-3 text-[var(--color-primary)]"></i> Strip 2 (Bawah)
                      </div>
                      <div>
                        <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Teks Footer 2</label>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-2-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" value="\${escapeHtml(primaryState.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Latar Footer 2</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-2-bg-color-mob" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-2-bg-hex-mob" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Warna Teks 2</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-2-text-color-mob" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-2-text-hex-mob" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>`;

const replMobAccordion = `<div id="accordion-body-footer-mob" class="hidden p-3 border-t border-slate-100 space-y-2.5" role="region" aria-labelledby="btn-accordion-footer-mob">
                    <!-- Strip 1 -->
                    <div class="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div class="text-[10px] font-normal text-slate-700 flex items-center gap-1">
                        <i data-lucide="panel-bottom" class="w-3 h-3 text-[var(--color-primary)]"></i> Strip 1 (Atas)
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-0.5">
                          <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500">Teks Footer 1</label>
                          <span id="footer-text-char-count-mob" class="text-[9px] font-mono text-slate-400 font-normal">\${getUnicodeLength(primaryState.card_footer_text)}/32</span>
                        </div>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Tersedia berbagai Variasi" value="\${escapeHtml(primaryState.card_footer_text || '')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>
                      </div>
                      <div class="grid grid-cols-3 gap-2">
                        <!-- Ikon Footer 1 -->
                        <div>
                          <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Ikon</label>
                          <div class="relative" id="container-footer-icon-picker-mob">
                            <button type="button" id="btn-footer-icon-picker-mob" aria-haspopup="true" aria-expanded="false" class="w-full h-7 px-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs font-normal text-slate-700 transition cursor-pointer select-none" title="Pilih Ikon Footer 1">
                              <span id="preview-footer-icon-mob" class="flex items-center justify-center shrink-0">
                                \${(primaryState.footer_badge_icon && primaryState.footer_badge_icon !== 'none') ? \`<i data-lucide="\${escapeHtml(primaryState.footer_badge_icon)}" class="w-3.5 h-3.5"></i>\` : \`<i class="bi bi-slash-circle text-slate-400 text-xs"></i>\`}
                              </span>
                              <i class="bi bi-chevron-down text-[10px] text-slate-400 shrink-0 ml-1"></i>
                            </button>
                            <div id="menu-footer-icon-picker-mob" class="hidden absolute left-0 top-full mt-1 z-30 w-56 p-2 bg-white rounded-lg shadow-xl border border-slate-200" role="menu">
                              <div class="text-[10px] font-semibold text-slate-500 mb-1.5 px-0.5 flex items-center justify-between">
                                <span>Pilih Ikon</span>
                                <span class="text-[9px] font-normal text-slate-400">24 ikon</span>
                              </div>
                              <div class="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-0.5" id="grid-footer-icon-picker-mob">
                                \${renderFooterIconGridHtml(primaryState.footer_badge_icon || 'truck', 'footer-1-mob')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Latar Footer 1</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-bg-color-mob" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-bg-hex-mob" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Warna Teks 1</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-text-color-mob" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-text-hex-mob" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- Strip 2 -->
                    <div class="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div class="text-[10px] font-normal text-slate-700 flex items-center gap-1">
                        <i data-lucide="minus" class="w-3 h-3 text-[var(--color-primary)]"></i> Strip 2 (Bawah)
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-0.5">
                          <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500">Teks Footer 2</label>
                          <span id="footer-2-text-char-count-mob" class="text-[9px] font-mono text-slate-400 font-normal">\${getUnicodeLength(primaryState.card_footer_2_text)}/32</span>
                        </div>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-2-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Pengiriman Cepat" value="\${escapeHtml(primaryState.card_footer_2_text || '')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>
                      </div>
                      <div class="grid grid-cols-3 gap-2">
                        <!-- Ikon Footer 2 -->
                        <div>
                          <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Ikon</label>
                          <div class="relative" id="container-footer-2-icon-picker-mob">
                            <button type="button" id="btn-footer-2-icon-picker-mob" aria-haspopup="true" aria-expanded="false" class="w-full h-7 px-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs font-normal text-slate-700 transition cursor-pointer select-none" title="Pilih Ikon Footer 2">
                              <span id="preview-footer-2-icon-mob" class="flex items-center justify-center shrink-0">
                                \${(primaryState.footer_2_badge_icon && primaryState.footer_2_badge_icon !== 'none') ? \`<i data-lucide="\${escapeHtml(primaryState.footer_2_badge_icon)}" class="w-3.5 h-3.5"></i>\` : \`<i class="bi bi-slash-circle text-slate-400 text-xs"></i>\`}
                              </span>
                              <i class="bi bi-chevron-down text-[10px] text-slate-400 shrink-0 ml-1"></i>
                            </button>
                            <div id="menu-footer-2-icon-picker-mob" class="hidden absolute left-0 bottom-full mb-1 z-30 w-56 p-2 bg-white rounded-lg shadow-xl border border-slate-200" role="menu">
                              <div class="text-[10px] font-semibold text-slate-500 mb-1.5 px-0.5 flex items-center justify-between">
                                <span>Pilih Ikon</span>
                                <span class="text-[9px] font-normal text-slate-400">24 ikon</span>
                              </div>
                              <div class="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-0.5" id="grid-footer-2-icon-picker-mob">
                                \${renderFooterIconGridHtml(primaryState.footer_2_badge_icon || 'minus', 'footer-2-mob')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Latar Footer 2</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-2-bg-color-mob" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-2-bg-hex-mob" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Warna Teks 2</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-2-text-color-mob" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-2-text-hex-mob" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>`;

safeReplace('Mobile Accordion Footer', targetMobAccordion, replMobAccordion);

// 8. Live Preview Model C Renderer Extraction and Output
const targetLivePrevFooter = `const footerBgColor = document.getElementById('cfg-footer-bg-color')?.value || primaryState.footer_bg_color || defCardThemeColor;
    const footerTextColor = document.getElementById('cfg-footer-text-color')?.value || primaryState.footer_text_color || '#ffffff';
    const footerTextInput = document.getElementById('input-card-footer-text');
    const footerText = (footerTextInput?.value || primaryState.card_footer_text || 'Proses Hanya Dalam 1Jam').trim() || 'Proses Hanya Dalam 1Jam';
    const footerIconSelect = document.getElementById('select-card-footer-icon');
    const footerIcon = (footerIconSelect?.value || primaryState.footer_badge_icon || 'truck').trim() || 'truck';

    // Footer 2 Custom Styles (Khusus Card C)
    const footer2BgColor = document.getElementById('cfg-footer-2-bg-color')?.value || primaryState.footer_2_bg_color || defCardThemeColor;
    const footer2TextColor = document.getElementById('cfg-footer-2-text-color')?.value || primaryState.footer_2_text_color || '#ffffff';
    const footer2TextInput = document.getElementById('input-card-footer-2-text');
    const footer2Text = (footer2TextInput?.value || primaryState.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia').trim() || 'Variasi Paket Tersedia/tidak tersedia';
    const footer2IconSelect = document.getElementById('select-card-footer-2-icon');
    const footer2Icon = (footer2IconSelect?.value || primaryState.footer_2_badge_icon || 'minus').trim() || 'minus';`;

const replLivePrevFooter = `const footerBgColor = document.getElementById('cfg-footer-bg-color-side')?.value || document.getElementById('cfg-footer-bg-color')?.value || primaryState.footer_bg_color || defCardThemeColor;
    const footerTextColor = document.getElementById('cfg-footer-text-color-side')?.value || document.getElementById('cfg-footer-text-color')?.value || primaryState.footer_text_color || '#ffffff';
    const footerTextInput = document.getElementById('input-card-footer-text-side') || document.getElementById('input-card-footer-text');
    const footerText = (footerTextInput ? footerTextInput.value : (primaryState.card_footer_text || '')).trim();
    const footerIcon = (primaryState.footer_badge_icon || 'truck').trim();

    // Footer 2 Custom Styles (Khusus Card C)
    const footer2BgColor = document.getElementById('cfg-footer-2-bg-color-side')?.value || document.getElementById('cfg-footer-2-bg-color')?.value || primaryState.footer_2_bg_color || defCardThemeColor;
    const footer2TextColor = document.getElementById('cfg-footer-2-text-color-side')?.value || document.getElementById('cfg-footer-2-text-color')?.value || primaryState.footer_2_text_color || '#ffffff';
    const footer2TextInput = document.getElementById('input-card-footer-2-text-side') || document.getElementById('input-card-footer-2-text');
    const footer2Text = (footer2TextInput ? footer2TextInput.value : (primaryState.card_footer_2_text || '')).trim();
    const footer2Icon = (primaryState.footer_2_badge_icon || 'minus').trim();`;

safeReplace('Live Preview Footer Extraction', targetLivePrevFooter, replLivePrevFooter);

const targetLivePrevCardC = `<!-- Dua Baris Strip Footer Horizontal di Bagian Bawah Kartu -->
          <div class="w-full shrink-0 mt-auto flex flex-col">
            <!-- Footer 1 (Atas): Jaminan Kecepatan / Garansi -->
            <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 tracking-wide shrink-0 border-b border-black/10" style="background-color: \${footerBgColor}; color: \${footerTextColor};">
              <i data-lucide="\${escapeHtml(footerIcon)}" class="w-3.5 h-3.5 shrink-0"></i>
              <span class="truncate">\${escapeHtml(footerText)}</span>
            </div>

            <!-- Footer 2 (Bawah): Otomatis Jadi Countdown saat Diskon Aktif, atau Info Paket saat Diskon Off -->
            \${isCountdownActive ? \`
              <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 rounded-b-2xl tracking-wide shrink-0" style="background-color: \${countdownBgColor}; color: \${countdownTextColor};">
                <i data-lucide="ticket-percent" class="w-3.5 h-3.5 shrink-0" style="color: \${countdownIconColor};"></i>
                <span class="truncate">% Diskon Rp1,700RB berakhir Dalam 1Jam</span>
              </div>
            \` : \`
              <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 rounded-b-2xl tracking-wide shrink-0" style="background-color: \${footer2BgColor}; color: \${footer2TextColor};">
                <i data-lucide="\${escapeHtml(footer2Icon)}" class="w-3.5 h-3.5 shrink-0"></i>
                <span class="truncate">\${escapeHtml(footer2Text)}</span>
              </div>
            \`}
          </div>`;

const replLivePrevCardC = `<!-- Dua Baris Strip Footer Horizontal di Bagian Bawah Kartu -->
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

safeReplace('Live Preview Card C Template', targetLivePrevCardC, replLivePrevCardC);

// 9. syncStateFromDOM: remove hardcoded fallbacks and keep icon
const targetSyncState = `// Sync Footer Colors & Texts for Card Variant C
    const footer1Val = (document.getElementById('input-card-footer-text')?.value || primaryState.custom_footer_1?.text || primaryState.card_footer_text || 'Proses Hanya Dalam 1Jam').trim();
    const footer1IconVal = document.getElementById('select-card-footer-icon')?.value || primaryState.custom_footer_1?.icon || primaryState.footer_badge_icon || 'truck';
    const footer1BgVal = document.getElementById('cfg-footer-bg-color')?.value || primaryState.custom_footer_1?.bg_color || primaryState.footer_bg_color || getPrimaryThemeColor();
    const footer1TextColVal = document.getElementById('cfg-footer-text-color')?.value || primaryState.custom_footer_1?.text_color || primaryState.footer_text_color || '#ffffff';

    const footer2Val = (document.getElementById('input-card-footer-2-text')?.value || primaryState.custom_footer_2?.text || primaryState.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia').trim();
    const footer2IconVal = document.getElementById('select-card-footer-2-icon')?.value || primaryState.custom_footer_2?.icon || primaryState.footer_2_badge_icon || 'minus';
    const footer2BgVal = document.getElementById('cfg-footer-2-bg-color')?.value || primaryState.custom_footer_2?.bg_color || primaryState.footer_2_bg_color || getPrimaryThemeColor();
    const footer2TextColVal = document.getElementById('cfg-footer-2-text-color')?.value || primaryState.custom_footer_2?.text_color || primaryState.footer_2_text_color || '#ffffff';`;

const replSyncState = `// Sync Footer Colors & Texts for Card Variant C
    const footer1Val = (
      document.getElementById('input-card-footer-text-side')?.value !== undefined
        ? document.getElementById('input-card-footer-text-side').value
        : (document.getElementById('input-card-footer-text')?.value !== undefined
          ? document.getElementById('input-card-footer-text').value
          : (primaryState.custom_footer_1?.text !== undefined
            ? primaryState.custom_footer_1.text
            : (primaryState.card_footer_text || '')))
    ).trim();
    const footer1IconVal = (primaryState.footer_badge_icon || primaryState.custom_footer_1?.icon || 'truck').trim();
    const footer1BgVal = document.getElementById('cfg-footer-bg-color-side')?.value || document.getElementById('cfg-footer-bg-color')?.value || primaryState.custom_footer_1?.bg_color || primaryState.footer_bg_color || getPrimaryThemeColor();
    const footer1TextColVal = document.getElementById('cfg-footer-text-color-side')?.value || document.getElementById('cfg-footer-text-color')?.value || primaryState.custom_footer_1?.text_color || primaryState.footer_text_color || '#ffffff';

    const footer2Val = (
      document.getElementById('input-card-footer-2-text-side')?.value !== undefined
        ? document.getElementById('input-card-footer-2-text-side').value
        : (document.getElementById('input-card-footer-2-text')?.value !== undefined
          ? document.getElementById('input-card-footer-2-text').value
          : (primaryState.custom_footer_2?.text !== undefined
            ? primaryState.custom_footer_2.text
            : (primaryState.card_footer_2_text || '')))
    ).trim();
    const footer2IconVal = (primaryState.footer_2_badge_icon || primaryState.custom_footer_2?.icon || 'minus').trim();
    const footer2BgVal = document.getElementById('cfg-footer-2-bg-color-side')?.value || document.getElementById('cfg-footer-2-bg-color')?.value || primaryState.custom_footer_2?.bg_color || primaryState.footer_2_bg_color || getPrimaryThemeColor();
    const footer2TextColVal = document.getElementById('cfg-footer-2-text-color-side')?.value || document.getElementById('cfg-footer-2-text-color')?.value || primaryState.custom_footer_2?.text_color || primaryState.footer_2_text_color || '#ffffff';`;

safeReplace('syncStateFromDOM', targetSyncState, replSyncState);

// 10. bindCardCustomizationEvents: icon picker listeners, outside click, escape, and char counts
const targetBindEvents = `const syncF1Str = (val) => {
      [inpF1Text, inpF1TextSide, inpF1TextMob].forEach(x => { if (x) x.value = val; });
      primaryState.card_footer_text = val;
    };`;

const replBindEvents = `const syncF1Str = (val) => {
      [inpF1Text, inpF1TextSide, inpF1TextMob].forEach(x => { if (x && x.value !== val) x.value = val; });
      primaryState.card_footer_text = val;
      if (!primaryState.custom_footer_1) primaryState.custom_footer_1 = {};
      primaryState.custom_footer_1.text = val;
      updateFooterCharCounter(inpF1TextSide, document.getElementById('footer-text-char-count-side'));
      updateFooterCharCounter(inpF1TextMob, document.getElementById('footer-text-char-count-mob'));
    };`;

safeReplace('syncF1Str in bindCardCustomizationEvents', targetBindEvents, replBindEvents);

const targetBindEvents2 = `const syncF2Str = (val) => {
      [inpF2Text, inpF2TextSide, inpF2TextMob].forEach(x => { if (x) x.value = val; });
      primaryState.card_footer_2_text = val;
    };`;

const replBindEvents2 = `const syncF2Str = (val) => {
      [inpF2Text, inpF2TextSide, inpF2TextMob].forEach(x => { if (x && x.value !== val) x.value = val; });
      primaryState.card_footer_2_text = val;
      if (!primaryState.custom_footer_2) primaryState.custom_footer_2 = {};
      primaryState.custom_footer_2.text = val;
      updateFooterCharCounter(inpF2TextSide, document.getElementById('footer-2-text-char-count-side'));
      updateFooterCharCounter(inpF2TextMob, document.getElementById('footer-2-text-char-count-mob'));
    };`;

safeReplace('syncF2Str in bindCardCustomizationEvents', targetBindEvents2, replBindEvents2);

// Add Icon Picker event listeners and outside click / escape listeners in bindCardCustomizationEvents
const targetIconListeners = `if (selF1Icon) {
      selF1Icon.addEventListener('change', () => {
        syncStateFromDOM();
        updateProductCardLivePreview();
      });
    }`;

const replIconListeners = `if (selF1Icon) {
      selF1Icon.addEventListener('change', () => {
        syncStateFromDOM();
        updateProductCardLivePreview();
      });
    }

    // Helper: Select Footer Icon
    function selectFooterIcon(stripNumber, iconId) {
      const validIcon = FOOTER_ICONS_CATALOG.find(c => c.id === iconId) ? iconId : (stripNumber === 1 ? 'truck' : 'minus');
      if (stripNumber === 1) {
        primaryState.footer_badge_icon = validIcon;
        if (!primaryState.custom_footer_1) primaryState.custom_footer_1 = {};
        primaryState.custom_footer_1.icon = validIcon;

        // Update previews desktop & mobile
        ['preview-footer-icon-side', 'preview-footer-icon-mob'].forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.innerHTML = validIcon === 'none'
              ? '<i class="bi bi-slash-circle text-slate-400 text-xs"></i>'
              : \`<i data-lucide="\${escapeHtml(validIcon)}" class="w-3.5 h-3.5"></i>\`;
          }
        });

        // Update active highlight in grids
        document.querySelectorAll('.btn-footer-icon-item[data-picker^="footer-1"]').forEach(btn => {
          const isSel = btn.getAttribute('data-icon-id') === validIcon;
          btn.className = \`btn-footer-icon-item w-8 h-8 rounded-md flex items-center justify-center transition cursor-pointer hover:bg-slate-100 \${isSel ? 'ring-2 ring-emerald-500 bg-emerald-50 text-emerald-600' : 'text-slate-600'}\`;
        });

        const mSide = document.getElementById('menu-footer-icon-picker-side');
        const mMob = document.getElementById('menu-footer-icon-picker-mob');
        if (mSide) mSide.classList.add('hidden');
        if (mMob) mMob.classList.add('hidden');
      } else {
        primaryState.footer_2_badge_icon = validIcon;
        if (!primaryState.custom_footer_2) primaryState.custom_footer_2 = {};
        primaryState.custom_footer_2.icon = validIcon;

        // Update previews desktop & mobile
        ['preview-footer-2-icon-side', 'preview-footer-2-icon-mob'].forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.innerHTML = validIcon === 'none'
              ? '<i class="bi bi-slash-circle text-slate-400 text-xs"></i>'
              : \`<i data-lucide="\${escapeHtml(validIcon)}" class="w-3.5 h-3.5"></i>\`;
          }
        });

        // Update active highlight in grids
        document.querySelectorAll('.btn-footer-icon-item[data-picker^="footer-2"]').forEach(btn => {
          const isSel = btn.getAttribute('data-icon-id') === validIcon;
          btn.className = \`btn-footer-icon-item w-8 h-8 rounded-md flex items-center justify-center transition cursor-pointer hover:bg-slate-100 \${isSel ? 'ring-2 ring-emerald-500 bg-emerald-50 text-emerald-600' : 'text-slate-600'}\`;
        });

        const mSide = document.getElementById('menu-footer-2-icon-picker-side');
        const mMob = document.getElementById('menu-footer-2-icon-picker-mob');
        if (mSide) mSide.classList.add('hidden');
        if (mMob) mMob.classList.add('hidden');
      }

      if (window.lucide && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
      }

      markCardDesignAsCustom();
      syncStateFromDOM();
      updateProductCardLivePreview();
    }

    // Toggle dropdown menus
    function setupFooterIconToggle(btnId, menuId) {
      const btn = document.getElementById(btnId);
      const menu = document.getElementById(menuId);
      if (btn && menu) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isClosed = menu.classList.contains('hidden');
          // Close others
          ['menu-footer-icon-picker-side', 'menu-footer-icon-picker-mob', 'menu-footer-2-icon-picker-side', 'menu-footer-2-icon-picker-mob'].forEach(mId => {
            if (mId !== menuId) {
              const other = document.getElementById(mId);
              if (other) other.classList.add('hidden');
            }
          });
          if (isClosed) {
            menu.classList.remove('hidden');
            btn.setAttribute('aria-expanded', 'true');
            if (window.lucide && typeof lucide.createIcons === 'function') {
              lucide.createIcons();
            }
          } else {
            menu.classList.add('hidden');
            btn.setAttribute('aria-expanded', 'false');
          }
        });
      }
    }

    setupFooterIconToggle('btn-footer-icon-picker-side', 'menu-footer-icon-picker-side');
    setupFooterIconToggle('btn-footer-icon-picker-mob', 'menu-footer-icon-picker-mob');
    setupFooterIconToggle('btn-footer-2-icon-picker-side', 'menu-footer-2-icon-picker-side');
    setupFooterIconToggle('btn-footer-2-icon-picker-mob', 'menu-footer-2-icon-picker-mob');

    // Click icon items
    document.querySelectorAll('.btn-footer-icon-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pId = btn.getAttribute('data-picker');
        const iconId = btn.getAttribute('data-icon-id');
        if (pId && pId.includes('footer-2')) {
          selectFooterIcon(2, iconId);
        } else {
          selectFooterIcon(1, iconId);
        }
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      const pickers = [
        { c: '#container-footer-icon-picker-side', m: '#menu-footer-icon-picker-side' },
        { c: '#container-footer-icon-picker-mob', m: '#menu-footer-icon-picker-mob' },
        { c: '#container-footer-2-icon-picker-side', m: '#menu-footer-2-icon-picker-side' },
        { c: '#container-footer-2-icon-picker-mob', m: '#menu-footer-2-icon-picker-mob' }
      ];
      pickers.forEach(({ c, m }) => {
        if (!e.target.closest(c)) {
          const menuEl = document.querySelector(m);
          if (menuEl && !menuEl.classList.contains('hidden')) {
            menuEl.classList.add('hidden');
          }
        }
      });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        ['menu-footer-icon-picker-side', 'menu-footer-icon-picker-mob', 'menu-footer-2-icon-picker-side', 'menu-footer-2-icon-picker-mob'].forEach(mId => {
          const m = document.getElementById(mId);
          if (m && !m.classList.contains('hidden')) m.classList.add('hidden');
        });
      }
    });

    // Initial Char Counters update
    updateFooterCharCounter(inpF1TextSide, document.getElementById('footer-text-char-count-side'));
    updateFooterCharCounter(inpF1TextMob, document.getElementById('footer-text-char-count-mob'));
    updateFooterCharCounter(inpF2TextSide, document.getElementById('footer-2-text-char-count-side'));
    updateFooterCharCounter(inpF2TextMob, document.getElementById('footer-2-text-char-count-mob'));`;

safeReplace('Icon Listeners in bindCardCustomizationEvents', targetIconListeners, replIconListeners);

// 11. handleCancelCardDesign DOM update: sync icons and char counters
const targetCancelDom = `if (selF1Icon && primaryState.footer_badge_icon) selF1Icon.value = primaryState.footer_badge_icon;`;

const replCancelDom = `if (selF1Icon && primaryState.footer_badge_icon) selF1Icon.value = primaryState.footer_badge_icon;
      // Update custom icon picker previews & active states
      const f1IconVal = primaryState.footer_badge_icon || 'truck';
      ['preview-footer-icon-side', 'preview-footer-icon-mob'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.innerHTML = f1IconVal === 'none'
            ? '<i class="bi bi-slash-circle text-slate-400 text-xs"></i>'
            : \`<i data-lucide="\${escapeHtml(f1IconVal)}" class="w-3.5 h-3.5"></i>\`;
        }
      });
      document.querySelectorAll('.btn-footer-icon-item[data-picker^="footer-1"]').forEach(btn => {
        const isSel = btn.getAttribute('data-icon-id') === f1IconVal;
        btn.className = \`btn-footer-icon-item w-8 h-8 rounded-md flex items-center justify-center transition cursor-pointer hover:bg-slate-100 \${isSel ? 'ring-2 ring-emerald-500 bg-emerald-50 text-emerald-600' : 'text-slate-600'}\`;
      });
      updateFooterCharCounter(inpF1TextSide, document.getElementById('footer-text-char-count-side'));
      updateFooterCharCounter(inpF1TextMob, document.getElementById('footer-text-char-count-mob'));`;

safeReplace('handleCancelCardDesign F1 DOM update', targetCancelDom, replCancelDom);

const targetCancelDom2 = `if (selF2Icon && primaryState.footer_2_badge_icon) selF2Icon.value = primaryState.footer_2_badge_icon;`;

const replCancelDom2 = `if (selF2Icon && primaryState.footer_2_badge_icon) selF2Icon.value = primaryState.footer_2_badge_icon;
      // Update custom icon picker previews & active states
      const f2IconVal = primaryState.footer_2_badge_icon || 'minus';
      ['preview-footer-2-icon-side', 'preview-footer-2-icon-mob'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.innerHTML = f2IconVal === 'none'
            ? '<i class="bi bi-slash-circle text-slate-400 text-xs"></i>'
            : \`<i data-lucide="\${escapeHtml(f2IconVal)}" class="w-3.5 h-3.5"></i>\`;
        }
      });
      document.querySelectorAll('.btn-footer-icon-item[data-picker^="footer-2"]').forEach(btn => {
        const isSel = btn.getAttribute('data-icon-id') === f2IconVal;
        btn.className = \`btn-footer-icon-item w-8 h-8 rounded-md flex items-center justify-center transition cursor-pointer hover:bg-slate-100 \${isSel ? 'ring-2 ring-emerald-500 bg-emerald-50 text-emerald-600' : 'text-slate-600'}\`;
      });
      updateFooterCharCounter(inpF2TextSide, document.getElementById('footer-2-text-char-count-side'));
      updateFooterCharCounter(inpF2TextMob, document.getElementById('footer-2-text-char-count-mob'));`;

safeReplace('handleCancelCardDesign F2 DOM update', targetCancelDom2, replCancelDom2);

// 12. handleSaveCardDesign Validation
const targetSaveDesign = `function handleSaveCardDesign() {
    try {
      saveCardConfigInputs();`;

const replSaveDesign = `function handleSaveCardDesign() {
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
      saveCardConfigInputs();`;

safeReplace('handleSaveCardDesign Validation', targetSaveDesign, replSaveDesign);

// 13. validateForm Validation
const targetValidateForm = `function validateForm(isDraft = false) {
    syncStateFromDOM();
    const draftMode = (isDraft === true);
    const errors = [];
    let firstInvalidEl = null;

    function addError(msg, el) {
      errors.push(msg);
      if (!firstInvalidEl && el) firstInvalidEl = el;
    }`;

const replValidateForm = `function validateForm(isDraft = false) {
    syncStateFromDOM();
    const draftMode = (isDraft === true);
    const errors = [];
    let firstInvalidEl = null;

    function addError(msg, el) {
      errors.push(msg);
      if (!firstInvalidEl && el) firstInvalidEl = el;
    }

    if (!draftMode && primaryState.card_variant === 'C') {
      const f1Len = getUnicodeLength(primaryState.card_footer_text);
      const f2Len = getUnicodeLength(primaryState.card_footer_2_text);
      if (f1Len > 32) {
        addError(\`Teks Footer 1 melebihi batas 32 karakter (\${f1Len}/32). Harap persingkat teks terlebih dahulu.\`, document.getElementById('input-card-footer-text-side') || document.getElementById('input-card-footer-text'));
      }
      if (f2Len > 32) {
        addError(\`Teks Footer 2 melebihi batas 32 karakter (\${f2Len}/32). Harap persingkat teks terlebih dahulu.\`, document.getElementById('input-card-footer-2-text-side') || document.getElementById('input-card-footer-2-text'));
      }
    }`;

safeReplace('validateForm Validation', targetValidateForm, replValidateForm);

// Write changes
fs.writeFileSync('js/product-form.js', pf, 'utf8');
console.log('Successfully written updated js/product-form.js');
