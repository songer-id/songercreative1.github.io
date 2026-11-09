const fs = require('fs');
let code = fs.readFileSync('js/product-form.js', 'utf8');
code = code.replace(/\r\n/g, '\n');

// 1. Desktop: Strike Hint
const deskStrikeTarget = `                      <!-- Panel Custom Harga Coret (Tampil jika Harga Coret TRUE) -->
                      <div id="cfg-strike-panel-desk" class="px-2 pt-1 pb-1 space-y-1.5">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Harga Coret</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-strike-color" value="#94a3b8" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-strike-hex" value="#94a3b8" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                        </div>
                      </div>
                    </div>`;

const deskStrikeRepl = `                      <!-- Panel Custom Harga Coret (Tampil jika Harga Coret TRUE) -->
                      <div id="cfg-strike-panel-desk" class="px-2 pt-1 pb-1 space-y-1.5">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Harga Coret</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-strike-color" value="#94a3b8" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-strike-hex" value="#94a3b8" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                        </div>
                      </div>
                      <p id="cfg-strike-promo-hint" class="hidden text-[11px] text-amber-600 font-normal px-2 pt-0.5 pb-1 leading-tight">Tampil saat promo aktif atau Simulasi Diskon dinyalakan.</p>
                    </div>`;

if (!code.includes(deskStrikeTarget)) throw new Error('deskStrikeTarget not found');
code = code.replace(deskStrikeTarget, deskStrikeRepl);

// 2. Desktop: Posisi Label Diskon Dropdown & Discount Hint
const deskDiscPosTarget = `                        <!-- Posisi Label Diskon (4 Sudut Foto) -->
                        <div class="space-y-1">
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Posisi Label</label>
                          <div class="grid grid-cols-2 p-0.5 bg-slate-100 rounded-md gap-0.5 select-none" id="cfg-discount-badge-position-group">
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-pos="top-left">Kiri Atas</button>
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md bg-white text-slate-800 shadow-2xs transition cursor-pointer text-center" data-pos="top-right">Kanan Atas</button>
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-pos="bottom-left">Kiri Bawah</button>
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-pos="bottom-right">Kanan Bawah</button>
                          </div>
                          <input type="hidden" id="cfg-discount-badge-position" value="top-right" />
                        </div>`;

const deskDiscPosRepl = `                        <!-- Posisi Label Diskon (Dropdown) -->
                        <div class="space-y-1">
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Posisi Label</label>
                          <div class="relative" id="cfg-discount-badge-pos-container">
                            <button type="button" id="btn-discount-badge-pos" aria-haspopup="listbox" aria-expanded="false" class="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-normal text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition cursor-pointer select-none">
                              <span id="lbl-discount-badge-pos" class="font-normal text-slate-700">Kanan Atas</span>
                              <i class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200" id="icon-discount-badge-pos-chevron"></i>
                            </button>
                            <div id="menu-discount-badge-pos" role="listbox" class="hidden absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-30 select-none">
                              <button type="button" role="option" class="btn-disc-pos w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-normal text-left text-slate-700 hover:bg-slate-50 cursor-pointer transition" data-pos="top-left">
                                <span>Kiri Atas</span>
                              </button>
                              <button type="button" role="option" class="btn-disc-pos w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-normal text-left text-emerald-700 bg-emerald-50 cursor-pointer transition" data-pos="top-right">
                                <span>Kanan Atas</span>
                              </button>
                              <button type="button" role="option" class="btn-disc-pos w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-normal text-left text-slate-700 hover:bg-slate-50 cursor-pointer transition" data-pos="bottom-left">
                                <span>Kiri Bawah</span>
                              </button>
                              <button type="button" role="option" class="btn-disc-pos w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-normal text-left text-slate-700 hover:bg-slate-50 cursor-pointer transition" data-pos="bottom-right">
                                <span>Kanan Bawah</span>
                              </button>
                            </div>
                            <input type="hidden" id="cfg-discount-badge-position" value="top-right" />
                          </div>
                        </div>`;

