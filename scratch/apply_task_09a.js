const fs = require('fs');

console.log('Reading files...');
let pf = fs.readFileSync('js/product-form.js', 'utf8');
let adminCss = fs.readFileSync('css/admin.css', 'utf8');

// 1. Scoped CSS in css/admin.css
const cssRule = `
/* Scoped Typography for Card Customization Section (Task SC-ADMIN-CARD-EDITOR-GROUPING-09A) */
#card-customization-section,
#card-customization-section button,
#card-customization-section label,
#card-customization-section input,
#card-customization-section select,
#card-customization-section span,
#card-customization-section p,
#card-customization-section .card-accordion-trigger,
#card-customization-section-mob,
#card-customization-section-mob button,
#card-customization-section-mob label,
#card-customization-section-mob input,
#card-customization-section-mob select,
#card-customization-section-mob span,
#card-customization-section-mob p,
#card-customization-section-mob .card-accordion-trigger {
  font-weight: 400 !important;
}
`;

if (!adminCss.includes('SC-ADMIN-CARD-EDITOR-GROUPING-09A')) {
  adminCss += cssRule;
  fs.writeFileSync('css/admin.css', adminCss, 'utf8');
  console.log('✓ css/admin.css updated with scoped typography rule');
} else {
  console.log('css/admin.css already has rule');
}

// 2. Desktop Accordion Section replacement in js/product-form.js
const targetDeskStart = '            <!-- Visual Customization Controls: Accordion Editor (Step 1 Only) -->\n            <div id="card-customization-section"';
const targetDeskEnd = '              </div>\n            </div>\n          </div>\n\n\n\n\n\n        </aside>';

const idxDeskStart = pf.indexOf(targetDeskStart);
const idxDeskEnd = pf.indexOf(targetDeskEnd);
if (idxDeskStart === -1 || idxDeskEnd === -1) {
  console.error('ERROR: Could not find desktop section targets!', { idxDeskStart, idxDeskEnd });
  process.exit(1);
}

