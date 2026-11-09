const fs = require('fs');
let content = fs.readFileSync('js/product-form.js', 'utf8');
const isCrlf = content.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

function replaceExact(name, target, replacement) {
  const normTarget = target.replace(/\n/g, eol);
  const normReplacement = replacement.replace(/\n/g, eol);
  if (!content.includes(normTarget)) {
    console.error(`Target not found for: ${name}`);
    process.exit(1);
  }
  content = content.replace(normTarget, normReplacement);
  console.log(`Replaced: ${name}`);
}

// 1. Update wizard-form-col padding and sidebar width
replaceExact('wizard-form-col-markup',
`<div id="wizard-form-col" class="w-full \${isLivePreviewOpen && primaryState.is_active ? 'lg:pr-[300px] xl:pr-[340px]' : ''}`,
`<div id="wizard-form-col" class="w-full \${isLivePreviewOpen && primaryState.is_active ? 'lg:pr-[320px] xl:pr-[340px]' : ''}`
);

replaceExact('sidebar-width-markup',
`<aside id="desktop-preview-sidebar" class="fixed right-0 top-16 h-[calc(100vh-4rem)] w-[300px] xl:w-[340px]`,
`<aside id="desktop-preview-sidebar" class="fixed right-0 top-16 h-[calc(100vh-4rem)] w-[320px] xl:w-[340px]`
);

replaceExact('wizard-form-col-js-add',
"wizardCol.classList.add('lg:pr-[300px]', 'xl:pr-[340px]');",
"wizardCol.classList.add('lg:pr-[320px]', 'xl:pr-[340px]');"
);

// 2. Update #card-customization-section and #card-customization-section-mob
replaceExact('desktop-customization-section-container',
`<div id="card-customization-section" class="hidden w-full max-w-[260px] mx-auto p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-3">`,
`<div id="card-customization-section" class="hidden w-full bg-transparent border-0 shadow-none p-0 space-y-3">`
);

replaceExact('mobile-customization-section-container',
`<div id="card-customization-section-mob" class="hidden w-full max-w-[260px] p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-3">`,
`<div id="card-customization-section-mob" class="hidden w-full bg-transparent border-0 shadow-none p-0 space-y-3">`
);

// 3. Update Kelompok 3: Label Khusus (Desktop)
const deskBadgeGroupTarget = `                <!-- Kelompok 3: Label Khusus -->
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
                </div>`;

const deskBadgeGroupReplacement = `                <!-- Kelompok 3: Label Khusus -->
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
                </div>`;

replaceExact('desktop-badge-group', deskBadgeGroupTarget, deskBadgeGroupReplacement);

// 4. Update Kelompok 3: Label Khusus Mobile
const mobBadgeGroupTarget = `                <!-- Kelompok 3: Label Khusus Mobile -->
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
                </div>`;

const mobBadgeGroupReplacement = `                <!-- Kelompok 3: Label Khusus Mobile -->
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
                </div>`;

replaceExact('mobile-badge-group', mobBadgeGroupTarget, mobBadgeGroupReplacement);

