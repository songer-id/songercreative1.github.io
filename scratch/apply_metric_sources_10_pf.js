const fs = require('fs');

console.log('--- Applying TASK SC-ADMIN-CARD-METRIC-SOURCES-10 to js/product-form.js ---');

let pf = fs.readFileSync('js/product-form.js', 'utf8').replace(/\r\n/g, '\n');

// 1. primaryState inisialisasi awal
const initStateTarget = `sales_count: 0,
    order_category: 'Ctk',`;
const initStateRepl = `sales_count: 0,
    admin_card_preview_metrics: {
      rating: { source: 'auto', manual_value: null },
      sales: { source: 'auto', manual_value: null }
    },
    order_category: 'Ctk',`;

if (pf.includes(initStateTarget)) {
  pf = pf.replace(initStateTarget, initStateRepl);
  console.log('✓ Added admin_card_preview_metrics to initial primaryState');
} else {
  console.log('WARN: initStateTarget not found');
}

// 2. resetFormState()
const resetTarget = `sales_count: 0,
      order_category: 'Ctk',`;
const resetRepl = `sales_count: 0,
      admin_card_preview_metrics: {
        rating: { source: 'auto', manual_value: null },
        sales: { source: 'auto', manual_value: null }
      },
      order_category: 'Ctk',`;

if (pf.includes(resetTarget)) {
  pf = pf.replace(resetTarget, resetRepl);
  console.log('✓ Added admin_card_preview_metrics to resetFormState');
} else {
  console.log('WARN: resetTarget not found');
}

// 3. loadProductForEdit()
const loadTarget = `sales_count: (prod.sales_count !== undefined && prod.sales_count !== null && !isNaN(parseInt(prod.sales_count))) ? parseInt(prod.sales_count, 10) : 0,`;
const loadRepl = `sales_count: (prod.sales_count !== undefined && prod.sales_count !== null && !isNaN(parseInt(prod.sales_count))) ? parseInt(prod.sales_count, 10) : 0,
      admin_card_preview_metrics: (prod.admin_card_preview_metrics && typeof prod.admin_card_preview_metrics === 'object') ? JSON.parse(JSON.stringify(prod.admin_card_preview_metrics)) : {
        rating: { source: 'auto', manual_value: null },
        sales: { source: 'auto', manual_value: null }
      },`;

if (pf.includes(loadTarget)) {
  pf = pf.replace(loadTarget, loadRepl);
  console.log('✓ Added admin_card_preview_metrics to loadProductForEdit');
} else {
  console.log('WARN: loadTarget not found');
}

// 4. captureCardDesignSnapshot()
const snapTarget = `enable_countdown: primaryState.enable_countdown
    };`;
const snapRepl = `enable_countdown: primaryState.enable_countdown,
      admin_card_preview_metrics: primaryState.admin_card_preview_metrics ? JSON.parse(JSON.stringify(primaryState.admin_card_preview_metrics)) : {
        rating: { source: 'auto', manual_value: null },
        sales: { source: 'auto', manual_value: null }
      }
    };`;

if (pf.includes(snapTarget)) {
  pf = pf.replace(snapTarget, snapRepl);
  console.log('✓ Added admin_card_preview_metrics to captureCardDesignSnapshot');
} else {
  console.log('WARN: snapTarget not found');
}

// 5. handleCancelCardDesign()
const cancelTarget = `primaryState.use_default_card_design = cardDesignSnapshot.use_default_card_design;`;
const cancelRepl = `primaryState.use_default_card_design = cardDesignSnapshot.use_default_card_design;
      if (cardDesignSnapshot.admin_card_preview_metrics) {
        primaryState.admin_card_preview_metrics = JSON.parse(JSON.stringify(cardDesignSnapshot.admin_card_preview_metrics));
      }`;

if (pf.includes(cancelTarget)) {
  pf = pf.replace(cancelTarget, cancelRepl);
  console.log('✓ Restored admin_card_preview_metrics in handleCancelCardDesign');
} else {
  console.log('WARN: cancelTarget not found');
}

// 6. Markup Desktop: Accordion Teks & Informasi (Rating & Terjual Subpanels)
const deskRatingTarget = `                      <!-- Rating -->
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
                      </label>`;

const deskRatingRepl = `                      <!-- Rating -->
                      <div class="py-1">
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
                        <!-- Subpanel Sumber Rating Desktop -->
                        <div id="cfg-rating-source-panel" class="px-2.5 py-2 bg-slate-50/70 rounded-md mt-1 border border-slate-100 space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Sumber Data</label>
                          </div>
                          <div class="flex items-center gap-1">
                            <button type="button" class="btn-rating-src flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-source="auto">Otomatis</button>
                            <button type="button" class="btn-rating-src flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer" data-source="manual">Manual</button>
                          </div>
                          <div id="cfg-rating-manual-container" class="hidden space-y-1 pt-1 border-t border-slate-200/60">
                            <div class="flex items-center justify-between gap-2">
                              <label for="cfg-rating-manual-val" class="text-[10px] text-slate-600 font-normal">Rating (0–5)</label>
                              <input type="number" id="cfg-rating-manual-val" min="0" max="5" step="0.1" placeholder="Contoh: 4.8" class="w-24 px-2 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                            </div>
                            <p class="text-[10px] text-slate-400 font-normal">Data contoh untuk pratinjau Admin.</p>
                            <p id="cfg-rating-manual-hint" class="hidden text-[10px] text-amber-600 font-normal">Masukkan nilai rating (0–5) untuk pratinjau.</p>
                          </div>
                        </div>
                      </div>`;