const newDeskSection = `            <!-- Visual Customization Controls: Accordion Editor (Step 1 Only) -->
            <div id="card-customization-section" class="hidden w-full max-w-[260px] mx-auto p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-3">
              <!-- Accordion Groups Container -->
              <div class="space-y-2">
                <!-- Kelompok 1: Bingkai Kartu -->
                <div id="accordion-group-frame" class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button type="button" id="btn-accordion-frame" aria-expanded="true" aria-controls="accordion-body-frame" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="frame">
                    <span class="flex items-center gap-1.5 text-xs font-normal text-slate-800">
                      <i class="bi bi-bounding-box text-emerald-600"></i>
                      <span>Bingkai Kartu</span>
                    </span>
                    <i id="accordion-icon-frame" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200 rotate-180"></i>
                  </button>
                  <div id="accordion-body-frame" class="p-3 border-t border-slate-100 space-y-2.5" role="region" aria-labelledby="btn-accordion-frame">
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Latar Belakang</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-bg-color" value="#ffffff" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-bg-text" value="#ffffff" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Border</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-border-color" value="#e2e8f0" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-border-text" value="#e2e8f0" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div class="col-span-2">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Radius Sudut</label>
                        <select id="cfg-border-radius" class="w-full px-1.5 py-1 text-[11px] font-normal border border-slate-200 rounded outline-none bg-white">
                          <option value="0px">0px (Kotak)</option>
                          <option value="8px">8px (Kecil)</option>
                          <option value="16px">16px (Sedang)</option>
                          <option value="24px">24px (Besar)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Kelompok 2: Teks & Informasi -->
                <div id="accordion-group-text-info" class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button type="button" id="btn-accordion-text-info" aria-expanded="false" aria-controls="accordion-body-text-info" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="text-info">
                    <span class="flex items-center gap-1.5 text-xs font-normal text-slate-800">
                      <i class="bi bi-fonts text-emerald-600"></i>
                      <span>Teks &amp; Informasi</span>
                    </span>
                    <i id="accordion-icon-text-info" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-text-info" class="hidden p-3 border-t border-slate-100 space-y-3" role="region" aria-labelledby="btn-accordion-text-info">
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Judul</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-title-color" value="#0f172a" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-title-text" value="#0f172a" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Harga</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-price-color" value="\${getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-price-text" value="\${getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div class="col-span-2">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Tombol Beli</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-btn-color" value="\${getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-btn-text" value="\${getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                    </div>
                    <div class="pt-2 border-t border-slate-100 divide-y divide-slate-100">
                      <!-- Rating -->
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-star-fill text-amber-400 text-[11px]"></i>
                          <span>Rating</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-show-rating" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-show-rating-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-show-rating-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                      <!-- Terjual -->
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-bag-check text-slate-400 text-[11px]"></i>
                          <span>Terjual</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-show-sales" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-show-sales-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-show-sales-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Kelompok 3: Label Khusus -->
                <div id="accordion-group-badge" class="border border-slate-200 rounded-lg overflow-hidden bg-white \${primaryState.card_variant === 'B' ? 'hidden' : ''}">
                  <button type="button" id="btn-accordion-badge" aria-expanded="false" aria-controls="accordion-body-badge" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="badge">
                    <span class="flex items-center gap-1.5 text-xs font-normal text-slate-800">
                      <i class="bi bi-bookmark-star text-emerald-600"></i>
                      <span>Label Khusus</span>
                    </span>
                    <i id="accordion-icon-badge" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-badge" class="hidden p-2.5 border-t border-slate-100" role="region" aria-labelledby="btn-accordion-badge">
                    <div id="cfg-badge-container-desk">
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-bookmark-star text-slate-400 text-[11px]"></i>
                          <span>Label Khusus</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-show-badge" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-show-badge-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-show-badge-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Kelompok 4: Promo & Diskon -->
                <div id="accordion-group-promo" class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button type="button" id="btn-accordion-promo" aria-expanded="false" aria-controls="accordion-body-promo" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="promo">
                    <span class="flex items-center gap-1.5 text-xs font-normal text-slate-800">
                      <i class="bi bi-tag text-emerald-600"></i>
                      <span>Promo &amp; Diskon</span>
                    </span>
                    <i id="accordion-icon-promo" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-promo" class="hidden p-3 border-t border-slate-100 space-y-3" role="region" aria-labelledby="btn-accordion-promo">
                    <!-- Toggles: Harga Coret, Diskon Foto, Ikon Tiket -->
                    <div class="divide-y divide-slate-100">
                      <!-- Harga Coret -->
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-tag text-slate-400 text-[11px]"></i>
                          <span>Harga Coret</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-show-strike" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-show-strike-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-show-strike-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                      <!-- Diskon Foto -->
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-percent text-slate-400 text-[11px]"></i>
                          <span>Diskon Foto</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-show-discount-badge" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-show-discount-badge-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-show-discount-badge-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                      <!-- Ikon Tiket -->
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-ticket-perforated text-slate-400 text-[11px]"></i>
                          <span>Ikon Tiket</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-show-ticket-icon" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-show-ticket-icon-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-show-ticket-icon-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                    </div>

                    <!-- Countdown Controls Sub-block -->
                    <div class="pt-2.5 border-t border-slate-100 space-y-2.5">
                      <!-- Aktifkan Countdown -->
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal border border-slate-100">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-alarm text-slate-400 text-[11px]"></i>
                          <span>Aktifkan Countdown</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-enable-countdown" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-enable-countdown-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-enable-countdown-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>

                      <!-- Styling Countdown Tokens -->
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Latar Belakang</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-countdown-bg-color" value="\${primaryState.countdown_bg_color || getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-countdown-bg-hex" value="\${primaryState.countdown_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-countdown-text-color" value="\${primaryState.countdown_text_color || '#ffffff'}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-countdown-text-hex" value="\${primaryState.countdown_text_color || '#ffffff'}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Ikon</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-countdown-icon-color" value="\${primaryState.countdown_icon_color || '#ffffff'}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-countdown-icon-hex" value="\${primaryState.countdown_icon_color || '#ffffff'}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Border</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-countdown-border-color" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-countdown-border-hex" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div class="col-span-2">
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Radius Sudut</label>
                          <select id="cfg-countdown-radius" class="w-full px-1.5 py-1 text-[11px] font-normal border border-slate-200 rounded outline-none bg-white">
                            <option value="0px">0px (Kotak)</option>
                            <option value="4px">4px (Kecil)</option>
                            <option value="8px">8px (Sedang)</option>
                            <option value="12px">12px (Besar)</option>
                            <option value="9999px">9999px (Pill / Bulat)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Kelompok 5: Footer Kartu (Hanya Model C) -->
                <div id="accordion-group-footer" class="border border-slate-200 rounded-lg overflow-hidden bg-white \${primaryState.card_variant === 'C' ? '' : 'hidden'}">
                  <button type="button" id="btn-accordion-footer" aria-expanded="false" aria-controls="accordion-body-footer" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="footer">
                    <span class="flex items-center gap-1.5 text-xs font-normal text-slate-800">
                      <i class="bi bi-layers text-emerald-600"></i>
                      <span>Footer Kartu</span>
                      <span class="text-[9px] font-normal px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-mono ml-1">Detail</span>
                    </span>
                    <i id="accordion-icon-footer" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-footer" class="hidden p-3 border-t border-slate-100 space-y-2.5" role="region" aria-labelledby="btn-accordion-footer">
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
                  </div>
                </div>
              </div>

              <!-- Pinned Footer Section (Di Bawah Accordion) -->
              <div class="pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                <!-- Tombol Gunakan Desain Bawaan -->
                <button type="button" id="btn-apply-default-card-design" class="w-full py-1.5 px-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-normal transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98" title="Terapkan konfigurasi desain bawaan untuk model kartu ini">
                  <i class="bi bi-arrow-counterclockwise text-slate-500"></i>
                  <span>Gunakan Desain Bawaan</span>
                </button>

                <!-- Checkbox Gunakan Sebagai Default ([Nama Kartu]) -->
                <label class="flex items-center gap-2 text-[11px] font-normal text-emerald-800 cursor-pointer select-none">
                  <input type="checkbox" id="cfg-save-as-default-toggle" class="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer" />
                  <span id="label-save-as-default-desk">Gunakan Sebagai Default (\${primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik')})</span>
                </label>

                <!-- Tombol Batal & Simpan Perubahan -->
                <div class="flex items-center gap-2 w-full pt-0.5">
                  <button type="button" id="btn-cancel-card-design" class="w-1/3 py-2 px-2.5 border border-slate-300 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-normal transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-98" title="Batalkan perubahan desain ke kondisi awal sesi">
                    <span>Batal</span>
                  </button>
                  <button type="button" id="btn-save-card-design" class="btn-primary-brand flex-1 py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-normal transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-98">
                    <i class="bi bi-check-lg"></i>
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            </div>`;

