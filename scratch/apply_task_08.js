const fs = require('fs');

let content = fs.readFileSync('js/product-form.js', 'utf8');

// 1. Desktop HTML replacement
const deskTargetStart = '            <!-- Visual Customization Controls: [Default] dan [Ubah Kartu] (Step 1 Only) -->';
const deskTargetEnd = '            </div>\n          </div>\n\n\n\n\n\n        </aside>';

const newDeskHtml = `            <!-- Visual Customization Controls: Accordion Editor (Step 1 Only) -->
            <div id="card-customization-section" class="hidden p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-3">
              <!-- Accordion Groups Container -->
              <div class="space-y-2">
                <!-- Kelompok 1: Warna & Bentuk -->
                <div id="accordion-group-colors" class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button type="button" id="btn-accordion-colors" aria-expanded="true" aria-controls="accordion-body-colors" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="colors">
                    <span class="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <i class="bi bi-palette text-emerald-600"></i>
                      <span>Warna &amp; Bentuk</span>
                    </span>
                    <i id="accordion-icon-colors" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200 rotate-180"></i>
                  </button>
                  <div id="accordion-body-colors" class="p-3 border-t border-slate-100 space-y-2.5" role="region" aria-labelledby="btn-accordion-colors">
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latar Belakang</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-bg-color" value="#ffffff" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-bg-text" value="#ffffff" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Border</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-border-color" value="#e2e8f0" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-border-text" value="#e2e8f0" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Judul</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-title-color" value="#0f172a" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-title-text" value="#0f172a" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Harga</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-price-color" value="\${getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-price-text" value="\${getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tombol Beli</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-btn-color" value="\${getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-btn-text" value="\${getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Radius Sudut</label>
                        <select id="cfg-border-radius" class="w-full px-1.5 py-1 text-[11px] border border-slate-200 rounded outline-none bg-white">
                          <option value="0px">0px (Kotak)</option>
                          <option value="8px">8px (Kecil)</option>
                          <option value="16px">16px (Sedang)</option>
                          <option value="24px">24px (Besar)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Kelompok 2: Elemen Kartu -->
                <div id="accordion-group-elements" class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button type="button" id="btn-accordion-elements" aria-expanded="false" aria-controls="accordion-body-elements" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="elements">
                    <span class="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <i class="bi bi-card-checklist text-emerald-600"></i>
                      <span>Elemen Kartu</span>
                    </span>
                    <i id="accordion-icon-elements" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-elements" class="hidden p-2.5 border-t border-slate-100 divide-y divide-slate-100" role="region" aria-labelledby="btn-accordion-elements">
                    <!-- Rating -->
                    <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-medium">
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
                    <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-medium">
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
                    <!-- Harga Coret -->
                    <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-medium">
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
                    <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-medium">
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
                    <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-medium">
                      <span class="flex items-center gap-1.5">
                        <i class="bi bi-ticket-perforated text-slate-400 text-[11px]"></i>
                        <span>Ikon Tiket</span>
                      </span>
                      <span class="inline-flex items-center justify-center w-6 h-6 text-slate-500">
                        <input type="checkbox" id="cfg-show-ticket-icon" class="sr-only peer cfg-eye-toggle" />
                        <i id="cfg-show-ticket-icon-on" class="bi bi-eye text-emerald-600 text-base hidden peer-checked:inline-block"></i>
                        <i id="cfg-show-ticket-icon-off" class="bi bi-eye-slash text-slate-400 text-base inline-block peer-checked:hidden"></i>
                      </span>
                    </label>
                    <!-- Label Khusus (Hanya Model A & C) -->
                    <div id="cfg-badge-container-desk" class="\${primaryState.card_variant === 'B' ? 'hidden' : ''}">
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-medium">
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

                <!-- Kelompok 3: Footer Kartu (Hanya Model C) -->
                <div id="accordion-group-footer" class="border border-slate-200 rounded-lg overflow-hidden bg-white \${primaryState.card_variant === 'C' ? '' : 'hidden'}">
                  <button type="button" id="btn-accordion-footer" aria-expanded="false" aria-controls="accordion-body-footer" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="footer">
                    <span class="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <i class="bi bi-layers text-emerald-600"></i>
                      <span>Footer Dua Strip</span>
                      <span class="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-mono ml-1">Detail</span>
                    </span>
                    <i id="accordion-icon-footer" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-footer" class="hidden p-3 border-t border-slate-100 space-y-2.5" role="region" aria-labelledby="btn-accordion-footer">
                    <!-- Strip 1 -->
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div class="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                        <i data-lucide="panel-bottom" class="w-3 h-3 text-[var(--color-primary)]"></i> Strip 1 (Atas)
                      </div>
                      <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Teks Footer 1</label>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-text-side" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" value="\${escapeHtml(primaryState.card_footer_text || 'Proses Hanya Dalam 1Jam')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-medium" />
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latar Footer 1</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-bg-color-side" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-bg-hex-side" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Teks 1</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-text-color-side" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-text-hex-side" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- Strip 2 -->
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div class="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                        <i data-lucide="minus" class="w-3 h-3 text-[var(--color-primary)]"></i> Strip 2 (Bawah)
                      </div>
                      <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Teks Footer 2</label>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-2-text-side" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" value="\${escapeHtml(primaryState.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-medium" />
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latar Footer 2</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-2-bg-color-side" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-2-bg-hex-side" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Teks 2</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-2-text-color-side" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-2-text-hex-side" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Kelompok 4: Countdown -->
                <div id="accordion-group-countdown" class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button type="button" id="btn-accordion-countdown" aria-expanded="false" aria-controls="accordion-body-countdown" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="countdown">
                    <span class="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <i class="bi bi-stopwatch text-emerald-600"></i>
                      <span>Countdown Diskon</span>
                    </span>
                    <i id="accordion-icon-countdown" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-countdown" class="hidden p-3 border-t border-slate-100 space-y-3" role="region" aria-labelledby="btn-accordion-countdown">
                    <!-- Aktifkan Countdown -->
                    <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-medium border border-slate-100">
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
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latar Belakang</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-countdown-bg-color" value="\${primaryState.countdown_bg_color || getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-countdown-bg-hex" value="\${primaryState.countdown_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Teks</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-countdown-text-color" value="\${primaryState.countdown_text_color || '#ffffff'}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-countdown-text-hex" value="\${primaryState.countdown_text_color || '#ffffff'}" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Ikon</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-countdown-icon-color" value="\${primaryState.countdown_icon_color || '#ffffff'}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-countdown-icon-hex" value="\${primaryState.countdown_icon_color || '#ffffff'}" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Border</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-countdown-border-color" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-countdown-border-hex" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div class="col-span-2">
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Radius Sudut</label>
                        <select id="cfg-countdown-radius" class="w-full px-1.5 py-1 text-[11px] border border-slate-200 rounded outline-none bg-white">
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

              <!-- Pinned Footer Section (Di Bawah Accordion) -->
              <div class="pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                <!-- Tombol Gunakan Desain Bawaan -->
                <button type="button" id="btn-apply-default-card-design" class="w-full py-1.5 px-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98" title="Terapkan konfigurasi desain bawaan untuk model kartu ini">
                  <i class="bi bi-arrow-counterclockwise text-slate-500"></i>
                  <span>Gunakan Desain Bawaan</span>
                </button>

                <!-- Checkbox Gunakan Tema Sebagai Default -->
                <label class="flex items-center gap-2 text-[11px] font-bold text-emerald-800 cursor-pointer select-none">
                  <input type="checkbox" id="cfg-save-as-default-toggle" class="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer" />
                  <span id="label-save-as-default-desk">Gunakan Tema Sebagai Default \${primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik')}</span>
                </label>

                <!-- Tombol Batal & Simpan Perubahan -->
                <div class="flex items-center gap-2 w-full pt-0.5">
                  <button type="button" id="btn-cancel-card-design" class="w-1/3 py-2 px-2.5 border border-slate-300 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-98" title="Batalkan perubahan desain ke kondisi awal sesi">
                    <span>Batal</span>
                  </button>
                  <button type="button" id="btn-save-card-design" class="btn-primary-brand flex-1 py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-98">
                    <i class="bi bi-check-lg"></i>
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            </div>`;