if (pf.includes(deskRatingTarget)) {
  pf = pf.replace(deskRatingTarget, deskRatingRepl);
  console.log('✓ Added desktop rating subpanel markup');
} else {
  console.log('WARN: deskRatingTarget not found');
}

const deskSalesTarget = `                      <!-- Terjual -->
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
                      </label>`;

const deskSalesRepl = `                      <!-- Terjual -->
                      <div class="py-1">
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
                        <!-- Subpanel Sumber Terjual Desktop -->
                        <div id="cfg-sales-source-panel" class="px-2.5 py-2 bg-slate-50/70 rounded-md mt-1 border border-slate-100 space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Sumber Data</label>
                          </div>
                          <div class="flex items-center gap-1">
                            <button type="button" class="btn-sales-src flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-source="auto">Otomatis</button>
                            <button type="button" class="btn-sales-src flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer" data-source="manual">Manual</button>
                          </div>
                          <div id="cfg-sales-manual-container" class="hidden space-y-1 pt-1 border-t border-slate-200/60">
                            <div class="flex items-center justify-between gap-2">
                              <label for="cfg-sales-manual-val" class="text-[10px] text-slate-600 font-normal">Jumlah Terjual</label>
                              <input type="number" id="cfg-sales-manual-val" min="0" step="1" placeholder="Contoh: 150" class="w-24 px-2 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                            </div>
                            <p class="text-[10px] text-slate-400 font-normal">Data contoh untuk pratinjau Admin.</p>
                            <p id="cfg-sales-manual-hint" class="hidden text-[10px] text-amber-600 font-normal">Masukkan angka terjual (≥ 0) untuk pratinjau.</p>
                          </div>
                        </div>
                      </div>`;

if (pf.includes(deskSalesTarget)) {
  pf = pf.replace(deskSalesTarget, deskSalesRepl);
  console.log('✓ Added desktop sales subpanel markup');
} else {
  console.log('WARN: deskSalesTarget not found');
}

// 7. Markup Desktop: Preview Wrapper Penanda "Data contoh"
const deskWrapTarget = `<!-- Card Live Box Container -->
            <div id="preview-card-outer-wrapper" class="w-full max-w-[260px] mx-auto flex justify-center transition-colors">
              <div id="product-card-preview-container" class="w-full max-w-[260px] relative overflow-hidden">`;

const deskWrapRepl = `<!-- Card Live Box Container -->
            <div id="preview-card-outer-wrapper" class="w-full max-w-[260px] mx-auto flex flex-col items-center justify-center transition-colors">
              <!-- Penanda Data Contoh Desktop (Task SC-ADMIN-CARD-METRIC-SOURCES-10) -->
              <div id="preview-sample-data-badge" class="hidden inline-flex items-center justify-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mb-2 font-normal select-none">
                <i class="bi bi-info-circle text-[10px]"></i>
                <span>Data contoh</span>
              </div>
              <div id="product-card-preview-container" class="w-full max-w-[260px] relative overflow-hidden">`;

if (pf.includes(deskWrapTarget)) {
  pf = pf.replace(deskWrapTarget, deskWrapRepl);
  console.log('✓ Added desktop sample data badge markup');
} else {
  console.log('WARN: deskWrapTarget not found');
}

// 8. Markup Mobile: Accordion Teks & Informasi (Rating & Terjual Subpanels)
const mobRatingTarget = `                      <!-- Rating -->
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
                      </label>`;

const mobRatingRepl = `                      <!-- Rating -->
                      <div class="py-1">
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
                        <!-- Subpanel Sumber Rating Mobile -->
                        <div id="cfg-rating-source-panel-mob" class="px-2.5 py-2 bg-slate-50/70 rounded-md mt-1 border border-slate-100 space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500">Sumber Data</label>
                          </div>
                          <div class="flex items-center gap-1">
                            <button type="button" class="btn-rating-src-mob flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-source="auto">Otomatis</button>
                            <button type="button" class="btn-rating-src-mob flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer" data-source="manual">Manual</button>
                          </div>
                          <div id="cfg-rating-manual-container-mob" class="hidden space-y-1 pt-1 border-t border-slate-200/60">
                            <div class="flex items-center justify-between gap-2">
                              <label for="cfg-rating-manual-val-mob" class="card-tool-label text-[11px] leading-4 text-slate-600 font-normal">Rating (0–5)</label>
                              <input type="number" id="cfg-rating-manual-val-mob" min="0" max="5" step="0.1" placeholder="Contoh: 4.8" class="w-24 px-2 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                            </div>
                            <p class="text-[10px] text-slate-400 font-normal">Data contoh untuk pratinjau Admin.</p>
                            <p id="cfg-rating-manual-hint-mob" class="hidden text-[10px] text-amber-600 font-normal">Masukkan nilai rating (0–5) untuk pratinjau.</p>
                          </div>
                        </div>
                      </div>`;

