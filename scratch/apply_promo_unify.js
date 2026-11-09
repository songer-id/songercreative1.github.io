const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');
const isCrlf = pf.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

function replaceExact(name, target, replacement) {
  const normTarget = target.replace(/\r\n/g, '\n').replace(/\n/g, eol);
  const normReplacement = replacement.replace(/\r\n/g, '\n').replace(/\n/g, eol);
  if (!pf.includes(normTarget)) {
    console.error(`Target not found for: ${name}`);
    process.exit(1);
  }
  pf = pf.replace(normTarget, normReplacement);
  console.log(`Replaced: ${name}`);
}

// 1. Unify desktop Promo & Diskon
const deskTarget = `                <!-- Kelompok 3: Label Khusus -->
                <div id="accordion-group-badge" class="border border-slate-200 rounded-lg overflow-hidden bg-white \${primaryState.card_variant === 'B' ? 'hidden' : ''}">
                  <button type="button" id="btn-accordion-badge" aria-expanded="false" aria-controls="accordion-body-badge" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="badge">
                    <span class="flex items-center gap-1.5 text-xs font-normal text-slate-800">
                      <i class="bi bi-bookmark-star text-emerald-600"></i>
                      <span>Label Khusus</span>
                    </span>
                    <i id="accordion-icon-badge" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-badge" class="hidden p-3 border-t border-slate-100 space-y-3" role="region" aria-labelledby="btn-accordion-badge">
                    <div id="cfg-badge-container-desk">
                      <!-- Visibilitas Label Khusus (Eye toggle) -->
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

                    <!-- Pilihan Gaya Label: Latar vs Garis Tepi (Segmented Control) -->
                    <div class="space-y-1">
                      <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Gaya Label</label>
                      <div class="grid grid-cols-2 p-0.5 bg-slate-100 rounded-md gap-0.5 select-none" id="cfg-badge-style-group">
                        <button type="button" class="btn-badge-style py-1 px-2 text-[11px] font-normal rounded-md bg-white text-slate-800 shadow-2xs transition cursor-pointer text-center" data-style="bg">Latar</button>
                        <button type="button" class="btn-badge-style py-1 px-2 text-[11px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-style="border">Garis Tepi</button>
                      </div>
                      <input type="hidden" id="cfg-badge-style" value="bg" />
                    </div>

                    <!-- Radius Sudut Label Khusus (Slider 0-12 px + Pilihan Cepat 0, 4, 6, 8, 12 px) -->
                    <div class="space-y-1.5 pt-0.5">
                      <div class="flex items-center justify-between">
                        <label for="cfg-badge-radius" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                        <span id="cfg-badge-radius-val" class="text-[11px] font-mono font-normal text-slate-700">6 px</span>
                      </div>
                      <input type="range" id="cfg-badge-radius" min="0" max="12" step="1" value="6" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                      <div class="flex items-center gap-1 pt-0.5">
                        <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                        <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                        <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="6">6 px</button>
                        <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                        <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                      </div>
                    </div>

                    <!-- Pengaturan Warna Label Khusus -->
                    <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-badge-text-color" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).text}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-badge-text-hex" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).text}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                        </div>
                      </div>
                      <div id="cfg-badge-bg-wrap">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Latar</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-badge-bg-color" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).bg}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-badge-bg-hex" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).bg}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                        </div>
                      </div>
                      <div id="cfg-badge-border-wrap" class="hidden">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Garis Tepi</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-badge-border-color" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).border}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-badge-border-hex" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).border}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                        </div>
                      </div>
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
                </div>`;