if (!code.includes(deskDiscPosTarget)) throw new Error('deskDiscPosTarget not found');
code = code.replace(deskDiscPosTarget, deskDiscPosRepl);

// Desktop Discount Hint & Ticket Hint
const deskDiscEndTarget = `                        </div>
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
                      <p id="cfg-ticket-promo-hint" class="hidden text-[11px] text-amber-600 font-normal px-2 pt-0.5 pb-1 leading-tight">Ikon tiket hanya muncul saat produk memiliki promo/diskon aktif atau Simulasi Diskon diaktifkan.</p>
                    </div>`;

const deskDiscEndRepl = `                        </div>
                      </div>
                      <p id="cfg-discount-promo-hint" class="hidden text-[11px] text-amber-600 font-normal px-2 pt-0.5 pb-1 leading-tight">Tampil saat promo aktif atau Simulasi Diskon dinyalakan.</p>
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
                      <p id="cfg-ticket-promo-hint" class="hidden text-[11px] text-amber-600 font-normal px-2 pt-0.5 pb-1 leading-tight">Tampil saat promo aktif atau Simulasi Diskon dinyalakan.</p>
                    </div>`;

if (!code.includes(deskDiscEndTarget)) throw new Error('deskDiscEndTarget not found');
code = code.replace(deskDiscEndTarget, deskDiscEndRepl);

// Desktop Countdown Hint
const deskCdEndTarget = `                              <input type="text" id="cfg-countdown-border-hex" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 5. Label Khusus (Hanya Model A & C, disembunyikan jika Model B) -->`;

const deskCdEndRepl = `                              <input type="text" id="cfg-countdown-border-hex" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <p id="cfg-countdown-promo-hint" class="hidden text-[11px] text-amber-600 font-normal px-2 pt-0.5 pb-1 leading-tight">Tampil saat promo aktif atau Simulasi Diskon dinyalakan.</p>
                    </div>

                    <!-- 5. Label Khusus (Hanya Model A & C, disembunyikan jika Model B) -->`;

if (!code.includes(deskCdEndTarget)) throw new Error('deskCdEndTarget not found');
code = code.replace(deskCdEndTarget, deskCdEndRepl);

// 3. Mobile: Strike Hint
const mobStrikeTarget = `                      <!-- Panel Custom Harga Coret Mobile (Tampil jika Harga Coret TRUE) -->
                      <div id="cfg-strike-panel-mob" class="px-2 pt-1 pb-1 space-y-1.5">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Harga Coret</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-strike-color-mob" value="#94a3b8" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-strike-hex-mob" value="#94a3b8" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                        </div>
                      </div>
                    </div>`;

const mobStrikeRepl = `                      <!-- Panel Custom Harga Coret Mobile (Tampil jika Harga Coret TRUE) -->
                      <div id="cfg-strike-panel-mob" class="px-2 pt-1 pb-1 space-y-1.5">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Harga Coret</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-strike-color-mob" value="#94a3b8" class="w-7 h-7 rounded-md cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-strike-hex-mob" value="#94a3b8" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                        </div>
                      </div>
                      <p id="cfg-strike-promo-hint-mob" class="hidden text-[11px] text-amber-600 font-normal px-2 pt-0.5 pb-1 leading-tight">Tampil saat promo aktif atau Simulasi Diskon dinyalakan.</p>
                    </div>`;

if (!code.includes(mobStrikeTarget)) throw new Error('mobStrikeTarget not found');
code = code.replace(mobStrikeTarget, mobStrikeRepl);

// 4. Mobile: Posisi Label Diskon Dropdown & Discount Hint
const mobDiscPosTarget = `                        <!-- Posisi Label Diskon Mobile (4 Sudut Foto) -->
                        <div class="space-y-1">
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Posisi Label</label>
                          <div class="grid grid-cols-2 p-0.5 bg-slate-100 rounded-md gap-0.5 select-none" id="cfg-discount-badge-position-group-mob">
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-pos="top-left">Kiri Atas</button>
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md bg-white text-slate-800 shadow-2xs transition cursor-pointer text-center" data-pos="top-right">Kanan Atas</button>
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-pos="bottom-left">Kiri Bawah</button>
                            <button type="button" class="btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center" data-pos="bottom-right">Kanan Bawah</button>
                          </div>
                          <input type="hidden" id="cfg-discount-badge-position-mob" value="top-right" />
                        </div>`;