if (pf.includes(mobRatingTarget)) {
  pf = pf.replace(mobRatingTarget, mobRatingRepl);
  console.log('✓ Added mobile rating subpanel markup');
} else {
  console.log('WARN: mobRatingTarget not found');
}

const mobSalesTarget = `                      <!-- Terjual -->
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
                      </label>`;

const mobSalesRepl = `                      <!-- Terjual -->
                      <div class="py-1">
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
                        <!-- Subpanel Sumber Terjual Mobile -->
                        <div id="cfg-sales-source-panel-mob" class="px-2.5 py-2 bg-slate-50/70 rounded-md mt-1 border border-slate-100 space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500">Sumber Data</label>
                          </div>
                          <div class="flex items-center gap-1">
                            <button type="button" class="btn-sales-src-mob flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-source="auto">Otomatis</button>
                            <button type="button" class="btn-sales-src-mob flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer" data-source="manual">Manual</button>
                          </div>
                          <div id="cfg-sales-manual-container-mob" class="hidden space-y-1 pt-1 border-t border-slate-200/60">
                            <div class="flex items-center justify-between gap-2">
                              <label for="cfg-sales-manual-val-mob" class="card-tool-label text-[11px] leading-4 text-slate-600 font-normal">Jumlah Terjual</label>
                              <input type="number" id="cfg-sales-manual-val-mob" min="0" step="1" placeholder="Contoh: 150" class="w-24 px-2 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                            </div>
                            <p class="text-[10px] text-slate-400 font-normal">Data contoh untuk pratinjau Admin.</p>
                            <p id="cfg-sales-manual-hint-mob" class="hidden text-[10px] text-amber-600 font-normal">Masukkan angka terjual (≥ 0) untuk pratinjau.</p>
                          </div>
                        </div>
                      </div>`;

if (pf.includes(mobSalesTarget)) {
  pf = pf.replace(mobSalesTarget, mobSalesRepl);
  console.log('✓ Added mobile sales subpanel markup');
} else {
  console.log('WARN: mobSalesTarget not found');
}

// 9. Markup Mobile: Preview Wrapper Penanda "Data contoh"
const mobWrapTarget = `<!-- Card Preview Box -->
            <div id="preview-card-outer-wrapper-mob" class="w-full max-w-[260px] flex justify-center transition-colors">
              <div class="w-full max-w-[260px] relative overflow-hidden">`;

const mobWrapRepl = `<!-- Card Preview Box -->
            <div id="preview-card-outer-wrapper-mob" class="w-full max-w-[260px] flex flex-col items-center justify-center transition-colors">
              <!-- Penanda Data Contoh Mobile (Task SC-ADMIN-CARD-METRIC-SOURCES-10) -->
              <div id="preview-sample-data-badge-mob" class="hidden inline-flex items-center justify-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mb-2 font-normal select-none">
                <i class="bi bi-info-circle text-[10px]"></i>
                <span>Data contoh</span>
              </div>
              <div class="w-full max-w-[260px] relative overflow-hidden">`;

if (pf.includes(mobWrapTarget)) {
  pf = pf.replace(mobWrapTarget, mobWrapRepl);
  console.log('✓ Added mobile sample data badge markup');
} else {
  console.log('WARN: mobWrapTarget not found');
}

// 10. Update syncFeatureSubpanels() to toggle rating & sales source panels
const subpanelTarget = `    // 4. Special badge subpanel
    const showBadge = Boolean(document.getElementById('cfg-show-badge')?.checked || document.getElementById('cfg-show-badge-mob')?.checked);
    const badgeDesk = document.getElementById('cfg-badge-panel-desk');
    const badgeMob = document.getElementById('cfg-badge-panel-mob');
    if (badgeDesk) {
      if (showBadge) badgeDesk.classList.remove('hidden');
      else badgeDesk.classList.add('hidden');
    }
    if (badgeMob) {
      if (showBadge) badgeMob.classList.remove('hidden');
      else badgeMob.classList.add('hidden');
    }
  }`;