const deskReplacement = `                <!-- Kelompok 3: Promo & Diskon -->
                <div id="accordion-group-promo" class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button type="button" id="btn-accordion-promo" aria-expanded="false" aria-controls="accordion-body-promo" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="promo">
                    <span class="flex items-center gap-1.5 text-xs font-normal text-slate-800">
                      <i class="bi bi-tag text-emerald-600"></i>
                      <span>Promo &amp; Diskon</span>
                    </span>
                    <i id="accordion-icon-promo" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-promo" class="hidden p-3 border-t border-slate-100 space-y-3" role="region" aria-labelledby="btn-accordion-promo">
                    <!-- 1. Harga Coret -->
                    <div class="space-y-2 pb-2.5 border-b border-slate-100">
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
                      <!-- Panel Custom Harga Coret (Tampil jika Harga Coret TRUE) -->
                      <div id="cfg-strike-panel-desk" class="px-2 pt-1 pb-1 space-y-1.5">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Harga Coret</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-strike-color" value="#94a3b8" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-strike-hex" value="#94a3b8" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                        </div>
                      </div>
                    </div>

                    <!-- 2. Label Diskon (d/h Diskon Foto) -->
                    <div class="space-y-2 pb-2.5 border-b border-slate-100">
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-percent text-slate-400 text-[11px]"></i>
                          <span>Label Diskon</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-show-discount-badge" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-show-discount-badge-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-show-discount-badge-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                      <!-- Panel Custom Label Diskon (Tampil jika Label Diskon TRUE) -->
                      <div id="cfg-discount-badge-panel-desk" class="px-2 pt-1 pb-1 space-y-2.5">
                        <!-- Radius Sudut Label Diskon -->
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-discount-badge-radius" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <span id="cfg-discount-badge-radius-val" class="text-[11px] font-mono font-normal text-slate-700">8 px</span>
                          </div>
                          <input type="range" id="cfg-discount-badge-radius" min="0" max="12" step="1" value="8" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>
                        <!-- Posisi Label Diskon (4 Sudut Foto) -->
                        <div class="space-y-1">
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Posisi Label</label>
                          <div class="grid grid-cols-2 p-0.5 bg-slate-100 rounded-md gap-0.5 select-none" id="cfg-discount-badge-position-group">
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-pos="top-left">Kiri Atas</button>
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md bg-white text-slate-800 shadow-2xs transition cursor-pointer text-center" data-pos="top-right">Kanan Atas</button>
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-pos="bottom-left">Kiri Bawah</button>
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-pos="bottom-right">Kanan Bawah</button>
                          </div>
                          <input type="hidden" id="cfg-discount-badge-position" value="top-right" />
                        </div>
                        <!-- Warna Label Diskon -->
                        <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                          <div>
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-discount-badge-text-color" value="#ffffff" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-discount-badge-text-hex" value="#ffffff" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                          <div>
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Latar</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-discount-badge-bg-color" value="\${getPrimaryThemeColor()}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-discount-badge-bg-hex" value="\${getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 3. Ikon Tiket -->
                    <div class="py-0.5 border-b border-slate-100">
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

                    <!-- 4. Countdown -->
                    <div class="space-y-2 pb-2.5 border-b border-slate-100">
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-alarm text-slate-400 text-[11px]"></i>
                          <span>Countdown</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-enable-countdown" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-enable-countdown-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-enable-countdown-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                      <!-- Panel Custom Countdown (Tampil jika Countdown TRUE) -->
                      <div id="cfg-countdown-panel-desk" class="px-2 pt-1 pb-1 space-y-2.5">
                        <!-- Radius Sudut Countdown Slider 0-12 px + Presets 0, 4, 6, 8, 12 px -->
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-countdown-radius" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <span id="cfg-countdown-radius-val" class="text-[11px] font-mono font-normal text-slate-700">6 px</span>
                          </div>
                          <input type="range" id="cfg-countdown-radius" min="0" max="12" step="1" value="6" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>
                        <!-- Warna Countdown -->
                        <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                          <div>
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Latar Belakang</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-countdown-bg-color" value="\${primaryState.countdown_bg_color || getPrimaryThemeColor()}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-countdown-bg-hex" value="\${primaryState.countdown_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                          <div>
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-countdown-text-color" value="\${primaryState.countdown_text_color || '#ffffff'}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-countdown-text-hex" value="\${primaryState.countdown_text_color || '#ffffff'}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                          <div>
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Ikon</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-countdown-icon-color" value="\${primaryState.countdown_icon_color || '#ffffff'}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-countdown-icon-hex" value="\${primaryState.countdown_icon_color || '#ffffff'}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                          <div>
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Border</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-countdown-border-color" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-countdown-border-hex" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 5. Label Khusus (Hanya Model A & C, disembunyikan jika Model B) -->
                    <div id="cfg-badge-container-desk" class="\${primaryState.card_variant === 'B' ? 'hidden' : ''}">
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
                      <!-- Panel Custom Label Khusus (Tampil jika Label Khusus TRUE) -->
                      <div id="cfg-badge-panel-desk" class="px-2 pt-1 pb-1 space-y-3">
                        <!-- Pilihan Gaya Label: Latar vs Garis Tepi (Segmented Control) -->
                        <div class="space-y-1">
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Gaya Label</label>
                          <div class="grid grid-cols-2 p-0.5 bg-slate-100 rounded-md gap-0.5 select-none" id="cfg-badge-style-group">
                            <button type="button" class="btn-badge-style py-1 px-2 text-[11px] font-normal rounded-md bg-white text-slate-800 shadow-2xs transition cursor-pointer text-center" data-style="bg">Latar</button>
                            <button type="button" class="btn-badge-style py-1 px-2 text-[11px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-style="border">Garis Tepi</button>
                          </div>
                          <input type="hidden" id="cfg-badge-style" value="bg" />
                        </div>

                        <!-- Radius Sudut Label Khusus (Slider 0-12 px + Pilihan Cepat 0, 4, 6, 8, 12 px) -->
                        <div class="space-y-1.5 pt-0.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-badge-radius" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <span id="cfg-badge-radius-val" class="text-[11px] font-mono font-normal text-slate-700">6 px</span>
                          </div>
                          <input type="range" id="cfg-badge-radius" min="0" max="12" step="1" value="6" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>

                        <!-- Pengaturan Warna Label Khusus -->
                        <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                          <div>
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-badge-text-color" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).text}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-badge-text-hex" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).text}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                          <div id="cfg-badge-bg-wrap">
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Latar</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-badge-bg-color" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).bg}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-badge-bg-hex" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).bg}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                          <div id="cfg-badge-border-wrap" class="hidden">
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Garis Tepi</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-badge-border-color" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).border}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-badge-border-hex" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).border}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>`;