const mobDiscPosRepl = `                        <!-- Posisi Label Diskon Mobile (Dropdown) -->
                        <div class="space-y-1">
                          <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Posisi Label</label>
                          <div class="relative" id="cfg-discount-badge-pos-container-mob">
                            <button type="button" id="btn-discount-badge-pos-mob" aria-haspopup="listbox" aria-expanded="false" class="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-normal text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition cursor-pointer select-none">
                              <span id="lbl-discount-badge-pos-mob" class="font-normal text-slate-700">Kanan Atas</span>
                              <i class="bi bi-chevron-down text-slate-400 text-xs transition-transform duration-200" id="icon-discount-badge-pos-chevron-mob"></i>
                            </button>
                            <div id="menu-discount-badge-pos-mob" role="listbox" class="hidden absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-30 select-none">
                              <button type="button" role="option" class="btn-disc-pos w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-normal text-left text-slate-700 hover:bg-slate-50 cursor-pointer transition" data-pos="top-left">
                                <span>Kiri Atas</span>
                              </button>
                              <button type="button" role="option" class="btn-disc-pos w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-normal text-left text-emerald-700 bg-emerald-50 cursor-pointer transition" data-pos="top-right">
                                <span>Kanan Atas</span>
                              </button>
                              <button type="button" role="option" class="btn-disc-pos w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-normal text-left text-slate-700 hover:bg-slate-50 cursor-pointer transition" data-pos="bottom-left">
                                <span>Kiri Bawah</span>
                              </button>
                              <button type="button" role="option" class="btn-disc-pos w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-normal text-left text-slate-700 hover:bg-slate-50 cursor-pointer transition" data-pos="bottom-right">
                                <span>Kanan Bawah</span>
                              </button>
                            </div>
                            <input type="hidden" id="cfg-discount-badge-position-mob" value="top-right" />
                          </div>
                        </div>`;

if (!code.includes(mobDiscPosTarget)) throw new Error('mobDiscPosTarget not found');
code = code.replace(mobDiscPosTarget, mobDiscPosRepl);

// Mobile Discount Hint & Ticket Hint
const mobDiscEndTarget = `                        </div>
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
                      <p id="cfg-ticket-promo-hint-mob" class="hidden text-[11px] text-amber-600 font-normal px-2 pt-0.5 pb-1 leading-tight">Ikon tiket hanya muncul saat produk memiliki promo/diskon aktif atau Simulasi Diskon diaktifkan.</p>
                    </div>`;

const mobDiscEndRepl = `                        </div>
                      </div>
                      <p id="cfg-discount-promo-hint-mob" class="hidden text-[11px] text-amber-600 font-normal px-2 pt-0.5 pb-1 leading-tight">Tampil saat promo aktif atau Simulasi Diskon dinyalakan.</p>
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
                      <p id="cfg-ticket-promo-hint-mob" class="hidden text-[11px] text-amber-600 font-normal px-2 pt-0.5 pb-1 leading-tight">Tampil saat promo aktif atau Simulasi Diskon dinyalakan.</p>
                    </div>`;

if (!code.includes(mobDiscEndTarget)) throw new Error('mobDiscEndTarget not found');
code = code.replace(mobDiscEndTarget, mobDiscEndRepl);

// Mobile Countdown Hint
const mobCdEndTarget = `                              <input type="text" id="cfg-countdown-border-hex-mob" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 5. Label Khusus Mobile (Hanya Model A & C, disembunyikan jika Model B) -->`;