const deskSliceEnd = idxDeskEnd + '              </div>\n            </div>'.length;
pf = pf.slice(0, idxDeskStart) + newDeskSection + pf.slice(deskSliceEnd);
console.log('✓ Desktop section replaced');

// 3. Mobile Accordion Section replacement in js/product-form.js
const targetMobStart = '            <!-- Panel Kustomisasi Desain Mobile: Accordion Editor (Step 1 Only) -->\n            <div id="card-customization-section-mob"';
const targetMobEnd = '              </div>\n            </div>\n          </div>\n\n\n\n\n\n        </div>';

const idxMobStart = pf.indexOf(targetMobStart);
const idxMobEnd = pf.indexOf(targetMobEnd);
if (idxMobStart === -1 || idxMobEnd === -1) {
  console.error('ERROR: Could not find mobile section targets!', { idxMobStart, idxMobEnd });
  process.exit(1);
}

const newMobSection = `            <!-- Panel Kustomisasi Desain Mobile: Accordion Editor (Step 1 Only) -->
            <div id="card-customization-section-mob" class="hidden w-full max-w-[260px] p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-3">
              <!-- Accordion Groups Container Mobile -->
              <div class="space-y-2">
                <!-- Kelompok 1: Bingkai Kartu Mobile -->
                <div id="accordion-group-frame-mob" class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button type="button" id="btn-accordion-frame-mob" aria-expanded="true" aria-controls="accordion-body-frame-mob" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="frame">
                    <span class="flex items-center gap-1.5 text-xs font-normal text-slate-800">
                      <i class="bi bi-bounding-box text-emerald-600"></i>
                      <span>Bingkai Kartu</span>
                    </span>
                    <i id="accordion-icon-frame-mob" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200 rotate-180"></i>
                  </button>
                  <div id="accordion-body-frame-mob" class="p-3 border-t border-slate-100 space-y-2.5" role="region" aria-labelledby="btn-accordion-frame-mob">
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Latar Belakang</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-bg-color-mob" value="#ffffff" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-bg-text-mob" value="#ffffff" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Border</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-border-color-mob" value="#e2e8f0" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-border-text-mob" value="#e2e8f0" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div class="col-span-2">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Radius Sudut</label>
                        <select id="cfg-border-radius-mob" class="w-full px-1.5 py-1 text-[11px] font-normal border border-slate-200 rounded outline-none bg-white">
                          <option value="0px">0px (Kotak)</option>
                          <option value="8px">8px (Kecil)</option>
                          <option value="16px">16px (Sedang)</option>
                          <option value="24px">24px (Besar)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Kelompok 2: Teks & Informasi Mobile -->
                <div id="accordion-group-text-info-mob" class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button type="button" id="btn-accordion-text-info-mob" aria-expanded="false" aria-controls="accordion-body-text-info-mob" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="text-info">
                    <span class="flex items-center gap-1.5 text-xs font-normal text-slate-800">
                      <i class="bi bi-fonts text-emerald-600"></i>
                      <span>Teks &amp; Informasi</span>
                    </span>
                    <i id="accordion-icon-text-info-mob" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-text-info-mob" class="hidden p-3 border-t border-slate-100 space-y-3" role="region" aria-labelledby="btn-accordion-text-info-mob">
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Judul</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-title-color-mob" value="#0f172a" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-title-text-mob" value="#0f172a" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Harga</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-price-color-mob" value="\${getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-price-text-mob" value="\${getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div class="col-span-2">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Tombol Beli</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-btn-color-mob" value="\${getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-btn-text-mob" value="\${getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                    </div>
                    <div class="pt-2 border-t border-slate-100 divide-y divide-slate-100">
                      <!-- Rating -->
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-star-fill text-amber-400 text-[11px]"></i>
                          <span>Rating</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-show-rating-mob" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-show-rating-mob-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-show-rating-mob-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                      <!-- Terjual -->
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-bag-check text-slate-400 text-[11px]"></i>
                          <span>Terjual</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-show-sales-mob" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-show-sales-mob-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-show-sales-mob-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Kelompok 3: Label Khusus Mobile -->
                <div id="accordion-group-badge-mob" class="border border-slate-200 rounded-lg overflow-hidden bg-white \${primaryState.card_variant === 'B' ? 'hidden' : ''}">
                  <button type="button" id="btn-accordion-badge-mob" aria-expanded="false" aria-controls="accordion-body-badge-mob" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="badge">
                    <span class="flex items-center gap-1.5 text-xs font-normal text-slate-800">
                      <i class="bi bi-bookmark-star text-emerald-600"></i>
                      <span>Label Khusus</span>
                    </span>
                    <i id="accordion-icon-badge-mob" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-badge-mob" class="hidden p-2.5 border-t border-slate-100" role="region" aria-labelledby="btn-accordion-badge-mob">
                    <div id="cfg-badge-container-mob">
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-bookmark-star text-slate-400 text-[11px]"></i>
                          <span>Label Khusus</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-show-badge-mob" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-show-badge-mob-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-show-badge-mob-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Kelompok 4: Promo & Diskon Mobile -->
                <div id="accordion-group-promo-mob" class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button type="button" id="btn-accordion-promo-mob" aria-expanded="false" aria-controls="accordion-body-promo-mob" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="promo">
                    <span class="flex items-center gap-1.5 text-xs font-normal text-slate-800">
                      <i class="bi bi-tag text-emerald-600"></i>
                      <span>Promo &amp; Diskon</span>
                    </span>
                    <i id="accordion-icon-promo-mob" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-promo-mob" class="hidden p-3 border-t border-slate-100 space-y-3" role="region" aria-labelledby="btn-accordion-promo-mob">
                    <!-- Toggles: Harga Coret, Diskon Foto, Ikon Tiket -->
                    <div class="divide-y divide-slate-100">
                      <!-- Harga Coret -->
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-tag text-slate-400 text-[11px]"></i>
                          <span>Harga Coret</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-show-strike-mob" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-show-strike-mob-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-show-strike-mob-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                      <!-- Diskon Foto -->
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-percent text-slate-400 text-[11px]"></i>
                          <span>Diskon Foto</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-show-discount-badge-mob" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-show-discount-badge-mob-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-show-discount-badge-mob-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                      <!-- Ikon Tiket -->
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-ticket-perforated text-slate-400 text-[11px]"></i>
                          <span>Ikon Tiket</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-show-ticket-icon-mob" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-show-ticket-icon-mob-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-show-ticket-icon-mob-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                    </div>

                    <!-- Countdown Controls Sub-block -->
                    <div class="pt-2.5 border-t border-slate-100 space-y-2.5">
                      <!-- Aktifkan Countdown -->
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal border border-slate-100">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-alarm text-slate-400 text-[11px]"></i>
                          <span>Aktifkan Countdown</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-enable-countdown-mob" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-enable-countdown-mob-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-enable-countdown-mob-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>

                      <!-- Styling Countdown Tokens -->
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Latar Belakang</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-countdown-bg-color-mob" value="\${primaryState.countdown_bg_color || getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-countdown-bg-hex-mob" value="\${primaryState.countdown_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-countdown-text-color-mob" value="\${primaryState.countdown_text_color || '#ffffff'}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-countdown-text-hex-mob" value="\${primaryState.countdown_text_color || '#ffffff'}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Ikon</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-countdown-icon-color-mob" value="\${primaryState.countdown_icon_color || '#ffffff'}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-countdown-icon-hex-mob" value="\${primaryState.countdown_icon_color || '#ffffff'}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Border</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-countdown-border-color-mob" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-countdown-border-hex-mob" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div class="col-span-2">
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Radius Sudut</label>
                          <select id="cfg-countdown-radius-mob" class="w-full px-1.5 py-1 text-[11px] font-normal border border-slate-200 rounded outline-none bg-white">
                            <option value="0px">0px (Kotak)</option>
                            <option value="4px">4px (Kecil)</option>
                            <option value="8px">8px (Sedang)</option>
                            <option value="12px">12px (Besar)</option>
                            <option value="9999px">9999px (Pill / Bulat)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Kelompok 5: Footer Kartu Mobile (Hanya Model C) -->
                <div id="accordion-group-footer-mob" class="border border-slate-200 rounded-lg overflow-hidden bg-white \${primaryState.card_variant === 'C' ? '' : 'hidden'}">
                  <button type="button" id="btn-accordion-footer-mob" aria-expanded="false" aria-controls="accordion-body-footer-mob" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="footer">
                    <span class="flex items-center gap-1.5 text-xs font-normal text-slate-800">
                      <i class="bi bi-layers text-emerald-600"></i>
                      <span>Footer Kartu</span>
                      <span class="text-[9px] font-normal px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-mono ml-1">Detail</span>
                    </span>
                    <i id="accordion-icon-footer-mob" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-footer-mob" class="hidden p-3 border-t border-slate-100 space-y-2.5" role="region" aria-labelledby="btn-accordion-footer-mob">
                    <!-- Strip 1 -->
                    <div class="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div class="text-[10px] font-normal text-slate-700 flex items-center gap-1">
                        <i data-lucide="panel-bottom" class="w-3 h-3 text-[var(--color-primary)]"></i> Strip 1 (Atas)
                      </div>
                      <div>
                        <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Teks Footer 1</label>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" value="\${escapeHtml(primaryState.card_footer_text || 'Proses Hanya Dalam 1Jam')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Latar Footer 1</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-bg-color-mob" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-bg-hex-mob" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks 1</label>
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
                        <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Teks Footer 2</label>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-2-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" value="\${escapeHtml(primaryState.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-normal" />
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Latar Footer 2</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-2-bg-color-mob" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-2-bg-hex-mob" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks 2</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-2-text-color-mob" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-2-text-hex-mob" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono font-normal border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pinned Footer Section Mobile (Di Bawah Accordion) -->
              <div class="pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                <!-- Tombol Gunakan Desain Bawaan Mobile -->
                <button type="button" id="btn-apply-default-card-design-mob" class="w-full py-1.5 px-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-normal transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98" title="Terapkan konfigurasi desain bawaan untuk model kartu ini">
                  <i class="bi bi-arrow-counterclockwise text-slate-500"></i>
                  <span>Gunakan Desain Bawaan</span>
                </button>

                <!-- Checkbox Gunakan Sebagai Default Mobile -->
                <label class="flex items-center gap-2 text-[11px] font-normal text-emerald-800 cursor-pointer select-none">
                  <input type="checkbox" id="cfg-save-as-default-toggle-mob" class="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer" />
                  <span id="label-save-as-default-mob">Gunakan Sebagai Default (\${primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik')})</span>
                </label>

                <!-- Tombol Batal & Simpan Perubahan Mobile -->
                <div class="flex items-center gap-2 w-full pt-0.5">
                  <button type="button" id="btn-cancel-card-design-mob" class="w-1/3 py-2 px-2.5 border border-slate-300 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-normal transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-98" title="Batalkan perubahan desain ke kondisi awal sesi">
                    <span>Batal</span>
                  </button>
                  <button type="button" id="btn-save-card-design-mob" class="btn-primary-brand flex-1 py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-normal transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-98">
                    <i class="bi bi-check-lg"></i>
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            </div>`;