replaceExact('desktop-promo-unify', deskTarget, deskReplacement);

// 2. Unify mobile Promo & Diskon
const mobTarget = `                <!-- Kelompok 3: Label Khusus Mobile -->
                <div id="accordion-group-badge-mob" class="border border-slate-200 rounded-lg overflow-hidden bg-white \${primaryState.card_variant === 'B' ? 'hidden' : ''}">
                  <button type="button" id="btn-accordion-badge-mob" aria-expanded="false" aria-controls="accordion-body-badge-mob" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="badge">
                    <span class="flex items-center gap-1.5 text-xs font-normal text-slate-800">
                      <i class="bi bi-bookmark-star text-emerald-600"></i>
                      <span>Label Khusus</span>
                    </span>
                    <i id="accordion-icon-badge-mob" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-badge-mob" class="hidden p-3 border-t border-slate-100 space-y-3" role="region" aria-labelledby="btn-accordion-badge-mob">
                    <div id="cfg-badge-container-mob">
                      <!-- Visibilitas Label Khusus Mobile (Eye toggle) -->
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

                    <!-- Pilihan Gaya Label Mobile: Latar vs Garis Tepi (Segmented Control) -->
                    <div class="space-y-1">
                      <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Gaya Label</label>
                      <div class="grid grid-cols-2 p-0.5 bg-slate-100 rounded-md gap-0.5 select-none" id="cfg-badge-style-group-mob">
                        <button type="button" class="btn-badge-style py-1 px-2 text-[11px] font-normal rounded-md bg-white text-slate-800 shadow-2xs transition cursor-pointer text-center" data-style="bg">Latar</button>
                        <button type="button" class="btn-badge-style py-1 px-2 text-[11px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-style="border">Garis Tepi</button>
                      </div>
                      <input type="hidden" id="cfg-badge-style-mob" value="bg" />
                    </div>

                    <!-- Radius Sudut Label Khusus Mobile (Slider 0-12 px + Pilihan Cepat 0, 4, 6, 8, 12 px) -->
                    <div class="space-y-1.5 pt-0.5">
                      <div class="flex items-center justify-between">
                        <label for="cfg-badge-radius-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                        <span id="cfg-badge-radius-val-mob" class="text-[11px] font-mono font-normal text-slate-700">6 px</span>
                      </div>
                      <input type="range" id="cfg-badge-radius-mob" min="0" max="12" step="1" value="6" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                      <div class="flex items-center gap-1 pt-0.5">
                        <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                        <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                        <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="6">6 px</button>
                        <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                        <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                      </div>
                    </div>

                    <!-- Pengaturan Warna Label Khusus Mobile -->
                    <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-badge-text-color-mob" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).text}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-badge-text-hex-mob" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).text}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                        </div>
                      </div>
                      <div id="cfg-badge-bg-wrap-mob">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Latar</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-badge-bg-color-mob" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).bg}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-badge-bg-hex-mob" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).bg}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                        </div>
                      </div>
                      <div id="cfg-badge-border-wrap-mob" class="hidden">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Garis Tepi</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-badge-border-color-mob" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).border}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-badge-border-hex-mob" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).border}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                        </div>
                      </div>
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
                </div>`;