const subpanelRepl = `    // 4. Special badge subpanel
    const showBadge = Boolean(document.getElementById('cfg-show-badge')?.checked || document.getElementById('cfg-show-badge-mob')?.checked);
    const badgeDesk = document.getElementById('cfg-badge-panel-desk');
    const badgeMob = document.getElementById('cfg-badge-panel-mob');
    if (badgeDesk) {
      if (showBadge) badgeDesk.classList.remove('hidden');
      else badgeDesk.classList.add('hidden');
    }
    if (badgeMob) {
      if (showBadge) badgeMob.classList.remove('hidden');
      else badgeMob.classList.add('hidden');
    }

    // 5. Rating source subpanel (Task SC-ADMIN-CARD-METRIC-SOURCES-10)
    const showRating = Boolean(document.getElementById('cfg-show-rating')?.checked || document.getElementById('cfg-show-rating-mob')?.checked);
    const ratingDesk = document.getElementById('cfg-rating-source-panel');
    const ratingMob = document.getElementById('cfg-rating-source-panel-mob');
    if (ratingDesk) {
      if (showRating) ratingDesk.classList.remove('hidden');
      else ratingDesk.classList.add('hidden');
    }
    if (ratingMob) {
      if (showRating) ratingMob.classList.remove('hidden');
      else ratingMob.classList.add('hidden');
    }

    // 6. Sales source subpanel (Task SC-ADMIN-CARD-METRIC-SOURCES-10)
    const showSales = Boolean(document.getElementById('cfg-show-sales')?.checked || document.getElementById('cfg-show-sales-mob')?.checked);
    const salesDesk = document.getElementById('cfg-sales-source-panel');
    const salesMob = document.getElementById('cfg-sales-source-panel-mob');
    if (salesDesk) {
      if (showSales) salesDesk.classList.remove('hidden');
      else salesDesk.classList.add('hidden');
    }
    if (salesMob) {
      if (showSales) salesMob.classList.remove('hidden');
      else salesMob.classList.add('hidden');
    }
  }`;

if (pf.includes(subpanelTarget)) {
  pf = pf.replace(subpanelTarget, subpanelRepl);
  console.log('✓ Added rating & sales panels to syncFeatureSubpanels()');
} else {
  console.log('WARN: subpanelTarget not found');
}

// 11. Helper functions for Metric Sources DOM sync & updates
const helperTarget = `  function updateSaveAsDefaultLabels() {`;
const helperRepl = `  function getPreviewMetricsConfig() {
    if (!primaryState.admin_card_preview_metrics || typeof primaryState.admin_card_preview_metrics !== 'object') {
      primaryState.admin_card_preview_metrics = {
        rating: { source: 'auto', manual_value: null },
        sales: { source: 'auto', manual_value: null }
      };
    }
    if (!primaryState.admin_card_preview_metrics.rating) {
      primaryState.admin_card_preview_metrics.rating = { source: 'auto', manual_value: null };
    }
    if (!primaryState.admin_card_preview_metrics.sales) {
      primaryState.admin_card_preview_metrics.sales = { source: 'auto', manual_value: null };
    }
    return primaryState.admin_card_preview_metrics;
  }

  function setRatingSource(src) {
    const metrics = getPreviewMetricsConfig();
    metrics.rating.source = (src === 'manual') ? 'manual' : 'auto';
    syncMetricSourcesDOM();
    updateProductCardLivePreview();
  }

  function setSalesSource(src) {
    const metrics = getPreviewMetricsConfig();
    metrics.sales.source = (src === 'manual') ? 'manual' : 'auto';
    syncMetricSourcesDOM();
    updateProductCardLivePreview();
  }

  function syncMetricSourcesDOM() {
    const metrics = getPreviewMetricsConfig();
    const ratingSrc = metrics.rating.source || 'auto';
    const ratingVal = metrics.rating.manual_value;
    const salesSrc = metrics.sales.source || 'auto';
    const salesVal = metrics.sales.manual_value;

    // 1. Rating buttons & inputs
    document.querySelectorAll('.btn-rating-src, .btn-rating-src-mob').forEach(btn => {
      const isAuto = btn.dataset.source === 'auto';
      if ((isAuto && ratingSrc === 'auto') || (!isAuto && ratingSrc === 'manual')) {
        btn.className = btn.className.replace(/border-slate-200 bg-white text-slate-600 hover:bg-slate-50/g, 'border-emerald-500 bg-emerald-50 text-emerald-700');
        if (!btn.className.includes('border-emerald-500')) {
          btn.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-700');
          btn.classList.remove('border-slate-200', 'bg-white', 'text-slate-600', 'hover:bg-slate-50');
        }
      } else {
        btn.className = btn.className.replace(/border-emerald-500 bg-emerald-50 text-emerald-700/g, 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50');
        if (!btn.className.includes('border-slate-200')) {
          btn.classList.add('border-slate-200', 'bg-white', 'text-slate-600', 'hover:bg-slate-50');
          btn.classList.remove('border-emerald-500', 'bg-emerald-50', 'text-emerald-700');
        }
      }
    });

    ['cfg-rating-manual-container', 'cfg-rating-manual-container-mob'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (ratingSrc === 'manual') el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

    ['cfg-rating-manual-val', 'cfg-rating-manual-val-mob'].forEach(id => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) {
        el.value = (ratingVal !== null && ratingVal !== undefined && !isNaN(ratingVal)) ? ratingVal : '';
      }
    });

    ['cfg-rating-manual-hint', 'cfg-rating-manual-hint-mob'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (ratingSrc === 'manual' && (ratingVal === null || ratingVal === undefined || isNaN(ratingVal))) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // 2. Sales buttons & inputs
    document.querySelectorAll('.btn-sales-src, .btn-sales-src-mob').forEach(btn => {
      const isAuto = btn.dataset.source === 'auto';
      if ((isAuto && salesSrc === 'auto') || (!isAuto && salesSrc === 'manual')) {
        btn.className = btn.className.replace(/border-slate-200 bg-white text-slate-600 hover:bg-slate-50/g, 'border-emerald-500 bg-emerald-50 text-emerald-700');
        if (!btn.className.includes('border-emerald-500')) {
          btn.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-700');
          btn.classList.remove('border-slate-200', 'bg-white', 'text-slate-600', 'hover:bg-slate-50');
        }
      } else {
        btn.className = btn.className.replace(/border-emerald-500 bg-emerald-50 text-emerald-700/g, 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50');
        if (!btn.className.includes('border-slate-200')) {
          btn.classList.add('border-slate-200', 'bg-white', 'text-slate-600', 'hover:bg-slate-50');
          btn.classList.remove('border-emerald-500', 'bg-emerald-50', 'text-emerald-700');
        }
      }
    });

    ['cfg-sales-manual-container', 'cfg-sales-manual-container-mob'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (salesSrc === 'manual') el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

    ['cfg-sales-manual-val', 'cfg-sales-manual-val-mob'].forEach(id => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) {
        el.value = (salesVal !== null && salesVal !== undefined && !isNaN(salesVal)) ? salesVal : '';
      }
    });

    ['cfg-sales-manual-hint', 'cfg-sales-manual-hint-mob'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (salesSrc === 'manual' && (salesVal === null || salesVal === undefined || isNaN(salesVal))) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });
  }

  function updateSaveAsDefaultLabels() {`;