const mobSliceEnd = idxMobEnd + '              </div>\n            </div>'.length;
pf = pf.slice(0, idxMobStart) + newMobSection + pf.slice(mobSliceEnd);
console.log('✓ Mobile section replaced');

// 4. Update cardAccordionState and helpers
const oldAccordionHelperTarget = `  // --- ACCORDION STATE & HELPERS FOR CARD DESIGN EDITOR (STEP 1) ---
  let cardAccordionState = {
    colors: true,
    elements: false,
    footer: false,
    countdown: false
  };

  function toggleCardAccordion(groupKey) {
    if (cardAccordionState[groupKey] !== undefined) {
      cardAccordionState[groupKey] = !cardAccordionState[groupKey];
      syncCardAccordionDOM();
    }
  }

  function syncCardAccordionDOM() {
    const groups = ['colors', 'elements', 'footer', 'countdown'];
    groups.forEach(key => {
      const isOpen = Boolean(cardAccordionState[key]);
      const btnDesk = document.getElementById(\`btn-accordion-\${key}\`);
      const bodyDesk = document.getElementById(\`accordion-body-\${key}\`);
      const iconDesk = document.getElementById(\`accordion-icon-\${key}\`);
      const btnMob = document.getElementById(\`btn-accordion-\${key}-mob\`);
      const bodyMob = document.getElementById(\`accordion-body-\${key}-mob\`);
      const iconMob = document.getElementById(\`accordion-icon-\${key}-mob\`);

      [btnDesk, btnMob].forEach(b => {
        if (b) b.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      [bodyDesk, bodyMob].forEach(body => {
        if (body) {
          if (isOpen) body.classList.remove('hidden');
          else body.classList.add('hidden');
        }
      });
      [iconDesk, iconMob].forEach(icon => {
        if (icon) {
          if (isOpen) icon.classList.add('rotate-180');
          else icon.classList.remove('rotate-180');
        }
      });
    });

    const isModelC = primaryState.card_variant === 'C';
    const groupFooterDesk = document.getElementById('accordion-group-footer');
    const groupFooterMob = document.getElementById('accordion-group-footer-mob');
    if (groupFooterDesk) {
      if (isModelC) groupFooterDesk.classList.remove('hidden');
      else groupFooterDesk.classList.add('hidden');
    }
    if (groupFooterMob) {
      if (isModelC) groupFooterMob.classList.remove('hidden');
      else groupFooterMob.classList.add('hidden');
    }

    const isModelB = primaryState.card_variant === 'B';
    const badgeContainerDesk = document.getElementById('cfg-badge-container-desk');
    const badgeContainerMob = document.getElementById('cfg-badge-container-mob');
    if (badgeContainerDesk) {
      if (isModelB) badgeContainerDesk.classList.add('hidden');
      else badgeContainerDesk.classList.remove('hidden');
    }
    if (badgeContainerMob) {
      if (isModelB) badgeContainerMob.classList.remove('hidden');
      else badgeContainerMob.classList.remove('hidden');
    }

    updateSaveAsDefaultLabels();
  }`;