const mobReplacement = `                <!-- Kelompok 3: Promo & Diskon Mobile -->
                <div id="accordion-group-promo-mob" class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button type="button" id="btn-accordion-promo-mob" aria-expanded="false" aria-controls="accordion-body-promo-mob" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="promo">
                    <span class="flex items-center gap-1.5 text-xs font-normal text-slate-800">
                      <i class="bi bi-tag text-emerald-600"></i>
                      <span>Promo &amp; Diskon</span>
                    </span>
                    <i id="accordion-icon-promo-mob" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-promo-mob" class="hidden p-3 border-t border-slate-100 space-y-3" role="region" aria-labelledby="btn-accordion-promo-mob">
                    <!-- 1. Harga Coret Mobile -->
                    <div class="space-y-2 pb-2.5 border-b border-slate-100">
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
                      <!-- Panel Custom Harga Coret Mobile (Tampil jika Harga Coret TRUE) -->
                      <div id="cfg-strike-panel-mob" class="px-2 pt-1 pb-1 space-y-1.5">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Harga Coret</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-strike-color-mob" value="#94a3b8" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-strike-hex-mob" value="#94a3b8" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                        </div>
                      </div>
                    </div>

                    <!-- 2. Label Diskon Mobile (d/h Diskon Foto) -->
                    <div class="space-y-2 pb-2.5 border-b border-slate-100">
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-percent text-slate-400 text-[11px]"></i>
                          <span>Label Diskon</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-show-discount-badge-mob" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-show-discount-badge-mob-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-show-discount-badge-mob-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                      <!-- Panel Custom Label Diskon Mobile (Tampil jika Label Diskon TRUE) -->
                      <div id="cfg-discount-badge-panel-mob" class="px-2 pt-1 pb-1 space-y-2.5">
                        <!-- Radius Sudut Label Diskon Mobile -->
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-discount-badge-radius-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <span id="cfg-discount-badge-radius-val-mob" class="text-[11px] font-mono font-normal text-slate-700">8 px</span>
                          </div>
                          <input type="range" id="cfg-discount-badge-radius-mob" min="0" max="12" step="1" value="8" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>
                        <!-- Posisi Label Diskon Mobile (4 Sudut Foto) -->
                        <div class="space-y-1">
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Posisi Label</label>
                          <div class="grid grid-cols-2 p-0.5 bg-slate-100 rounded-md gap-0.5 select-none" id="cfg-discount-badge-position-group-mob">
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-pos="top-left">Kiri Atas</button>
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md bg-white text-slate-800 shadow-2xs transition cursor-pointer text-center" data-pos="top-right">Kanan Atas</button>
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-pos="bottom-left">Kiri Bawah</button>
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-pos="bottom-right">Kanan Bawah</button>
                          </div>
                          <input type="hidden" id="cfg-discount-badge-position-mob" value="top-right" />
                        </div>
                        <!-- Warna Label Diskon Mobile -->
                        <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                          <div>
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-discount-badge-text-color-mob" value="#ffffff" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-discount-badge-text-hex-mob" value="#ffffff" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                          <div>
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Latar</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-discount-badge-bg-color-mob" value="\${getPrimaryThemeColor()}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-discount-badge-bg-hex-mob" value="\${getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 3. Ikon Tiket Mobile -->
                    <div class="py-0.5 border-b border-slate-100">
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

                    <!-- 4. Countdown Mobile -->
                    <div class="space-y-2 pb-2.5 border-b border-slate-100">
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-normal">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-alarm text-slate-400 text-[11px]"></i>
                          <span>Countdown</span>
                        </span>
                        <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                          <input type="checkbox" id="cfg-enable-countdown-mob" class="sr-only peer cfg-eye-toggle" />
                          <i id="cfg-enable-countdown-mob-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                          <i id="cfg-enable-countdown-mob-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                        </span>
                      </label>
                      <!-- Panel Custom Countdown Mobile (Tampil jika Countdown TRUE) -->
                      <div id="cfg-countdown-panel-mob" class="px-2 pt-1 pb-1 space-y-2.5">
                        <!-- Radius Sudut Countdown Mobile Slider 0-12 px + Presets 0, 4, 6, 8, 12 px -->
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-countdown-radius-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <span id="cfg-countdown-radius-val-mob" class="text-[11px] font-mono font-normal text-slate-700">6 px</span>
                          </div>
                          <input type="range" id="cfg-countdown-radius-mob" min="0" max="12" step="1" value="6" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>
                        <!-- Warna Countdown Mobile -->
                        <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                          <div>
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Latar Belakang</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-countdown-bg-color-mob" value="\${primaryState.countdown_bg_color || getPrimaryThemeColor()}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-countdown-bg-hex-mob" value="\${primaryState.countdown_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                          <div>
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-countdown-text-color-mob" value="\${primaryState.countdown_text_color || '#ffffff'}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-countdown-text-hex-mob" value="\${primaryState.countdown_text_color || '#ffffff'}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                          <div>
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Ikon</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-countdown-icon-color-mob" value="\${primaryState.countdown_icon_color || '#ffffff'}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-countdown-icon-hex-mob" value="\${primaryState.countdown_icon_color || '#ffffff'}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                          <div>
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Border</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-countdown-border-color-mob" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-countdown-border-hex-mob" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 5. Label Khusus Mobile (Hanya Model A & C, disembunyikan jika Model B) -->
                    <div id="cfg-badge-container-mob" class="\${primaryState.card_variant === 'B' ? 'hidden' : ''}">
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
                      <!-- Panel Custom Label Khusus Mobile (Tampil jika Label Khusus TRUE) -->
                      <div id="cfg-badge-panel-mob" class="px-2 pt-1 pb-1 space-y-3">
                        <!-- Pilihan Gaya Label Mobile: Latar vs Garis Tepi (Segmented Control) -->
                        <div class="space-y-1">
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Gaya Label</label>
                          <div class="grid grid-cols-2 p-0.5 bg-slate-100 rounded-md gap-0.5 select-none" id="cfg-badge-style-group-mob">
                            <button type="button" class="btn-badge-style py-1 px-2 text-[11px] font-normal rounded-md bg-white text-slate-800 shadow-2xs transition cursor-pointer text-center" data-style="bg">Latar</button>
                            <button type="button" class="btn-badge-style py-1 px-2 text-[11px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-style="border">Garis Tepi</button>
                          </div>
                          <input type="hidden" id="cfg-badge-style-mob" value="bg" />
                        </div>

                        <!-- Radius Sudut Label Khusus Mobile (Slider 0-12 px + Pilihan Cepat 0, 4, 6, 8, 12 px) -->
                        <div class="space-y-1.5 pt-0.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-badge-radius-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <span id="cfg-badge-radius-val-mob" class="text-[11px] font-mono font-normal text-slate-700">6 px</span>
                          </div>
                          <input type="range" id="cfg-badge-radius-mob" min="0" max="12" step="1" value="6" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>

                        <!-- Pengaturan Warna Label Khusus Mobile -->
                        <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                          <div>
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Teks</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-badge-text-color-mob" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).text}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-badge-text-hex-mob" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).text}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                          <div id="cfg-badge-bg-wrap-mob">
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Latar</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-badge-bg-color-mob" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).bg}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-badge-bg-hex-mob" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).bg}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                          <div id="cfg-badge-border-wrap-mob" class="hidden">
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Garis Tepi</label>
                            <div class="flex items-center gap-1.5">
                              <input type="color" id="cfg-badge-border-color-mob" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).border}" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                              <input type="text" id="cfg-badge-border-hex-mob" value="\${getThemeDefaultBadgeColors(primaryState.card_variant).border}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>`;