// 5. Add badge helpers before getCardConfigFromDOM
const helpersTarget = `  function parseBorderWidth(val, defaultVal = 1) {`;
const badgeHelpers = `  function hexToSubtleHex(hex, opacity = 0.12) {
    if (!hex || typeof hex !== 'string') return '#ecfdf5';
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (clean.length !== 6) return '#ecfdf5';
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const rBg = Math.round(r * opacity + 255 * (1 - opacity));
    const gBg = Math.round(g * opacity + 255 * (1 - opacity));
    const bBg = Math.round(b * opacity + 255 * (1 - opacity));
    return \`#\${((1 << 24) + (rBg << 16) + (gBg << 8) + bBg).toString(16).slice(1)}\`;
  }

  function hexToBorderHex(hex, opacity = 0.35) {
    if (!hex || typeof hex !== 'string') return '#a7f3d0';
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (clean.length !== 6) return '#a7f3d0';
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const rBrd = Math.round(r * opacity + 255 * (1 - opacity));
    const gBrd = Math.round(g * opacity + 255 * (1 - opacity));
    const bBrd = Math.round(b * opacity + 255 * (1 - opacity));
    return \`#\${((1 << 24) + (rBrd << 16) + (gBrd << 8) + bBrd).toString(16).slice(1)}\`;
  }

  function getThemeDefaultBadgeColors(variantCode) {
    if (variantCode === 'B') {
      return {
        text: '#6b21a8',
        bg: '#faf5ff',
        border: '#e9d5ff',
        radius: '6px',
        style: 'bg'
      };
    }
    const primary = getPrimaryThemeColor();
    const subtleBg = hexToSubtleHex(primary, 0.12);
    const borderCol = hexToBorderHex(primary, 0.35);
    return {
      text: primary,
      bg: subtleBg,
      border: borderCol,
      radius: '6px',
      style: 'bg'
    };
  }

  function parseBadgeRadius(val, defaultVal = 6) {
    if (val === undefined || val === null || val === '') return defaultVal;
    const num = parseInt(val, 10);
    if (isNaN(num)) return defaultVal;
    return Math.max(0, Math.min(12, num));
  }

  function updateBadgeRadiusPresetButtons(val) {
    const num = parseBadgeRadius(val, 6);
    document.querySelectorAll('.btn-badge-radius-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (btnVal === num) {
        btn.className = 'btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const valLabelDesk = document.getElementById('cfg-badge-radius-val');
    const valLabelMob = document.getElementById('cfg-badge-radius-val-mob');
    if (valLabelDesk) valLabelDesk.textContent = \`\${num} px\`;
    if (valLabelMob) valLabelMob.textContent = \`\${num} px\`;
  }

  function setBadgeStyleMode(mode) {
    const safeMode = mode === 'border' ? 'border' : 'bg';
    const inpDesk = document.getElementById('cfg-badge-style');
    const inpMob = document.getElementById('cfg-badge-style-mob');
    if (inpDesk) inpDesk.value = safeMode;
    if (inpMob) inpMob.value = safeMode;

    ['', '-mob'].forEach(suffix => {
      const group = document.getElementById(\`cfg-badge-style-group\${suffix}\`);
      if (group) {
        group.querySelectorAll('.btn-badge-style').forEach(btn => {
          const bStyle = btn.dataset.style;
          if (bStyle === safeMode) {
            btn.className = 'btn-badge-style py-1 px-2 text-[11px] font-normal rounded-md bg-white text-slate-800 shadow-2xs transition cursor-pointer text-center';
          } else {
            btn.className = 'btn-badge-style py-1 px-2 text-[11px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center';
          }
        });
      }

      const bgWrap = document.getElementById(\`cfg-badge-bg-wrap\${suffix}\`);
      const borderWrap = document.getElementById(\`cfg-badge-border-wrap\${suffix}\`);
      if (bgWrap) {
        if (safeMode === 'bg') bgWrap.classList.remove('hidden');
        else bgWrap.classList.add('hidden');
      }
      if (borderWrap) {
        if (safeMode === 'border') borderWrap.classList.remove('hidden');
        else borderWrap.classList.add('hidden');
      }
    });
  }

  function parseBorderWidth(val, defaultVal = 1) {`;

replaceExact('badge-helpers', helpersTarget, badgeHelpers);

// 6. Update getCardConfigFromDOM to read badge properties
const getCardConfigTarget = `      show_badge: showBadgeVal,
      show_category_badge: showBadgeVal,
      discount_badge_radius: document.getElementById('cfg-discount-badge-radius')?.value || '8px',
      discount_badge_text_color: document.getElementById('cfg-discount-badge-text-color')?.value || '#ffffff',
      discount_badge_bg_color: document.getElementById('cfg-discount-badge-bg-color')?.value || defThemeColor,
      discount_badge_border_color: document.getElementById('cfg-discount-badge-border-color')?.value || defThemeColor,
      badge_radius: document.getElementById('cfg-badge-radius')?.value || '6px',
      badge_text_color: document.getElementById('cfg-badge-text-color')?.value || defThemeColor,
      badge_bg_color: document.getElementById('cfg-badge-bg-color')?.value || '#ecfdf5',
      badge_border_color: document.getElementById('cfg-badge-border-color')?.value || '#a7f3d0',`;

const getCardConfigReplacement = `      show_badge: showBadgeVal,
      show_category_badge: showBadgeVal,
      discount_badge_radius: document.getElementById('cfg-discount-badge-radius')?.value || '8px',
      discount_badge_text_color: document.getElementById('cfg-discount-badge-text-color')?.value || '#ffffff',
      discount_badge_bg_color: document.getElementById('cfg-discount-badge-bg-color')?.value || defThemeColor,
      discount_badge_border_color: document.getElementById('cfg-discount-badge-border-color')?.value || defThemeColor,
      badge_style: getVal('cfg-badge-style', 'cfg-badge-style-mob', 'bg'),
      badge_radius: \`\${parseBadgeRadius(getVal('cfg-badge-radius', 'cfg-badge-radius-mob', '6'), 6)}px\`,
      badge_text_color: getVal('cfg-badge-text-color', 'cfg-badge-text-color-mob', getThemeDefaultBadgeColors(primaryState.card_variant || 'A').text),
      badge_bg_color: getVal('cfg-badge-bg-color', 'cfg-badge-bg-color-mob', getThemeDefaultBadgeColors(primaryState.card_variant || 'A').bg),
      badge_border_color: getVal('cfg-badge-border-color', 'cfg-badge-border-color-mob', getThemeDefaultBadgeColors(primaryState.card_variant || 'A').border),`;

