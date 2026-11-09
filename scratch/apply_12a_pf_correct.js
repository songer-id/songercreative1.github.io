const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');

// 1. In updateFooterCharCounter: remove font-semibold
const counterRegex = /counterEl\.classList\.add\('text-red-600',\s*'font-semibold'\);/;
if (!counterRegex.test(pf)) {
  console.error('ERROR: counterRegex not matched!');
  process.exit(1);
}
pf = pf.replace(/counterEl\.classList\.add\('text-red-600',\s*'font-semibold'\);/g, "counterEl.classList.add('text-red-600');");
pf = pf.replace(/counterEl\.classList\.remove\('text-red-600',\s*'font-semibold'\);/g, "counterEl.classList.remove('text-red-600', 'font-semibold');");
console.log('1. updateFooterCharCounter updated!');

// 2. Popover header font-semibold -> font-normal
const oldPopoverHeader = `<div class="text-[10px] font-semibold text-slate-500 mb-1.5 px-0.5 flex items-center justify-between">`;
const newPopoverHeader = `<div class="text-[10px] font-normal text-slate-500 mb-1.5 px-0.5 flex items-center justify-between">`;

let popoverCount = 0;
while (pf.includes(oldPopoverHeader)) {
  pf = pf.replace(oldPopoverHeader, newPopoverHeader);
  popoverCount++;
}
console.log(`2. Replaced ${popoverCount} popover headers with font-normal.`);