const newAccordionHelperReplacement = `  // --- ACCORDION STATE & HELPERS FOR CARD DESIGN EDITOR (STEP 1) ---
  let cardAccordionState = {
    frame: true,
    'text-info': false,
    badge: false,
    promo: false,
    footer: false
  };

  function toggleCardAccordion(groupKey) {
    if (groupKey) {
      cardAccordionState[groupKey] = !Boolean(cardAccordionState[groupKey]);
      syncCardAccordionDOM();
    }
  }

  function syncCardAccordionDOM() {
    const groups = ['frame', 'text-info', 'badge', 'promo', 'footer'];
    groups.forEach(key => {
      const isOpen = Boolean(cardAccordionState[key]);
      const btnDesk = document.getElementById(\`btn-accordion-\${key}\`);
      const bodyDesk = document.getElementById(\`accordion-body-\${key}\`);
      const iconDesk = document.getElementById(\`accordion-icon-\${key}\`);
      const btnMob = document.getElementById(\`btn-accordion-\${key}-mob\`);
      const bodyMob = document.getElementById(\`accordion-body-\${key}-mob\`);
      const iconMob = document.getElementById(\`accordion-icon-\${key}-mob\`);

      [btnDesk, btnMob].forEach(b => {
        if (b) b.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      [bodyDesk, bodyMob].forEach(body => {
        if (body) {
          if (isOpen) body.classList.remove('hidden');
          else body.classList.add('hidden');
        }
      });
      [iconDesk, iconMob].forEach(icon => {
        if (icon) {
          if (isOpen) icon.classList.add('rotate-180');
          else icon.classList.remove('rotate-180');
        }
      });
    });

    const isModelC = primaryState.card_variant === 'C';
    const groupFooterDesk = document.getElementById('accordion-group-footer');
    const groupFooterMob = document.getElementById('accordion-group-footer-mob');
    if (groupFooterDesk) {
      if (isModelC) groupFooterDesk.classList.remove('hidden');
      else groupFooterDesk.classList.add('hidden');
    }
    if (groupFooterMob) {
      if (isModelC) groupFooterMob.classList.remove('hidden');
      else groupFooterMob.classList.add('hidden');
    }

    const isModelB = primaryState.card_variant === 'B';
    const groupBadgeDesk = document.getElementById('accordion-group-badge');
    const groupBadgeMob = document.getElementById('accordion-group-badge-mob');
    if (groupBadgeDesk) {
      if (isModelB) groupBadgeDesk.classList.add('hidden');
      else groupBadgeDesk.classList.remove('hidden');
    }
    if (groupBadgeMob) {
      if (isModelB) groupBadgeMob.classList.add('hidden');
      else groupBadgeMob.classList.remove('hidden');
    }

    const badgeContainerDesk = document.getElementById('cfg-badge-container-desk');
    const badgeContainerMob = document.getElementById('cfg-badge-container-mob');
    if (badgeContainerDesk) {
      if (isModelB) badgeContainerDesk.classList.add('hidden');
      else badgeContainerDesk.classList.remove('hidden');
    }
    if (badgeContainerMob) {
      if (isModelB) badgeContainerMob.classList.remove('hidden');
      else badgeContainerMob.classList.remove('hidden');
    }

    updateSaveAsDefaultLabels();
  }`;