const mobCdEndRepl = `                              <input type="text" id="cfg-countdown-border-hex-mob" value="\${primaryState.countdown_border_color || getPrimaryThemeColor()}" class="w-full px-1.5 py-1 text-[11px] font-mono font-normal border border-slate-200 rounded-md bg-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <p id="cfg-countdown-promo-hint-mob" class="hidden text-[11px] text-amber-600 font-normal px-2 pt-0.5 pb-1 leading-tight">Tampil saat promo aktif atau Simulasi Diskon dinyalakan.</p>
                    </div>

                    <!-- 5. Label Khusus Mobile (Hanya Model A & C, disembunyikan jika Model B) -->`;

if (!code.includes(mobCdEndTarget)) throw new Error('mobCdEndTarget not found');
code = code.replace(mobCdEndTarget, mobCdEndRepl);

// 5. Function setDiscountBadgePosition and dropdown toggles
const setPosFnTarget = `  function setDiscountBadgePosition(pos) {
    const valid = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    const safePos = valid.includes(pos) ? pos : 'top-right';
    const inpDesk = document.getElementById('cfg-discount-badge-position');
    const inpMob = document.getElementById('cfg-discount-badge-position-mob');
    if (inpDesk) inpDesk.value = safePos;
    if (inpMob) inpMob.value = safePos;

    ['', '-mob'].forEach(suffix => {
      const group = document.getElementById(\`cfg-discount-badge-position-group\${suffix}\`);
      if (group) {
        group.querySelectorAll('.btn-disc-pos').forEach(btn => {
          const bPos = btn.dataset.pos;
          if (bPos === safePos) {
            btn.className = 'btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md bg-white text-slate-800 shadow-2xs transition cursor-pointer text-center';
          } else {
            btn.className = 'btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center';
          }
        });
      }
    });
  }`;

const setPosFnRepl = `  const DISCOUNT_BADGE_POS_LABELS = {
    'top-left': 'Kiri Atas',
    'top-right': 'Kanan Atas',
    'bottom-left': 'Kiri Bawah',
    'bottom-right': 'Kanan Bawah'
  };

  function setDiscountBadgePosition(pos) {
    const valid = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    const safePos = valid.includes(pos) ? pos : 'top-right';
    const label = DISCOUNT_BADGE_POS_LABELS[safePos] || 'Kanan Atas';

    const inpDesk = document.getElementById('cfg-discount-badge-position');
    const inpMob = document.getElementById('cfg-discount-badge-position-mob');
    if (inpDesk) inpDesk.value = safePos;
    if (inpMob) inpMob.value = safePos;

    const lblDesk = document.getElementById('lbl-discount-badge-pos');
    const lblMob = document.getElementById('lbl-discount-badge-pos-mob');
    if (lblDesk) lblDesk.textContent = label;
    if (lblMob) lblMob.textContent = label;

    ['', '-mob'].forEach(suffix => {
      const menu = document.getElementById(\`menu-discount-badge-pos\${suffix}\`);
      if (menu) {
        menu.querySelectorAll('.btn-disc-pos').forEach(btn => {
          const bPos = btn.dataset.pos;
          const isSelected = (bPos === safePos);
          btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
          if (isSelected) {
            btn.className = 'btn-disc-pos w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-normal text-left text-emerald-700 bg-emerald-50 cursor-pointer transition';
          } else {
            btn.className = 'btn-disc-pos w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-normal text-left text-slate-700 hover:bg-slate-50 cursor-pointer transition';
          }
        });
      }
      // Backward compatibility jika ada group lama
      const group = document.getElementById(\`cfg-discount-badge-position-group\${suffix}\`);
      if (group) {
        group.querySelectorAll('.btn-disc-pos').forEach(btn => {
          const bPos = btn.dataset.pos;
          if (bPos === safePos) {
            btn.className = 'btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md bg-white text-slate-800 shadow-2xs transition cursor-pointer text-center';
          } else {
            btn.className = 'btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center';
          }
        });
      }
    });
  }

  function toggleDiscountBadgePosDropdown(open, suffix = '') {
    const menu = document.getElementById(\`menu-discount-badge-pos\${suffix}\`);
    const btn = document.getElementById(\`btn-discount-badge-pos\${suffix}\`);
    const icon = document.getElementById(\`icon-discount-badge-pos-chevron\${suffix}\`);
    if (!menu || !btn) return;
    const shouldOpen = (open !== undefined) ? open : menu.classList.contains('hidden');
    if (shouldOpen) {
      closeAllDiscountBadgePosDropdowns();
      menu.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
      if (icon) icon.classList.add('rotate-180');
    } else {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
      if (icon) icon.classList.remove('rotate-180');
    }
  }

  function closeAllDiscountBadgePosDropdowns() {
    ['', '-mob'].forEach(suffix => {
      const menu = document.getElementById(\`menu-discount-badge-pos\${suffix}\`);
      const btn = document.getElementById(\`btn-discount-badge-pos\${suffix}\`);
      const icon = document.getElementById(\`icon-discount-badge-pos-chevron\${suffix}\`);
      if (menu) menu.classList.add('hidden');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (icon) icon.classList.remove('rotate-180');
    });
  }`;