// 3. Radius controls: replace the 8 relative flex w-20 wrappers with flex items-center gap-1.5
const oldRadiusRegex = /<div class="relative flex items-center w-20">\s*<input type="number" id="([^"]+)" min="([^"]+)" max="([^"]+)" step="1" value="([^"]+)" class="w-full pl-2 pr-6 py-1 text-xs font-mono font-normal border border-slate-200 rounded-\[6px\] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" \/>\s*<span class="absolute right-2 text-\[10px\] font-normal text-slate-400 pointer-events-none select-none">px<\/span>\s*<\/div>/g;

let radiusCount = 0;
pf = pf.replace(oldRadiusRegex, (match, id, min, max, val) => {
  radiusCount++;
  return `<div class="flex items-center gap-1.5 shrink-0">
                            <input type="number" id="${id}" min="${min}" max="${max}" step="1" value="${val}" class="w-14 px-2 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-center focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                            <span class="text-[11px] font-normal text-slate-400 select-none shrink-0">px</span>
                          </div>`;
});
console.log(`3. Replaced ${radiusCount} radius input wrappers with sibling px!`);

// Helper to find matching closing div
function findMatchingClosingDiv(str, startPos) {
  let depth = 0;
  for (let i = startPos; i < str.length; i++) {
    if (str[i] === '<') {
      const match = str.slice(i).match(/^<\/?([a-zA-Z0-9_-]+)/);
      if (match) {
        const tagName = match[1].toLowerCase();
        const isClosing = str[i+1] === '/';
        if (tagName === 'div') {
          if (isClosing) {
            depth--;
            if (depth === 0) return i + 6;
          } else {
            depth++;
          }
        }
      }
    }
  }
  return -1;
}

// 4. Exact replace of Desktop Footer Body
const deskStart = pf.indexOf('<div id="accordion-body-footer"');
const deskEnd = findMatchingClosingDiv(pf, deskStart);
console.log(`Desk start: ${deskStart}, end: ${deskEnd}, length: ${deskEnd - deskStart}`);

const newDeskExact = `<div id="accordion-body-footer" class="hidden p-3 border-t border-slate-100 space-y-2.5" role="region" aria-labelledby="btn-accordion-footer">
                    <!-- Strip 1 -->
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div class="text-[10px] font-normal text-slate-700 flex items-center gap-1">
                        <i data-lucide="panel-bottom" class="w-3 h-3 text-[var(--color-primary)]"></i> Strip 1 (Atas)
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-0.5">
                          <label for="input-card-footer-text-side" class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider">Label Footer 1 *</label>
                          <span id="footer-text-char-count-side" class="text-[9px] font-mono text-slate-400 font-normal">\${getUnicodeLength(primaryState.card_footer_text)}/32</span>
                        </div>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-text-side" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Tersedia berbagai Variasi" value="\${escapeHtml(primaryState.card_footer_text || '')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>
                      </div>
                      <div class="grid grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)] gap-2">
                        <!-- Ikon Footer 1 -->
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Ikon</label>
                          <div class="relative" id="container-footer-icon-picker-side">
                            <button type="button" id="btn-footer-icon-picker-side" aria-haspopup="true" aria-expanded="false" class="w-14 h-7 px-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs font-normal text-slate-700 transition cursor-pointer select-none" title="Pilih Ikon Footer 1">
                              <span id="preview-footer-icon-side" class="flex items-center justify-center shrink-0">
                                \${(primaryState.footer_badge_icon && primaryState.footer_badge_icon !== 'none') ? \`<i data-lucide="\${escapeHtml(primaryState.footer_badge_icon)}" class="w-3.5 h-3.5"></i>\` : \`<i class="bi bi-slash-circle text-slate-400 text-xs"></i>\`}
                              </span>
                              <i class="bi bi-chevron-down text-[10px] text-slate-400 shrink-0 ml-0.5"></i>
                            </button>
                            <div id="menu-footer-icon-picker-side" class="hidden absolute left-0 top-full mt-1 z-30 w-56 max-w-[calc(100vw-3rem)] p-2 bg-white rounded-lg shadow-xl border border-slate-200" role="menu">
                              <div class="text-[10px] font-normal text-slate-500 mb-1.5 px-0.5 flex items-center justify-between">
                                <span>Pilih Ikon</span>
                                <span class="text-[9px] font-normal text-slate-400">24 ikon</span>
                              </div>
                              <div class="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-0.5" id="grid-footer-icon-picker-side">
                                \${renderFooterIconGridHtml(primaryState.footer_badge_icon || 'truck', 'footer-1-side')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="min-w-0">
                          <label for="cfg-footer-bg-hex-side" class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Latar</label>
                          <div class="flex items-center gap-1.5 min-w-0">
                            <input type="color" id="cfg-footer-bg-color-side" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0" />
                            <input type="text" id="cfg-footer-bg-hex-side" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-full min-w-0 px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div class="min-w-0">
                          <label for="cfg-footer-text-hex-side" class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks</label>
                          <div class="flex items-center gap-1.5 min-w-0">
                            <input type="color" id="cfg-footer-text-color-side" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0" />
                            <input type="text" id="cfg-footer-text-hex-side" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-full min-w-0 px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
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
                          <label for="input-card-footer-2-text-side" class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider">Label Footer 2 (Opsional)</label>
                          <span id="footer-2-text-char-count-side" class="text-[9px] font-mono text-slate-400 font-normal">\${getUnicodeLength(primaryState.card_footer_2_text)}/32</span>
                        </div>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-2-text-side" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Pengiriman Cepat" value="\${escapeHtml(primaryState.card_footer_2_text || '')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>
                      </div>
                      <div class="grid grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)] gap-2">
                        <!-- Ikon Footer 2 -->
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Ikon</label>
                          <div class="relative" id="container-footer-2-icon-picker-side">
                            <button type="button" id="btn-footer-2-icon-picker-side" aria-haspopup="true" aria-expanded="false" class="w-14 h-7 px-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs font-normal text-slate-700 transition cursor-pointer select-none" title="Pilih Ikon Footer 2">
                              <span id="preview-footer-2-icon-side" class="flex items-center justify-center shrink-0">
                                \${(primaryState.footer_2_badge_icon && primaryState.footer_2_badge_icon !== 'none') ? \`<i data-lucide="\${escapeHtml(primaryState.footer_2_badge_icon)}" class="w-3.5 h-3.5"></i>\` : \`<i class="bi bi-slash-circle text-slate-400 text-xs"></i>\`}
                              </span>
                              <i class="bi bi-chevron-down text-[10px] text-slate-400 shrink-0 ml-0.5"></i>
                            </button>
                            <div id="menu-footer-2-icon-picker-side" class="hidden absolute left-0 bottom-full mb-1 z-30 w-56 max-w-[calc(100vw-3rem)] p-2 bg-white rounded-lg shadow-xl border border-slate-200" role="menu">
                              <div class="text-[10px] font-normal text-slate-500 mb-1.5 px-0.5 flex items-center justify-between">
                                <span>Pilih Ikon</span>
                                <span class="text-[9px] font-normal text-slate-400">24 ikon</span>
                              </div>
                              <div class="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-0.5" id="grid-footer-2-icon-picker-side">
                                \${renderFooterIconGridHtml(primaryState.footer_2_badge_icon || 'minus', 'footer-2-side')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="min-w-0">
                          <label for="cfg-footer-2-bg-hex-side" class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Latar</label>
                          <div class="flex items-center gap-1.5 min-w-0">
                            <input type="color" id="cfg-footer-2-bg-color-side" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0" />
                            <input type="text" id="cfg-footer-2-bg-hex-side" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-full min-w-0 px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div class="min-w-0">
                          <label for="cfg-footer-2-text-hex-side" class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks</label>
                          <div class="flex items-center gap-1.5 min-w-0">
                            <input type="color" id="cfg-footer-2-text-color-side" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0" />
                            <input type="text" id="cfg-footer-2-text-hex-side" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-full min-w-0 px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>`;

pf = pf.slice(0, deskStart) + newDeskExact + pf.slice(deskEnd);
console.log('4. Desktop Footer Body replaced cleanly!');

// 5. Exact replace of Mobile Footer Body
const mobStart = pf.indexOf('<div id="accordion-body-footer-mob"');
const mobEnd = findMatchingClosingDiv(pf, mobStart);
console.log(`Mob start: ${mobStart}, end: ${mobEnd}, length: ${mobEnd - mobStart}`);

const newMobExact = `<div id="accordion-body-footer-mob" class="hidden p-3 border-t border-slate-100 space-y-2.5" role="region" aria-labelledby="btn-accordion-footer-mob">
                    <!-- Strip 1 -->
                    <div class="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div class="text-[10px] font-normal text-slate-700 flex items-center gap-1">
                        <i data-lucide="panel-bottom" class="w-3 h-3 text-[var(--color-primary)]"></i> Strip 1 (Atas)
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-0.5">
                          <label for="input-card-footer-text-mob" class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500">Label Footer 1 *</label>
                          <span id="footer-text-char-count-mob" class="text-[9px] font-mono text-slate-400 font-normal">\${getUnicodeLength(primaryState.card_footer_text)}/32</span>
                        </div>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Tersedia berbagai Variasi" value="\${escapeHtml(primaryState.card_footer_text || '')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>
                      </div>
                      <div class="grid grid-cols-[52px_minmax(0,1fr)_minmax(0,1fr)] max-[350px]:grid-cols-2 gap-2">
                        <!-- Ikon Footer 1 -->
                        <div class="max-[350px]:col-span-2 max-[350px]:w-[52px]">
                          <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Ikon</label>
                          <div class="relative" id="container-footer-icon-picker-mob">
                            <button type="button" id="btn-footer-icon-picker-mob" aria-haspopup="true" aria-expanded="false" class="w-[52px] h-7 px-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs font-normal text-slate-700 transition cursor-pointer select-none" title="Pilih Ikon Footer 1">
                              <span id="preview-footer-icon-mob" class="flex items-center justify-center shrink-0">
                                \${(primaryState.footer_badge_icon && primaryState.footer_badge_icon !== 'none') ? \`<i data-lucide="\${escapeHtml(primaryState.footer_badge_icon)}" class="w-3.5 h-3.5"></i>\` : \`<i class="bi bi-slash-circle text-slate-400 text-xs"></i>\`}
                              </span>
                              <i class="bi bi-chevron-down text-[10px] text-slate-400 shrink-0 ml-0.5"></i>
                            </button>
                            <div id="menu-footer-icon-picker-mob" class="hidden absolute left-0 top-full mt-1 z-30 w-56 max-w-[calc(100vw-3rem)] p-2 bg-white rounded-lg shadow-xl border border-slate-200" role="menu">
                              <div class="text-[10px] font-normal text-slate-500 mb-1.5 px-0.5 flex items-center justify-between">
                                <span>Pilih Ikon</span>
                                <span class="text-[9px] font-normal text-slate-400">24 ikon</span>
                              </div>
                              <div class="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-0.5" id="grid-footer-icon-picker-mob">
                                \${renderFooterIconGridHtml(primaryState.footer_badge_icon || 'truck', 'footer-1-mob')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="min-w-0">
                          <label for="cfg-footer-bg-hex-mob" class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Warna Latar</label>
                          <div class="flex items-center gap-1.5 min-w-0">
                            <input type="color" id="cfg-footer-bg-color-mob" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0" />
                            <input type="text" id="cfg-footer-bg-hex-mob" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-full min-w-0 px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div class="min-w-0">
                          <label for="cfg-footer-text-hex-mob" class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Warna Teks</label>
                          <div class="flex items-center gap-1.5 min-w-0">
                            <input type="color" id="cfg-footer-text-color-mob" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0" />
                            <input type="text" id="cfg-footer-text-hex-mob" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-full min-w-0 px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
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
                          <label for="input-card-footer-2-text-mob" class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500">Label Footer 2 (Opsional)</label>
                          <span id="footer-2-text-char-count-mob" class="text-[9px] font-mono text-slate-400 font-normal">\${getUnicodeLength(primaryState.card_footer_2_text)}/32</span>
                        </div>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-2-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" placeholder="Pengiriman Cepat" value="\${escapeHtml(primaryState.card_footer_2_text || '')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>
                      </div>
                      <div class="grid grid-cols-[52px_minmax(0,1fr)_minmax(0,1fr)] max-[350px]:grid-cols-2 gap-2">
                        <!-- Ikon Footer 2 -->
                        <div class="max-[350px]:col-span-2 max-[350px]:w-[52px]">
                          <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Ikon</label>
                          <div class="relative" id="container-footer-2-icon-picker-mob">
                            <button type="button" id="btn-footer-2-icon-picker-mob" aria-haspopup="true" aria-expanded="false" class="w-[52px] h-7 px-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs font-normal text-slate-700 transition cursor-pointer select-none" title="Pilih Ikon Footer 2">
                              <span id="preview-footer-2-icon-mob" class="flex items-center justify-center shrink-0">
                                \${(primaryState.footer_2_badge_icon && primaryState.footer_2_badge_icon !== 'none') ? \`<i data-lucide="\${escapeHtml(primaryState.footer_2_badge_icon)}" class="w-3.5 h-3.5"></i>\` : \`<i class="bi bi-slash-circle text-slate-400 text-xs"></i>\`}
                              </span>
                              <i class="bi bi-chevron-down text-[10px] text-slate-400 shrink-0 ml-0.5"></i>
                            </button>
                            <div id="menu-footer-2-icon-picker-mob" class="hidden absolute left-0 bottom-full mb-1 z-30 w-56 max-w-[calc(100vw-3rem)] p-2 bg-white rounded-lg shadow-xl border border-slate-200" role="menu">
                              <div class="text-[10px] font-normal text-slate-500 mb-1.5 px-0.5 flex items-center justify-between">
                                <span>Pilih Ikon</span>
                                <span class="text-[9px] font-normal text-slate-400">24 ikon</span>
                              </div>
                              <div class="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-0.5" id="grid-footer-2-icon-picker-mob">
                                \${renderFooterIconGridHtml(primaryState.footer_2_badge_icon || 'minus', 'footer-2-mob')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="min-w-0">
                          <label for="cfg-footer-2-bg-hex-mob" class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Warna Latar</label>
                          <div class="flex items-center gap-1.5 min-w-0">
                            <input type="color" id="cfg-footer-2-bg-color-mob" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0" />
                            <input type="text" id="cfg-footer-2-bg-hex-mob" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-full min-w-0 px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div class="min-w-0">
                          <label for="cfg-footer-2-text-hex-mob" class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5">Warna Teks</label>
                          <div class="flex items-center gap-1.5 min-w-0">
                            <input type="color" id="cfg-footer-2-text-color-mob" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0" />
                            <input type="text" id="cfg-footer-2-text-hex-mob" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-full min-w-0 px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>`;

pf = pf.slice(0, mobStart) + newMobExact + pf.slice(mobEnd);
console.log('5. Mobile Footer Body replaced cleanly!');

fs.writeFileSync('js/product-form.js', pf);
console.log('Successfully wrote updated js/product-form.js!');