if (!pf.includes(oldAccordionHelperTarget)) {
  console.error('ERROR: Could not find oldAccordionHelperTarget!');
  process.exit(1);
}

pf = pf.replace(oldAccordionHelperTarget, newAccordionHelperReplacement);
console.log('✓ cardAccordionState and helpers replaced');

// 5. Update updateSaveAsDefaultLabels
const oldLabelFunc = `  function updateSaveAsDefaultLabels() {
    const modelName = primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik');
    const deskLbl = document.getElementById('label-save-as-default-desk');
    const mobLbl = document.getElementById('label-save-as-default-mob');
    if (deskLbl) deskLbl.textContent = \`Gunakan Tema Sebagai Default \${modelName}\`;
    if (mobLbl) mobLbl.textContent = \`Gunakan Tema Sebagai Default \${modelName}\`;
  }`;

const newLabelFunc = `  function updateSaveAsDefaultLabels() {
    const modelName = primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik');
    const deskLbl = document.getElementById('label-save-as-default-desk');
    const mobLbl = document.getElementById('label-save-as-default-mob');
    if (deskLbl) deskLbl.textContent = \`Gunakan Sebagai Default (\${modelName})\`;
    if (mobLbl) mobLbl.textContent = \`Gunakan Sebagai Default (\${modelName})\`;
  }`;