if (!code.includes(setPosFnTarget)) throw new Error('setPosFnTarget not found');
code = code.replace(setPosFnTarget, setPosFnRepl);

// 6. Live preview promo logic and hints
const livePreviewPromoTarget = `    // Status apakah countdown aktif (aktor utama daripada label khusus)
    const isCountdownActive = simulateCountdown || (enableCountdown && hasDiscount && !primaryState.is_promo_monthly_only);
    const effHasDiscount = hasDiscount || simulateCountdown;
    const effDiscPercent = (hasDiscount && discPercent > 0) ? discPercent : 50;

    const ticketHintDesk = document.getElementById('cfg-ticket-promo-hint');
    const ticketHintMob = document.getElementById('cfg-ticket-promo-hint-mob');
    const showTicketHint = Boolean(cfg.show_ticket_icon && !effHasDiscount);
    if (ticketHintDesk) {
      if (showTicketHint) ticketHintDesk.classList.remove('hidden');
      else ticketHintDesk.classList.add('hidden');
    }
    if (ticketHintMob) {
      if (showTicketHint) ticketHintMob.classList.remove('hidden');
      else ticketHintMob.classList.add('hidden');
    }

    // Hitung harga normal, harga coret & harga final di live preview
    let origStrikePrice = basePrice;
    let effFinalPrice = basePrice;
    if (hasDiscount && discountedPrice < basePrice) {
      origStrikePrice = basePrice;
      effFinalPrice = discountedPrice;
    } else if (effHasDiscount) {
      // Mode simulasi diskon 50%
      if (basePrice > 0) {
        origStrikePrice = basePrice * 2;
        effFinalPrice = basePrice;
      } else {
        origStrikePrice = 150000;
        effFinalPrice = 75000;
      }
    } else if (cfg.show_strike) {
      // Jika harga coret aktif dan tidak ada diskon promo tersimpan, sediakan harga pembanding simulasi untuk preview
      if (basePrice > 0) {
        origStrikePrice = Math.round(basePrice * 1.3);
        effFinalPrice = basePrice;
      } else {
        origStrikePrice = 150000;
        effFinalPrice = 115000;
      }
    }`;