const deskIdxStart = content.indexOf(deskTargetStart);
const deskIdxEnd = content.indexOf(deskTargetEnd);
if (deskIdxStart === -1 || deskIdxEnd === -1) {
  throw new Error('Desktop target not found');
}
content = content.substring(0, deskIdxStart) + newDeskHtml + content.substring(deskIdxEnd + 17); // 17 is len of '            </div>'

// 2. Mobile HTML replacement
const mobTargetStart = '            <!-- Panel Kustomisasi Desain Mobile: [Default] dan [Ubah Kartu] (Step 1 Only) -->';
const mobTargetEnd = '            </div>\n          </div>\n\n\n\n\n\n        </div>\n\n        <!-- MODAL MINI: TAMBAH KATEGORI / SUB-KATEGORI BARU CEPAT -->';

const newMobHtml = `            <!-- Panel Kustomisasi Desain Mobile: Accordion Editor (Step 1 Only) -->
            <div id="card-customization-section-mob" class="hidden w-full max-w-[260px] p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-3">
              <!-- Accordion Groups Container Mobile -->
              <div class="space-y-2">
                <!-- Kelompok 1: Warna & Bentuk Mobile -->
                <div id="accordion-group-colors-mob" class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button type="button" id="btn-accordion-colors-mob" aria-expanded="true" aria-controls="accordion-body-colors-mob" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="colors">
                    <span class="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <i class="bi bi-palette text-emerald-600"></i>
                      <span>Warna &amp; Bentuk</span>
                    </span>
                    <i id="accordion-icon-colors-mob" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200 rotate-180"></i>
                  </button>
                  <div id="accordion-body-colors-mob" class="p-3 border-t border-slate-100 space-y-2.5" role="region" aria-labelledby="btn-accordion-colors-mob">
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latar Belakang</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-bg-color-mob" value="#ffffff" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-bg-text-mob" value="#ffffff" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Border</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-border-color-mob" value="#e2e8f0" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-border-text-mob" value="#e2e8f0" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Judul</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-title-color-mob" value="#0f172a" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-title-text-mob" value="#0f172a" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Harga</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-price-color-mob" value="\${getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-price-text-mob" value="\${getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tombol Beli</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-btn-color-mob" value="\${getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-btn-text-mob" value="\${getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Radius Sudut</label>
                        <select id="cfg-border-radius-mob" class="w-full px-1.5 py-1 text-[11px] border border-slate-200 rounded outline-none bg-white">
                          <option value="0px">0px (Kotak)</option>
                          <option value="8px">8px (Kecil)</option>
                          <option value="16px">16px (Sedang)</option>
                          <option value="24px">24px (Besar)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Kelompok 2: Elemen Kartu Mobile -->
                <div id="accordion-group-elements-mob" class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button type="button" id="btn-accordion-elements-mob" aria-expanded="false" aria-controls="accordion-body-elements-mob" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="elements">
                    <span class="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <i class="bi bi-card-checklist text-emerald-600"></i>
                      <span>Elemen Kartu</span>
                    </span>
                    <i id="accordion-icon-elements-mob" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-elements-mob" class="hidden p-2.5 border-t border-slate-100 divide-y divide-slate-100" role="region" aria-labelledby="btn-accordion-elements-mob">
                    <!-- Rating -->
                    <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-medium">
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
                    <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-medium">
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
                    <!-- Harga Coret -->
                    <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-medium">
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
                    <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-medium">
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
                    <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-medium">
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
                    <!-- Label Khusus (Hanya Model A & C) -->
                    <div id="cfg-badge-container-mob" class="\${primaryState.card_variant === 'B' ? 'hidden' : ''}">
                      <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-medium">
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

                <!-- Kelompok 3: Footer Kartu Mobile (Hanya Model C) -->
                <div id="accordion-group-footer-mob" class="border border-slate-200 rounded-lg overflow-hidden bg-white \${primaryState.card_variant === 'C' ? '' : 'hidden'}">
                  <button type="button" id="btn-accordion-footer-mob" aria-expanded="false" aria-controls="accordion-body-footer-mob" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="footer">
                    <span class="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <i class="bi bi-layers text-emerald-600"></i>
                      <span>Footer Dua Strip</span>
                      <span class="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-mono ml-1">Detail</span>
                    </span>
                    <i id="accordion-icon-footer-mob" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-footer-mob" class="hidden p-3 border-t border-slate-100 space-y-2.5" role="region" aria-labelledby="btn-accordion-footer-mob">
                    <!-- Strip 1 -->
                    <div class="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div class="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                        <i data-lucide="panel-bottom" class="w-3 h-3 text-[var(--color-primary)]"></i> Strip 1 (Atas)
                      </div>
                      <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Teks Footer 1</label>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" value="\${escapeHtml(primaryState.card_footer_text || 'Proses Hanya Dalam 1Jam')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-medium" />
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latar Footer 1</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-bg-color-mob" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-bg-hex-mob" value="\${primaryState.footer_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Teks 1</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-text-color-mob" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-text-hex-mob" value="\${primaryState.footer_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- Strip 2 -->
                    <div class="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div class="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                        <i data-lucide="minus" class="w-3 h-3 text-[var(--color-primary)]"></i> Strip 2 (Bawah)
                      </div>
                      <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Teks Footer 2</label>
                        <div class="relative w-full clean-datalist-wrapper">
                          <input type="text" id="input-card-footer-2-text-mob" list="footer-texts-history-list" data-datalist-id="footer-texts-history-list" autocomplete="off" value="\${escapeHtml(primaryState.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia')}" class="clean-datalist-input w-full px-2 pr-8 py-1.5 text-xs rounded-md border border-slate-200 focus:border-[var(--color-primary)] outline-none bg-white font-medium" />
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latar Footer 2</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-2-bg-color-mob" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-2-bg-hex-mob" value="\${primaryState.footer_2_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Teks 2</label>
                          <div class="flex items-center gap-1.5">
                            <input type="color" id="cfg-footer-2-text-color-mob" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                            <input type="text" id="cfg-footer-2-text-hex-mob" value="\${primaryState.footer_2_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Kelompok 4: Countdown Mobile -->
                <div id="accordion-group-countdown-mob" class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button type="button" id="btn-accordion-countdown-mob" aria-expanded="false" aria-controls="accordion-body-countdown-mob" class="card-accordion-trigger w-full flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left select-none" data-group="countdown">
                    <span class="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <i class="bi bi-stopwatch text-emerald-600"></i>
                      <span>Countdown Diskon</span>
                    </span>
                    <i id="accordion-icon-countdown-mob" class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200"></i>
                  </button>
                  <div id="accordion-body-countdown-mob" class="hidden p-3 border-t border-slate-100 space-y-3" role="region" aria-labelledby="btn-accordion-countdown-mob">
                    <!-- Aktifkan Countdown -->
                    <label class="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition select-none text-xs text-slate-700 font-medium border border-slate-100">
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
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latar Belakang</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-countdown-bg-color-mob" value="\${primaryState.countdown_bg_color || getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-countdown-bg-hex-mob" value="\${primaryState.countdown_bg_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Teks</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-countdown-text-color-mob" value="\${primaryState.countdown_text_color || '#ffffff'}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-countdown-text-hex-mob" value="\${primaryState.countdown_text_color || '#ffffff'}" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Ikon</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-countdown-icon-color-mob" value="\${primaryState.countdown_icon_color || '#ffffff'}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-countdown-icon-hex-mob" value="\${primaryState.countdown_icon_color || '#ffffff'}" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Border</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-countdown-border-color-mob" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-countdown-border-hex-mob" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div class="col-span-2">
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Radius Sudut</label>
                        <select id="cfg-countdown-radius-mob" class="w-full px-1.5 py-1 text-[11px] border border-slate-200 rounded outline-none bg-white">
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

              <!-- Pinned Footer Section Mobile (Di Bawah Accordion) -->
              <div class="pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                <!-- Tombol Gunakan Desain Bawaan Mobile -->
                <button type="button" id="btn-apply-default-card-design-mob" class="w-full py-1.5 px-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98" title="Terapkan konfigurasi desain bawaan untuk model kartu ini">
                  <i class="bi bi-arrow-counterclockwise text-slate-500"></i>
                  <span>Gunakan Desain Bawaan</span>
                </button>

                <!-- Checkbox Gunakan Tema Sebagai Default Mobile -->
                <label class="flex items-center gap-2 text-[11px] font-bold text-emerald-800 cursor-pointer select-none">
                  <input type="checkbox" id="cfg-save-as-default-toggle-mob" class="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer" />
                  <span id="label-save-as-default-mob">Gunakan Tema Sebagai Default \${primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik')}</span>
                </label>

                <!-- Tombol Batal & Simpan Perubahan Mobile -->
                <div class="flex items-center gap-2 w-full pt-0.5">
                  <button type="button" id="btn-cancel-card-design-mob" class="w-1/3 py-2 px-2.5 border border-slate-300 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-98" title="Batalkan perubahan desain ke kondisi awal sesi">
                    <span>Batal</span>
                  </button>
                  <button type="button" id="btn-save-card-design-mob" class="btn-primary-brand flex-1 py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-98">
                    <i class="bi bi-check-lg"></i>
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            </div>`;

const mobIdxStart = content.indexOf(mobTargetStart);
const mobIdxEnd = content.indexOf(mobTargetEnd);
if (mobIdxStart === -1 || mobIdxEnd === -1) {
  throw new Error('Mobile target not found');
}
content = content.substring(0, mobIdxStart) + newMobHtml + content.substring(mobIdxEnd + 17);

fs.writeFileSync('js/product-form.js', content, 'utf8');
console.log('Markup replacement applied successfully!');