if (!pf.includes(oldLabelFunc)) {
  console.error('ERROR: Could not find oldLabelFunc!');
  process.exit(1);
}

pf = pf.replace(oldLabelFunc, newLabelFunc);
console.log('✓ updateSaveAsDefaultLabels updated');

// 6. Update variant change listener label update (around line 26247)
const oldVariantLabelTarget = `      const modelNameText = variantCode === 'B' ? 'Kartu Minimalis' : (variantCode === 'C' ? 'Kartu Detail' : 'Kartu Klasik');
      if (lblSaveDesk) lblSaveDesk.textContent = \`Gunakan Tema Sebagai Default \${modelNameText}\`;
      if (lblSaveMob) lblSaveMob.textContent = \`Gunakan Tema Sebagai Default \${modelNameText}\`;`;

const newVariantLabelReplacement = `      const modelNameText = variantCode === 'B' ? 'Kartu Minimalis' : (variantCode === 'C' ? 'Kartu Detail' : 'Kartu Klasik');
      if (lblSaveDesk) lblSaveDesk.textContent = \`Gunakan Sebagai Default (\${modelNameText})\`;
      if (lblSaveMob) lblSaveMob.textContent = \`Gunakan Sebagai Default (\${modelNameText})\`;`;

if (!pf.includes(oldVariantLabelTarget)) {
  console.error('ERROR: Could not find oldVariantLabelTarget!');
  process.exit(1);
}