const livePreviewPromoRepl = `    // Evaluasi deadline waktu berakhir promo (wajib valid dan belum lewat)
    const rawPromoEndDate = (document.getElementById('input-promo-end-date')?.value || primaryState.promo_end_date || '').toString().trim();
    let isDeadlineValid = false;
    let countdownTimeLeft = '1Jam';
    if (rawPromoEndDate) {
      let endDateObj = new Date(rawPromoEndDate);
      if (!isNaN(endDateObj.getTime())) {
        if (/^\\d{4}-\\d{2}-\\d{2}$/.test(rawPromoEndDate)) {
          const [y, m, d] = rawPromoEndDate.split('-').map(Number);
          endDateObj = new Date(y, m - 1, d, 23, 59, 59, 999);
        }
        const diffMs = endDateObj.getTime() - Date.now();
        if (diffMs > 0) {
          isDeadlineValid = true;
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          if (diffDays >= 1) countdownTimeLeft = \`\${diffDays}Hari\`;
          else if (diffHours >= 1) countdownTimeLeft = \`\${diffHours}Jam\`;
          else countdownTimeLeft = \`\${Math.max(1, diffMinutes)}Mnt\`;
        }
      }
    }

    const effHasDiscount = Boolean(hasDiscount || simulateCountdown);
    const effDiscPercent = (hasDiscount && discPercent > 0) ? discPercent : 50;
    const isCountdownActive = Boolean(simulateCountdown || (enableCountdown && hasDiscount && !primaryState.is_promo_monthly_only && isDeadlineValid));

    // Update 4 Promo Hints di Editor Panel (Teks Seragam: 'Tampil saat promo aktif atau Simulasi Diskon dinyalakan.')
    // 1. Strike Price Hint
    const strikeHintDesk = document.getElementById('cfg-strike-promo-hint');
    const strikeHintMob = document.getElementById('cfg-strike-promo-hint-mob');
    const showStrikeHint = Boolean(cfg.show_strike && !effHasDiscount);
    [strikeHintDesk, strikeHintMob].forEach(el => {
      if (el) {
        el.textContent = 'Tampil saat promo aktif atau Simulasi Diskon dinyalakan.';
        if (showStrikeHint) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

    // 2. Discount Badge Hint
    const discHintDesk = document.getElementById('cfg-discount-promo-hint');
    const discHintMob = document.getElementById('cfg-discount-promo-hint-mob');
    const showDiscHint = Boolean(cfg.show_discount_badge && !effHasDiscount);
    [discHintDesk, discHintMob].forEach(el => {
      if (el) {
        el.textContent = 'Tampil saat promo aktif atau Simulasi Diskon dinyalakan.';
        if (showDiscHint) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

    // 3. Ticket Icon Hint
    const ticketHintDesk = document.getElementById('cfg-ticket-promo-hint');
    const ticketHintMob = document.getElementById('cfg-ticket-promo-hint-mob');
    const showTicketHint = Boolean(cfg.show_ticket_icon && !effHasDiscount);
    [ticketHintDesk, ticketHintMob].forEach(el => {
      if (el) {
        el.textContent = 'Tampil saat promo aktif atau Simulasi Diskon dinyalakan.';
        if (showTicketHint) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

    // 4. Countdown Hint
    const cdHintDesk = document.getElementById('cfg-countdown-promo-hint');
    const cdHintMob = document.getElementById('cfg-countdown-promo-hint-mob');
    let cdHintText = '';
    let showCdHint = false;
    if (enableCountdown && !simulateCountdown) {
      if (hasDiscount && !primaryState.is_promo_monthly_only) {
        if (!isDeadlineValid) {
          showCdHint = true;
          cdHintText = 'Atur waktu berakhir promo untuk menampilkan countdown.';
        }
      } else {
        showCdHint = true;
        cdHintText = 'Tampil saat promo aktif atau Simulasi Diskon dinyalakan.';
      }
    }
    [cdHintDesk, cdHintMob].forEach(el => {
      if (el) {
        if (showCdHint) {
          el.textContent = cdHintText;
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // Hitung harga normal, harga coret & harga final di live preview
    // Aturan R6: Jangan membuat harga pembanding contoh hanya karena toggle aktif.
    let origStrikePrice = 0;
    let effFinalPrice = basePrice;
    if (hasDiscount && discountedPrice < basePrice) {
      origStrikePrice = basePrice;
      effFinalPrice = discountedPrice;
    } else if (simulateCountdown) {
      // Mode simulasi diskon 50%
      if (basePrice > 0) {
        origStrikePrice = basePrice * 2;
        effFinalPrice = basePrice;
      } else {
        origStrikePrice = 150000;
        effFinalPrice = 75000;
      }
    } else {
      origStrikePrice = 0;
      effFinalPrice = basePrice;
    }`;

if (!code.includes(livePreviewPromoTarget)) throw new Error('livePreviewPromoTarget not found');
code = code.replace(livePreviewPromoTarget, livePreviewPromoRepl);