if (pf.includes(helperTarget)) {
  pf = pf.replace(helperTarget, helperRepl);
  console.log('✓ Added metric sources helper functions');
} else {
  console.log('WARN: helperTarget not found');
}

// 12. In loadCardConfigInputs(): call syncMetricSourcesDOM()
const loadConfigTarget = `    setChk('cfg-save-as-default-toggle', false);
    setChk('cfg-save-as-default-toggle-mob', false);
    updateDesignChoiceButtonsState();
    captureCardDesignSnapshot();
    syncEyeToggleIcons();
    syncFeatureSubpanels();
    syncCardAccordionDOM();`;

const loadConfigRepl = `    setChk('cfg-save-as-default-toggle', false);
    setChk('cfg-save-as-default-toggle-mob', false);
    updateDesignChoiceButtonsState();
    captureCardDesignSnapshot();
    syncEyeToggleIcons();
    syncFeatureSubpanels();
    syncMetricSourcesDOM();
    syncCardAccordionDOM();`;

if (pf.includes(loadConfigTarget)) {
  pf = pf.replace(loadConfigTarget, loadConfigRepl);
  console.log('✓ Added syncMetricSourcesDOM() to loadCardConfigInputs()');
} else {
  console.log('WARN: loadConfigTarget not found');
}