replaceExact('getCardConfigFromDOM-badge', getCardConfigTarget, getCardConfigReplacement);

// 7. Update loadCardConfigInputs to populate badge properties
const loadConfigBadgeTarget = `    // Badge styling tokens
    const defBadgeText = variantCode === 'B' ? '#6b21a8' : defThemeColor;
    const defBadgeBg = variantCode === 'B' ? '#faf5ff' : '#ecfdf5';
    const defBadgeBorder = variantCode === 'B' ? '#e9d5ff' : '#a7f3d0';

    setVal('cfg-badge-radius', cfg.badge_radius || '6px');
    setVal('cfg-badge-text-color', cfg.badge_text_color || defBadgeText);
    setVal('cfg-badge-text-hex', cfg.badge_text_color || defBadgeText);
    setVal('cfg-badge-bg-color', cfg.badge_bg_color || defBadgeBg);
    setVal('cfg-badge-bg-hex', cfg.badge_bg_color || defBadgeBg);
    setVal('cfg-badge-border-color', cfg.badge_border_color || defBadgeBorder);
    setVal('cfg-badge-border-hex', cfg.badge_border_color || defBadgeBorder);`;

const loadConfigBadgeReplacement = `    // Badge styling tokens (Dynamic Theme Default)
    const defBadgeColors = getThemeDefaultBadgeColors(variantCode);
    const bStyle = cfg.badge_style || 'bg';
    setBadgeStyleMode(bStyle);

    const bRadiusNum = parseBadgeRadius(cfg.badge_radius, 6);
    setVal('cfg-badge-radius', bRadiusNum);
    updateBadgeRadiusPresetButtons(bRadiusNum);

    const bText = cfg.badge_text_color || defBadgeColors.text;
    setVal('cfg-badge-text-color', bText);
    setVal('cfg-badge-text-hex', bText);

    const bBg = cfg.badge_bg_color || defBadgeColors.bg;
    setVal('cfg-badge-bg-color', bBg);
    setVal('cfg-badge-bg-hex', bBg);

    const bBorder = cfg.badge_border_color || defBadgeColors.border;
    setVal('cfg-badge-border-color', bBorder);
    setVal('cfg-badge-border-hex', bBorder);`;

replaceExact('loadCardConfigInputs-badge', loadConfigBadgeTarget, loadConfigBadgeReplacement);

// 8. Update updateProductCardLivePreview badge style rendering
const livePreviewBadgeTarget = `    // Badge Custom Styles (label khusus)
    const badgeRadius = document.getElementById('cfg-badge-radius')?.value || '6px';
    const badgeTextColor = document.getElementById('cfg-badge-text-color')?.value || (variant === 'B' ? '#6b21a8' : defCardThemeColor);
    const badgeBgColor = document.getElementById('cfg-badge-bg-color')?.value || (variant === 'B' ? '#faf5ff' : '#ecfdf5');
    const badgeBorderColor = document.getElementById('cfg-badge-border-color')?.value || (variant === 'B' ? '#e9d5ff' : '#a7f3d0');
    const badgeStyle = \`color: \${badgeTextColor}; background-color: \${badgeBgColor}; border: 1px solid \${badgeBorderColor}; border-radius: \${badgeRadius};\`;`;