// 7. Update renderCardPhoto agar hanya merender discount badge jika effHasDiscount
const photoTarget = `            \${cfg.show_discount_badge ? \`
              <div class="absolute \${discBadgePosClass} text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="\${discBadgeStyle}">
                <span>- % \${effDiscPercent}</span>
              </div>
            \` : ''}`;

const photoRepl = `            \${(cfg.show_discount_badge && effHasDiscount) ? \`
              <div class="absolute \${discBadgePosClass} text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="\${discBadgeStyle}">
                <span>- % \${effDiscPercent}</span>
              </div>
            \` : ''}`;

if (!code.includes(photoTarget)) throw new Error('photoTarget not found');
code = code.replaceAll(photoTarget, photoRepl);

// 8. Event listeners for dropdown & promo end date
const listenerTarget = `    // Discount Badge Position Buttons (Desktop & Mobile Sync)
    document.querySelectorAll('.btn-disc-pos').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pos = btn.dataset.pos;
        setDiscountBadgePosition(pos);
        markCardDesignAsCustom();
      });
    });`;

const listenerRepl = `    // Discount Badge Position Custom Dropdowns (Desktop & Mobile)
    ['', '-mob'].forEach(suffix => {
      const btn = document.getElementById(\`btn-discount-badge-pos\${suffix}\`);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleDiscountBadgePosDropdown(undefined, suffix);
        });
      }
    });

    document.querySelectorAll('.btn-disc-pos').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = btn.dataset.pos;
        if (pos) {
          setDiscountBadgePosition(pos);
          closeAllDiscountBadgePosDropdowns();
          markCardDesignAsCustom();
          updateProductCardLivePreview();
        }
      });
    });

    // Close dropdowns on click outside
    document.addEventListener('click', (e) => {
      const cDesk = document.getElementById('cfg-discount-badge-pos-container');
      const cMob = document.getElementById('cfg-discount-badge-pos-container-mob');
      const inDesk = cDesk && cDesk.contains(e.target);
      const inMob = cMob && cMob.contains(e.target);
      if (!inDesk && !inMob) {
        closeAllDiscountBadgePosDropdowns();
      }
    });

    // Close dropdowns on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        ['', '-mob'].forEach(suffix => {
          const menu = document.getElementById(\`menu-discount-badge-pos\${suffix}\`);
          const btn = document.getElementById(\`btn-discount-badge-pos\${suffix}\`);
          const icon = document.getElementById(\`icon-discount-badge-pos-chevron\${suffix}\`);
          if (menu && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
            if (btn) {
              btn.setAttribute('aria-expanded', 'false');
              btn.focus();
            }
            if (icon) icon.classList.remove('rotate-180');
          }
        });
      }
    });`;

if (!code.includes(listenerTarget)) throw new Error('listenerTarget not found');
code = code.replace(listenerTarget, listenerRepl);

// 9. Promo End Date listener trigger live preview
const promoEndDateTarget = `    if (pStartInp) pStartInp.addEventListener('change', e => { primaryState.promo_start_date = e.target.value || null; });
    if (pEndInp) pEndInp.addEventListener('change', e => { primaryState.promo_end_date = e.target.value || null; });`;

const promoEndDateRepl = `    if (pStartInp) pStartInp.addEventListener('change', e => { primaryState.promo_start_date = e.target.value || null; });
    if (pEndInp) {
      const handleEndDateChange = (e) => {
        primaryState.promo_end_date = e.target.value || null;
        updateProductCardLivePreview();
      };
      pEndInp.addEventListener('change', handleEndDateChange);
      pEndInp.addEventListener('input', handleEndDateChange);
    }`;

if (!code.includes(promoEndDateTarget)) throw new Error('promoEndDateTarget not found');
code = code.replace(promoEndDateTarget, promoEndDateRepl);

fs.writeFileSync('js/product-form.js', code, 'utf8');
console.log('Successfully updated js/product-form.js for TASK SC-ADMIN-CARD-PROMO-CONTROLS-09C-R6');