// 13. Event Listeners for Rating & Sales source buttons and manual inputs
const eventBindTarget = `    // Strike Price Color Listeners (Desktop & Mobile Sync)`;
const eventBindRepl = `    // Rating & Sales Metric Source Listeners (Task SC-ADMIN-CARD-METRIC-SOURCES-10)
    document.querySelectorAll('.btn-rating-src').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        setRatingSource(btn.dataset.source);
      });
    });
    document.querySelectorAll('.btn-rating-src-mob').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        setRatingSource(btn.dataset.source);
      });
    });

    document.querySelectorAll('.btn-sales-src').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        setSalesSource(btn.dataset.source);
      });
    });
    document.querySelectorAll('.btn-sales-src-mob').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        setSalesSource(btn.dataset.source);
      });
    });

    // Rating Manual Value Input (Desktop & Mobile Sync)
    const syncRatingManualInput = (sourceEl, otherId) => {
      const raw = sourceEl.value;
      const otherEl = document.getElementById(otherId);
      if (otherEl && otherEl.value !== raw) otherEl.value = raw;
      const metrics = getPreviewMetricsConfig();
      if (raw.trim() === '') {
        metrics.rating.manual_value = null;
      } else {
        const num = parseFloat(raw);
        if (!isNaN(num) && isFinite(num) && num >= 0 && num <= 5) {
          metrics.rating.manual_value = parseFloat(num.toFixed(1));
        }
      }
      ['cfg-rating-manual-hint', 'cfg-rating-manual-hint-mob'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          if (metrics.rating.manual_value === null) el.classList.remove('hidden');
          else el.classList.add('hidden');
        }
      });
      updateProductCardLivePreview();
    };

    const validateRatingManualInput = (el, otherId) => {
      const raw = el.value.trim();
      const metrics = getPreviewMetricsConfig();
      if (raw === '') {
        metrics.rating.manual_value = null;
        el.value = '';
        const otherEl = document.getElementById(otherId);
        if (otherEl) otherEl.value = '';
      } else {
        let num = parseFloat(raw);
        if (isNaN(num) || !isFinite(num) || num < 0) {
          num = 0;
        } else if (num > 5) {
          num = 5;
        }
        num = parseFloat(num.toFixed(1));
        metrics.rating.manual_value = num;
        el.value = num;
        const otherEl = document.getElementById(otherId);
        if (otherEl) otherEl.value = num;
      }
      syncMetricSourcesDOM();
      updateProductCardLivePreview();
    };

    const ratingInpDesk = document.getElementById('cfg-rating-manual-val');
    const ratingInpMob = document.getElementById('cfg-rating-manual-val-mob');
    if (ratingInpDesk) {
      ratingInpDesk.addEventListener('input', () => syncRatingManualInput(ratingInpDesk, 'cfg-rating-manual-val-mob'));
      ratingInpDesk.addEventListener('blur', () => validateRatingManualInput(ratingInpDesk, 'cfg-rating-manual-val-mob'));
      ratingInpDesk.addEventListener('change', () => validateRatingManualInput(ratingInpDesk, 'cfg-rating-manual-val-mob'));
    }
    if (ratingInpMob) {
      ratingInpMob.addEventListener('input', () => syncRatingManualInput(ratingInpMob, 'cfg-rating-manual-val'));
      ratingInpMob.addEventListener('blur', () => validateRatingManualInput(ratingInpMob, 'cfg-rating-manual-val'));
      ratingInpMob.addEventListener('change', () => validateRatingManualInput(ratingInpMob, 'cfg-rating-manual-val'));
    }

    // Sales Manual Value Input (Desktop & Mobile Sync)
    const syncSalesManualInput = (sourceEl, otherId) => {
      const raw = sourceEl.value;
      const otherEl = document.getElementById(otherId);
      if (otherEl && otherEl.value !== raw) otherEl.value = raw;
      const metrics = getPreviewMetricsConfig();
      if (raw.trim() === '') {
        metrics.sales.manual_value = null;
      } else {
        const num = parseInt(raw, 10);
        if (!isNaN(num) && isFinite(num) && num >= 0) {
          metrics.sales.manual_value = num;
        }
      }
      ['cfg-sales-manual-hint', 'cfg-sales-manual-hint-mob'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          if (metrics.sales.manual_value === null) el.classList.remove('hidden');
          else el.classList.add('hidden');
        }
      });
      updateProductCardLivePreview();
    };

    const validateSalesManualInput = (el, otherId) => {
      const raw = el.value.trim();
      const metrics = getPreviewMetricsConfig();
      if (raw === '') {
        metrics.sales.manual_value = null;
        el.value = '';
        const otherEl = document.getElementById(otherId);
        if (otherEl) otherEl.value = '';
      } else {
        let num = parseInt(raw, 10);
        if (isNaN(num) || !isFinite(num) || num < 0) {
          num = 0;
        }
        metrics.sales.manual_value = num;
        el.value = num;
        const otherEl = document.getElementById(otherId);
        if (otherEl) otherEl.value = num;
      }
      syncMetricSourcesDOM();
      updateProductCardLivePreview();
    };

    const salesInpDesk = document.getElementById('cfg-sales-manual-val');
    const salesInpMob = document.getElementById('cfg-sales-manual-val-mob');
    if (salesInpDesk) {
      salesInpDesk.addEventListener('input', () => syncSalesManualInput(salesInpDesk, 'cfg-sales-manual-val-mob'));
      salesInpDesk.addEventListener('blur', () => validateSalesManualInput(salesInpDesk, 'cfg-sales-manual-val-mob'));
      salesInpDesk.addEventListener('change', () => validateSalesManualInput(salesInpDesk, 'cfg-sales-manual-val-mob'));
    }
    if (salesInpMob) {
      salesInpMob.addEventListener('input', () => syncSalesManualInput(salesInpMob, 'cfg-sales-manual-val'));
      salesInpMob.addEventListener('blur', () => validateSalesManualInput(salesInpMob, 'cfg-sales-manual-val'));
      salesInpMob.addEventListener('change', () => validateSalesManualInput(salesInpMob, 'cfg-sales-manual-val'));
    }

    // Strike Price Color Listeners (Desktop & Mobile Sync)`;

if (pf.includes(eventBindTarget)) {
  pf = pf.replace(eventBindTarget, eventBindRepl);
  console.log('✓ Added rating & sales metric listeners to bindEvents');
} else {
  console.log('WARN: eventBindTarget not found');
}

// 14. In updateProductCardLivePreview(): resolve previewRatingText & previewSalesText & sample data badge
const renderStartTarget = `    const cardStyle = \`background-color: \${cfg.bg_color}; \${cardBorderStyle} border-radius: \${cfg.border_radius}; box-sizing: border-box;\`;
    const titleStyle = \`color: \${cfg.title_color};\`;
    const priceStyle = \`color: \${cfg.price_color};\`;
    const salesCount = (primaryState.sales_count !== undefined && primaryState.sales_count !== null && !isNaN(parseInt(primaryState.sales_count)))
      ? parseInt(primaryState.sales_count, 10)
      : 0;`;