pf = pf.replace(oldVariantLabelTarget, newVariantLabelReplacement);
console.log('✓ Variant change listener label updated');

// 7. Update resetFormState to reset cardAccordionState
const oldResetFormStateTarget = `    currentStep = 1;
    isPreviewTestMode = false;
    previewStep1Tab = 'preview';
    cardDesignSnapshot = null;
    cardDesignSnapshotKey = null;`;

const newResetFormStateReplacement = `    currentStep = 1;
    isPreviewTestMode = false;
    previewStep1Tab = 'preview';
    cardDesignSnapshot = null;
    cardDesignSnapshotKey = null;
    cardAccordionState = {
      frame: true,
      'text-info': false,
      badge: false,
      promo: false,
      footer: false
    };`;

pf = pf.replace(oldResetFormStateTarget, newResetFormStateReplacement);
console.log('✓ resetFormState updated');

// 8. Update variant change / custom labels notice lines (20135 and 20154)
const oldVbTarget = `        if (badgeContainerDesk) badgeContainerDesk.classList.add('hidden');
        if (badgeContainerMob) badgeContainerMob.classList.add('hidden');`;

const newVbReplacement = `        if (badgeContainerDesk) badgeContainerDesk.classList.add('hidden');
        if (badgeContainerMob) badgeContainerMob.classList.add('hidden');
        const grpBadgeDesk = document.getElementById('accordion-group-badge');
        const grpBadgeMob = document.getElementById('accordion-group-badge-mob');
        if (grpBadgeDesk) grpBadgeDesk.classList.add('hidden');
        if (grpBadgeMob) grpBadgeMob.classList.add('hidden');`;

if (!pf.includes(oldVbTarget)) {
  console.error('ERROR: Could not find oldVbTarget!');
  process.exit(1);
}

pf = pf.replace(oldVbTarget, newVbReplacement);

const oldVnonbTarget = `        if (badgeContainerDesk) badgeContainerDesk.classList.remove('hidden');
        if (badgeContainerMob) badgeContainerMob.classList.remove('hidden');`;

const newVnonbReplacement = `        if (badgeContainerDesk) badgeContainerDesk.classList.remove('hidden');
        if (badgeContainerMob) badgeContainerMob.classList.remove('hidden');
        const grpBadgeDeskNonB = document.getElementById('accordion-group-badge');
        const grpBadgeMobNonB = document.getElementById('accordion-group-badge-mob');
        if (grpBadgeDeskNonB) grpBadgeDeskNonB.classList.remove('hidden');
        if (grpBadgeMobNonB) grpBadgeMobNonB.classList.remove('hidden');`;

if (!pf.includes(oldVnonbTarget)) {
  console.error('ERROR: Could not find oldVnonbTarget!');
  process.exit(1);
}

pf = pf.replace(oldVnonbTarget, newVnonbReplacement);
console.log('✓ Variant B vs Non-B custom label toggling updated');

// Write out product-form.js
fs.writeFileSync('js/product-form.js', pf, 'utf8');
console.log('✓ js/product-form.js successfully written!');