replaceExact('mobile-promo-unify', mobTarget, mobReplacement);

// 3. Clean up lines that reference accordion-group-badge in syncCardAccordionDOM and Model B handler
const modelBTarget = `    const isModelB = primaryState.card_variant === 'B';
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

    const badgeContainerDesk = document.getElementById('cfg-badge-container-desk');`;

const modelBReplacement = `    const isModelB = primaryState.card_variant === 'B';
    const badgeContainerDesk = document.getElementById('cfg-badge-container-desk');`;

replaceExact('modelB-accordion-group-badge-cleanup', modelBTarget, modelBReplacement);

// 4. Clean up lines 20650-20675
const modelBFormTarget = `        const grpBadgeDesk = document.getElementById('accordion-group-badge');
        const grpBadgeMob = document.getElementById('accordion-group-badge-mob');
        if (grpBadgeDesk) grpBadgeDesk.classList.add('hidden');
        if (grpBadgeMob) grpBadgeMob.classList.add('hidden');
      } else {
        primaryState.show_badge = true;
        if (toggle) {
          toggle.disabled = false;
          toggle.checked = true;
        }
        if (toggleWrapper) {
          toggleWrapper.classList.remove('opacity-50', 'cursor-not-allowed');
          toggleWrapper.classList.add('cursor-pointer');
        }
        if (notice) {
          notice.classList.add('hidden');
          notice.classList.remove('block');
        }
        if (container) {
          container.classList.remove('hidden');
        }
        if (badgeContainerDesk) badgeContainerDesk.classList.remove('hidden');
        if (badgeContainerMob) badgeContainerMob.classList.remove('hidden');
        const grpBadgeDeskNonB = document.getElementById('accordion-group-badge');
        const grpBadgeMobNonB = document.getElementById('accordion-group-badge-mob');
        if (grpBadgeDeskNonB) grpBadgeDeskNonB.classList.remove('hidden');
        if (grpBadgeMobNonB) grpBadgeMobNonB.classList.remove('hidden');
      }`;

const modelBFormReplacement = `      } else {
        primaryState.show_badge = true;
        if (toggle) {
          toggle.disabled = false;
          toggle.checked = true;
        }
        if (toggleWrapper) {
          toggleWrapper.classList.remove('opacity-50', 'cursor-not-allowed');
          toggleWrapper.classList.add('cursor-pointer');
        }
        if (notice) {
          notice.classList.add('hidden');
          notice.classList.remove('block');
        }
        if (container) {
          container.classList.remove('hidden');
        }
        if (badgeContainerDesk) badgeContainerDesk.classList.remove('hidden');
        if (badgeContainerMob) badgeContainerMob.classList.remove('hidden');
      }`;

replaceExact('modelBForm-group-badge-cleanup', modelBFormTarget, modelBFormReplacement);

fs.writeFileSync('js/product-form.js', pf, 'utf8');
console.log('js/product-form.js Promo & Diskon unified successfully!');