const renderStartRepl = `    const cardStyle = \`background-color: \${cfg.bg_color}; \${cardBorderStyle} border-radius: \${cfg.border_radius}; box-sizing: border-box;\`;
    const titleStyle = \`color: \${cfg.title_color};\`;
    const priceStyle = \`color: \${cfg.price_color};\`;

    // Resolusi Metrik Pratinjau Admin (Task SC-ADMIN-CARD-METRIC-SOURCES-10)
    const metricsConfig = (primaryState.admin_card_preview_metrics && typeof primaryState.admin_card_preview_metrics === 'object')
      ? primaryState.admin_card_preview_metrics
      : { rating: { source: 'auto', manual_value: null }, sales: { source: 'auto', manual_value: null } };
    const ratingSource = metricsConfig.rating?.source || 'auto';
    const ratingManualVal = metricsConfig.rating?.manual_value;
    const salesSource = metricsConfig.sales?.source || 'auto';
    const salesManualVal = metricsConfig.sales?.manual_value;

    // 1. Resolusi Rating Pratinjau
    let previewRatingText = '';
    let hasPreviewRating = false;
    if (cfg.show_rating) {
      if (ratingSource === 'manual') {
        if (ratingManualVal !== null && ratingManualVal !== undefined && !isNaN(ratingManualVal) && isFinite(ratingManualVal)) {
          const num = Math.max(0, Math.min(5, parseFloat(ratingManualVal)));
          previewRatingText = num.toFixed(1);
          hasPreviewRating = true;
        } else {
          previewRatingText = '';
          hasPreviewRating = false;
        }
      } else {
        // Otomatis: baca data nyata terbaru dari database (jika ada) atau primaryState
        const realRating = (typeof DB !== 'undefined' && DB.getProductById && currentEditingId)
          ? DB.getProductById(currentEditingId)?.rating_avg
          : (primaryState.rating_avg ?? 5.0);
        const num = (realRating !== undefined && realRating !== null && !isNaN(parseFloat(realRating)))
          ? parseFloat(realRating)
          : 5.0;
        previewRatingText = num.toFixed(1);
        hasPreviewRating = true;
      }
    }

    // 2. Resolusi Terjual Pratinjau
    let previewSalesText = '';
    let hasPreviewSales = false;
    const realSalesCount = (typeof DB !== 'undefined' && DB.getProductById && currentEditingId)
      ? (DB.getProductById(currentEditingId)?.sales_count ?? (primaryState.sales_count !== undefined && primaryState.sales_count !== null && !isNaN(parseInt(primaryState.sales_count)) ? parseInt(primaryState.sales_count, 10) : 0))
      : ((primaryState.sales_count !== undefined && primaryState.sales_count !== null && !isNaN(parseInt(primaryState.sales_count))) ? parseInt(primaryState.sales_count, 10) : 0);

    let effSalesNumber = realSalesCount;
    if (cfg.show_sales) {
      if (salesSource === 'manual') {
        if (salesManualVal !== null && salesManualVal !== undefined && !isNaN(salesManualVal) && isFinite(salesManualVal) && salesManualVal >= 0) {
          effSalesNumber = Math.floor(salesManualVal);
          previewSalesText = formatSalesCount(effSalesNumber, false);
          hasPreviewSales = true;
        } else {
          previewSalesText = '';
          hasPreviewSales = false;
        }
      } else {
        effSalesNumber = realSalesCount;
        previewSalesText = formatSalesCount(effSalesNumber, false);
        hasPreviewSales = true;
      }
    }
    const salesCount = effSalesNumber;`;

if (pf.includes(renderStartTarget)) {
  pf = pf.replace(renderStartTarget, renderStartRepl);
  console.log('✓ Added metric resolution logic to updateProductCardLivePreview()');
} else {
  console.log('WARN: renderStartTarget not found');
}

// 15. In Model B: update selectedMetricHtml with previewRatingText & previewSalesText
const modelBMetricTarget = `      let selectedMetricHtml = '';
      if (!isExtremePrice) {
        if (cfg.show_sales) {
          selectedMetricHtml = \`
            <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap text-right shrink-0">
              \${formatSalesCount(salesCount, isNarrowPriceRow)}
            </span>
          \`;
        } else if (cfg.show_rating) {
          selectedMetricHtml = \`
            <span class="text-amber-500 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5 shrink-0 whitespace-nowrap">
              ★ 4.9
            </span>
          \`;
        }
      }`;

const modelBMetricRepl = `      let selectedMetricHtml = '';
      if (!isExtremePrice) {
        if (cfg.show_sales && hasPreviewSales) {
          selectedMetricHtml = \`
            <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap text-right shrink-0">
              \${formatSalesCount(effSalesNumber, isNarrowPriceRow)}
            </span>
          \`;
        } else if (cfg.show_rating && hasPreviewRating) {
          selectedMetricHtml = \`
            <span class="text-amber-500 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5 shrink-0 whitespace-nowrap">
              ★ \${previewRatingText}
            </span>
          \`;
        }
      }`;

if (pf.includes(modelBMetricTarget)) {
  pf = pf.replace(modelBMetricTarget, modelBMetricRepl);
  console.log('✓ Updated Model B metric rendering');
} else {
  console.log('WARN: modelBMetricTarget not found');
}

// 16. In Model C: update rating & sales rendering
const modelCRatingTarget = `                \${cfg.show_rating ? \`
                  <span class="text-amber-500 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5"><i class="bi bi-star-fill text-amber-400 text-[10px]"></i> 4.9</span>
                \` : ''}`;