const livePreviewBadgeReplacement = `    // Badge Custom Styles (label khusus)
    const defBadge = getThemeDefaultBadgeColors(variant);
    const rawBadgeStyle = document.getElementById('cfg-badge-style')?.value ?? primaryState.card_config?.badge_style;
    const badgeStyleMode = rawBadgeStyle || (primaryState.card_config?.badge_style || defBadge.style || 'bg');

    const rawBadgeRadius = document.getElementById('cfg-badge-radius')?.value ?? document.getElementById('cfg-badge-radius-mob')?.value ?? primaryState.card_config?.badge_radius;
    const badgeRadiusNum = parseBadgeRadius(rawBadgeRadius, 6);
    const badgeRadius = \`\${badgeRadiusNum}px\`;

    const rawBadgeText = document.getElementById('cfg-badge-text-color')?.value;
    const rawBadgeBg = document.getElementById('cfg-badge-bg-color')?.value;
    const rawBadgeBorder = document.getElementById('cfg-badge-border-color')?.value;

    const badgeTextColor = (isCustomMode && rawBadgeText && rawBadgeText.toLowerCase() !== '#000000')
      ? rawBadgeText
      : (primaryState.card_config?.badge_text_color || defBadge.text);

    const badgeBgColor = (isCustomMode && rawBadgeBg && rawBadgeBg.toLowerCase() !== '#000000')
      ? rawBadgeBg
      : (primaryState.card_config?.badge_bg_color || defBadge.bg);

    const badgeBorderColor = (isCustomMode && rawBadgeBorder && rawBadgeBorder.toLowerCase() !== '#000000')
      ? rawBadgeBorder
      : (primaryState.card_config?.badge_border_color || defBadge.border);

    let badgeStyle = '';
    if (badgeStyleMode === 'border') {
      badgeStyle = \`color: \${badgeTextColor}; background-color: transparent; border: 1px solid \${badgeBorderColor}; border-radius: \${badgeRadius};\`;
    } else if (badgeStyleMode === 'bg') {
      badgeStyle = \`color: \${badgeTextColor}; background-color: \${badgeBgColor}; border: none; border-radius: \${badgeRadius};\`;
    } else {
      // Legacy compatibility
      badgeStyle = \`color: \${badgeTextColor}; background-color: \${badgeBgColor}; border: 1px solid \${badgeBorderColor}; border-radius: \${badgeRadius};\`;
    }`;

replaceExact('livePreviewBadge', livePreviewBadgeTarget, livePreviewBadgeReplacement);

// 9. Update event listeners in bindCardConfigEvents
const eventListenersTarget = `    document.querySelectorAll('.btn-border-radius-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleBrInput(btn.dataset.value);
      });
    });`;

const eventListenersReplacement = `    document.querySelectorAll('.btn-border-radius-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleBrInput(btn.dataset.value);
      });
    });

    // Badge Radius Sliders and Presets (Desktop & Mobile Sync)
    const badgeRadiusDesk = document.getElementById('cfg-badge-radius');
    const badgeRadiusMob = document.getElementById('cfg-badge-radius-mob');

    const handleBadgeRadiusInput = (val) => {
      const num = parseBadgeRadius(val, 6);
      if (badgeRadiusDesk) badgeRadiusDesk.value = num;
      if (badgeRadiusMob) badgeRadiusMob.value = num;
      updateBadgeRadiusPresetButtons(num);
      markCardDesignAsCustom();
    };

    if (badgeRadiusDesk) {
      badgeRadiusDesk.addEventListener('input', (e) => handleBadgeRadiusInput(e.target.value));
    }
    if (badgeRadiusMob) {
      badgeRadiusMob.addEventListener('input', (e) => handleBadgeRadiusInput(e.target.value));
    }

    document.querySelectorAll('.btn-badge-radius-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleBadgeRadiusInput(btn.dataset.value);
      });
    });

    // Badge Style Mode Segmented Controls (Desktop & Mobile Sync)
    document.querySelectorAll('.btn-badge-style').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const mode = btn.dataset.style;
        setBadgeStyleMode(mode);
        markCardDesignAsCustom();
      });
    });

    // Badge Color Sync (Desktop & Mobile, Color & Hex)
    const badgeColorPairs = [
      { color: 'cfg-badge-text-color', hex: 'cfg-badge-text-hex' },
      { color: 'cfg-badge-bg-color', hex: 'cfg-badge-bg-hex' },
      { color: 'cfg-badge-border-color', hex: 'cfg-badge-border-hex' }
    ];
    badgeColorPairs.forEach(pair => {
      const deskColor = document.getElementById(pair.color);
      const deskHex = document.getElementById(pair.hex);
      const mobColor = document.getElementById(\`\${pair.color}-mob\`);
      const mobHex = document.getElementById(\`\${pair.hex}-mob\`);

      const syncAllBadgeColors = (val) => {
        if (deskColor) deskColor.value = val;
        if (deskHex) deskHex.value = val;
        if (mobColor) mobColor.value = val;
        if (mobHex) mobHex.value = val;
        markCardDesignAsCustom();
      };

      if (deskColor) deskColor.addEventListener('input', e => syncAllBadgeColors(e.target.value));
      if (deskHex) deskHex.addEventListener('input', e => syncAllBadgeColors(e.target.value));
      if (mobColor) mobColor.addEventListener('input', e => syncAllBadgeColors(e.target.value));
      if (mobHex) mobHex.addEventListener('input', e => syncAllBadgeColors(e.target.value));
    });`;

replaceExact('eventListeners-badge', eventListenersTarget, eventListenersReplacement);

fs.writeFileSync('js/product-form.js', content, 'utf8');
console.log('js/product-form.js updated successfully for Task 09C');