const modelCRatingRepl = `                \${(cfg.show_rating && hasPreviewRating) ? \`
                  <span class="text-amber-500 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5"><i class="bi bi-star-fill text-amber-400 text-[10px]"></i> \${previewRatingText}</span>
                \` : ''}`;

if (pf.includes(modelCRatingTarget)) {
  pf = pf.replace(modelCRatingTarget, modelCRatingRepl);
  console.log('✓ Updated Model C rating rendering');
} else {
  console.log('WARN: modelCRatingTarget not found');
}

const modelCSalesTarget = `              \${cfg.show_sales ? \`
                <div class="ml-auto shrink-0 text-right leading-none pb-0.5">
                  <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap">
                    \${formatSalesCount(salesCount, false)}
                  </span>
                </div>
              \` : ''}`;

const modelCSalesRepl = `              \${(cfg.show_sales && hasPreviewSales) ? \`
                <div class="ml-auto shrink-0 text-right leading-none pb-0.5">
                  <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap">
                    \${previewSalesText}
                  </span>
                </div>
              \` : ''}`;

if (pf.includes(modelCSalesTarget)) {
  pf = pf.replace(modelCSalesTarget, modelCSalesRepl);
  console.log('✓ Updated Model C sales rendering');
} else {
  console.log('WARN: modelCSalesTarget not found');
}

// 17. In Model A: update rating & sales rendering
const modelARatingTarget = `              <!-- Rating Bintang + Countdown (Jika Aktif) atau Label Khusus (Jika Nonaktif) -->
              <div class="flex items-center gap-1.5 pt-0.5 flex-wrap">
                \${cfg.show_rating ? \`
                  <span class="text-amber-500 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5"><i class="bi bi-star-fill text-amber-400 text-[10px]"></i> 4.9</span>
                \` : ''}`;

const modelARatingRepl = `              <!-- Rating Bintang + Countdown (Jika Aktif) atau Label Khusus (Jika Nonaktif) -->
              <div class="flex items-center gap-1.5 pt-0.5 flex-wrap">
                \${(cfg.show_rating && hasPreviewRating) ? \`
                  <span class="text-amber-500 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5"><i class="bi bi-star-fill text-amber-400 text-[10px]"></i> \${previewRatingText}</span>
                \` : ''}`;

if (pf.includes(modelARatingTarget)) {
  pf = pf.replace(modelARatingTarget, modelARatingRepl);
  console.log('✓ Updated Model A rating rendering');
} else {
  console.log('WARN: modelARatingTarget not found');
}

const modelASalesTarget = `              \${cfg.show_sales ? \`
                <div class="ml-auto shrink-0 text-right leading-none pb-0.5">
                  <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap">
                    \${formatSalesCount(salesCount, false)}
                  </span>
                </div>
              \` : ''}`;

const modelASalesRepl = `              \${(cfg.show_sales && hasPreviewSales) ? \`
                <div class="ml-auto shrink-0 text-right leading-none pb-0.5">
                  <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap">
                    \${previewSalesText}
                  </span>
                </div>
              \` : ''}`;

if (pf.includes(modelASalesTarget)) {
  pf = pf.replace(modelASalesTarget, modelASalesRepl);
  console.log('✓ Updated Model A sales rendering');
} else {
  console.log('WARN: modelASalesTarget not found');
}

// 18. Update Sample Data Badge visibility at end of updateProductCardLivePreview()
const badgeEndTarget = `    previewContainer.innerHTML = cardHtml;
    const mobilePreviewBox = document.getElementById('mobile-card-preview-container');
    if (mobilePreviewBox) {
      mobilePreviewBox.innerHTML = cardHtml;
    }`;

const badgeEndRepl = `    // Evaluasi Penanda "Data contoh" di Area Pratinjau Admin (Task SC-ADMIN-CARD-METRIC-SOURCES-10)
    let isSampleDataActive = false;
    if (variant === 'B') {
      if (cfg.show_sales && hasPreviewSales && salesSource === 'manual') {
        isSampleDataActive = true;
      } else if (cfg.show_rating && hasPreviewRating && ratingSource === 'manual') {
        isSampleDataActive = true;
      }
    } else {
      if (cfg.show_rating && hasPreviewRating && ratingSource === 'manual') {
        isSampleDataActive = true;
      }
      if (cfg.show_sales && hasPreviewSales && salesSource === 'manual') {
        isSampleDataActive = true;
      }
    }

    [
      document.getElementById('preview-sample-data-badge'),
      document.getElementById('preview-sample-data-badge-mob')
    ].forEach(badge => {
      if (badge) {
        if (isSampleDataActive) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
      }
    });

    previewContainer.innerHTML = cardHtml;
    const mobilePreviewBox = document.getElementById('mobile-card-preview-container');
    if (mobilePreviewBox) {
      mobilePreviewBox.innerHTML = cardHtml;
    }`;

if (pf.includes(badgeEndTarget)) {
  pf = pf.replace(badgeEndTarget, badgeEndRepl);
  console.log('✓ Added sample data badge visibility update');
} else {
  console.log('WARN: badgeEndTarget not found');
}

fs.writeFileSync('js/product-form.js', pf, 'utf8');
console.log('product-form.js updated successfully!');

