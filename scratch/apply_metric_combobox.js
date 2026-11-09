const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');
const isCrlf = pf.includes('\r\n');
if (isCrlf) {
  pf = pf.replace(/\r\n/g, '\n');
}

// 1. Add options in getOptionsForDatalist
const targetDatalist = `    } else if (listId === 'footer-texts-history-list') {`;
if (!pf.includes(targetDatalist)) {
  console.error('Target getOptionsForDatalist not found!');
  process.exit(1);
}

const replacementDatalist = `    } else if (listId === 'datalist-rating-manual-options') {
      return ['5.0', '4.9', '4.8', '4.7'];
    } else if (listId === 'datalist-sales-manual-options') {
      return [
        { value: '50', label: '50' },
        { value: '100', label: '100 (100+)' },
        { value: '500', label: '500 (500+)' },
        { value: '1000', label: '1000 (1RB+)' },
        { value: '10000', label: '10000 (10RB+)' }
      ];
    } else if (listId === 'footer-texts-history-list') {`;

pf = pf.replace(targetDatalist, replacementDatalist);
console.log('1. Added datalist options for rating & sales.');

// 2. Enhance renderItems in bindCleanDatalistPopovers to support object options { value, label }
const targetRenderFilter = `        // Khusus input single-option (Max. Order 'Tanpa Batas' / Stok 'Unlimited'), jangan pernah filter saran saat user mengetik angka!
        if (!isSingleOption && !isExplicitOpen && filterText.trim()) {
          const q = filterText.toLowerCase().trim();
          const exactMatch = options.some(opt => opt.toLowerCase() === q);
          if (exactMatch) {
            filtered = options;
          } else {
            filtered = options.filter(opt => opt.toLowerCase().includes(q));
          }
        }`;

const replacementRenderFilter = `        // Khusus input single-option (Max. Order 'Tanpa Batas' / Stok 'Unlimited'), jangan pernah filter saran saat user mengetik angka!
        if (!isSingleOption && !isExplicitOpen && filterText.trim()) {
          const q = filterText.toLowerCase().trim();
          const exactMatch = options.some(opt => {
            const v = (typeof opt === 'object' && opt !== null ? (opt.value || opt.label || '') : String(opt || '')).toLowerCase();
            return v === q;
          });
          if (exactMatch) {
            filtered = options;
          } else {
            filtered = options.filter(opt => {
              const v = (typeof opt === 'object' && opt !== null ? ((opt.value || '') + ' ' + (opt.label || '')) : String(opt || '')).toLowerCase();
              return v.includes(q);
            });
          }
        }`;

if (!pf.includes(targetRenderFilter)) {
  console.error('Target targetRenderFilter not found!');
  process.exit(1);
}
pf = pf.replace(targetRenderFilter, replacementRenderFilter);
console.log('2. Enhanced renderItems filter matching.');

// 3. Update popover.innerHTML mapping in renderItems
const targetPopoverMap = `        popover.innerHTML = filtered.map(opt => {
          const optLower = opt.toLowerCase();
          const isSelected = currentValLower === optLower || (input.classList.contains('combo-max-order-input') && optLower === 'tanpa batas' && input.placeholder === 'Tanpa Batas');
          const isUsedElsewhere = !isSelected && usedValues.has(optLower);

          if (isUsedElsewhere) {
            return \`
              <div class="clean-datalist-item is-disabled-used w-full text-left px-3 py-1.5 text-xs text-slate-300 select-none" data-value="\${escapeSafeHtml(opt)}">
                <span>\${escapeSafeHtml(opt)}</span>
              </div>
            \`;
          }

          if (isSingleOption) {
            return \`
              <div class="clean-datalist-item px-2.5 py-1.5 text-xs text-center text-slate-700 hover:bg-slate-100 hover:text-[var(--color-primary)] cursor-pointer rounded transition flex items-center justify-center font-medium \${isSelected ? 'font-semibold is-selected bg-[var(--color-primary-subtle)] text-[var(--color-primary)]' : ''}" data-value="\${escapeSafeHtml(opt)}">
                <span>\${escapeSafeHtml(opt)}</span>
              </div>
            \`;
          }

          return \`
            <div class="clean-datalist-item px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 hover:text-[var(--color-primary)] cursor-pointer rounded transition flex items-center justify-between \${isSelected ? 'font-semibold is-selected bg-[var(--color-primary-subtle)] text-[var(--color-primary)]' : ''}" data-value="\${escapeSafeHtml(opt)}">
              <span>\${escapeSafeHtml(opt)}</span>
              \${isSelected ? '<i class="bi bi-check2 text-xs text-[var(--color-primary)] font-bold"></i>' : ''}
            </div>
          \`;
        }).join('');`;

const replacementPopoverMap = `        popover.innerHTML = filtered.map(opt => {
          const optVal = typeof opt === 'object' && opt !== null ? String(opt.value || '') : String(opt || '');
          const optLabel = typeof opt === 'object' && opt !== null ? String(opt.label || opt.value || '') : String(opt || '');
          const optLower = optVal.toLowerCase();
          const isSelected = currentValLower === optLower || (input.classList.contains('combo-max-order-input') && optLower === 'tanpa batas' && input.placeholder === 'Tanpa Batas');
          const isUsedElsewhere = !isSelected && usedValues.has(optLower);

          if (isUsedElsewhere) {
            return \`
              <div class="clean-datalist-item is-disabled-used w-full text-left px-3 py-1.5 text-xs text-slate-300 select-none" data-value="\${escapeSafeHtml(optVal)}">
                <span>\${escapeSafeHtml(optLabel)}</span>
              </div>
            \`;
          }

          if (isSingleOption) {
            return \`
              <div class="clean-datalist-item px-2.5 py-1.5 text-xs text-center text-slate-700 hover:bg-slate-100 hover:text-[var(--color-primary)] cursor-pointer rounded transition flex items-center justify-center font-medium \${isSelected ? 'font-semibold is-selected bg-[var(--color-primary-subtle)] text-[var(--color-primary)]' : ''}" data-value="\${escapeSafeHtml(optVal)}">
                <span>\${escapeSafeHtml(optLabel)}</span>
              </div>
            \`;
          }

          return \`
            <div class="clean-datalist-item px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 hover:text-[var(--color-primary)] cursor-pointer rounded transition flex items-center justify-between \${isSelected ? 'font-semibold is-selected bg-[var(--color-primary-subtle)] text-[var(--color-primary)]' : ''}" data-value="\${escapeSafeHtml(optVal)}">
              <span>\${escapeSafeHtml(optLabel)}</span>
              \${isSelected ? '<i class="bi bi-check2 text-xs text-[var(--color-primary)] font-bold"></i>' : ''}
            </div>
          \`;
        }).join('');`;

if (!pf.includes(targetPopoverMap)) {
  console.error('Target targetPopoverMap not found!');
  process.exit(1);
}
pf = pf.replace(targetPopoverMap, replacementPopoverMap);
console.log('3. Updated popover.innerHTML mapping in renderItems.');

// 4. Update markup for Desktop Rating & Terjual
const targetDeskRating = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-rating-manual-val" class="text-[10px] text-slate-600 font-normal">Rating (0–5)</label>
                              <input type="number" id="cfg-rating-manual-val" min="0" max="5" step="0.1" placeholder="Contoh: 4.8" class="w-24 px-2 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                            </div>`;

const replacementDeskRating = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-rating-manual-val" class="text-[10px] text-slate-600 font-normal">Rating (0–5)</label>
                              <div class="relative w-28 clean-datalist-wrapper">
                                <input type="text" id="cfg-rating-manual-val" list="datalist-rating-manual-options" data-datalist-id="datalist-rating-manual-options" autocomplete="off" placeholder="Contoh: 4.8" class="clean-datalist-input w-full px-2.5 pr-8 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              </div>
                            </div>`;

if (!pf.includes(targetDeskRating)) {
  console.error('Target targetDeskRating not found!');
  process.exit(1);
}
pf = pf.replace(targetDeskRating, replacementDeskRating);
console.log('4. Updated Desktop Rating markup.');

const targetDeskSales = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-sales-manual-val" class="text-[10px] text-slate-600 font-normal">Jumlah Terjual</label>
                              <input type="number" id="cfg-sales-manual-val" min="0" step="1" placeholder="Contoh: 150" class="w-24 px-2 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                            </div>`;

const replacementDeskSales = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-sales-manual-val" class="text-[10px] text-slate-600 font-normal">Jumlah Terjual</label>
                              <div class="relative w-36 clean-datalist-wrapper">
                                <input type="text" id="cfg-sales-manual-val" list="datalist-sales-manual-options" data-datalist-id="datalist-sales-manual-options" autocomplete="off" placeholder="Contoh: 150" class="clean-datalist-input w-full px-2.5 pr-8 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              </div>
                            </div>`;

if (!pf.includes(targetDeskSales)) {
  console.error('Target targetDeskSales not found!');
  process.exit(1);
}
pf = pf.replace(targetDeskSales, replacementDeskSales);
console.log('5. Updated Desktop Sales markup.');

// 5. Update markup for Mobile Rating & Terjual
const targetMobRating = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-rating-manual-val-mob" class="card-tool-label text-[11px] leading-4 text-slate-600 font-normal">Rating (0–5)</label>
                              <input type="number" id="cfg-rating-manual-val-mob" min="0" max="5" step="0.1" placeholder="Contoh: 4.8" class="w-24 px-2 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                            </div>`;

const replacementMobRating = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-rating-manual-val-mob" class="card-tool-label text-[11px] leading-4 text-slate-600 font-normal">Rating (0–5)</label>
                              <div class="relative w-28 clean-datalist-wrapper">
                                <input type="text" id="cfg-rating-manual-val-mob" list="datalist-rating-manual-options" data-datalist-id="datalist-rating-manual-options" autocomplete="off" placeholder="Contoh: 4.8" class="clean-datalist-input w-full px-2.5 pr-8 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              </div>
                            </div>`;

if (!pf.includes(targetMobRating)) {
  console.error('Target targetMobRating not found!');
  process.exit(1);
}
pf = pf.replace(targetMobRating, replacementMobRating);
console.log('6. Updated Mobile Rating markup.');

const targetMobSales = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-sales-manual-val-mob" class="card-tool-label text-[11px] leading-4 text-slate-600 font-normal">Jumlah Terjual</label>
                              <input type="number" id="cfg-sales-manual-val-mob" min="0" step="1" placeholder="Contoh: 150" class="w-24 px-2 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                            </div>`;

const replacementMobSales = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-sales-manual-val-mob" class="card-tool-label text-[11px] leading-4 text-slate-600 font-normal">Jumlah Terjual</label>
                              <div class="relative w-36 clean-datalist-wrapper">
                                <input type="text" id="cfg-sales-manual-val-mob" list="datalist-sales-manual-options" data-datalist-id="datalist-sales-manual-options" autocomplete="off" placeholder="Contoh: 150" class="clean-datalist-input w-full px-2.5 pr-8 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              </div>
                            </div>`;

if (!pf.includes(targetMobSales)) {
  console.error('Target targetMobSales not found!');
  process.exit(1);
}
pf = pf.replace(targetMobSales, replacementMobSales);
console.log('7. Updated Mobile Sales markup.');

// 6. Update syncMetricSourcesDOM to call _syncDatalistControls()
const targetSyncDom = `    ['cfg-rating-manual-val', 'cfg-rating-manual-val-mob'].forEach(id => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) {
        el.value = (ratingVal !== null && ratingVal !== undefined && !isNaN(ratingVal)) ? ratingVal : '';
      }
    });`;

const replacementSyncDom = `    ['cfg-rating-manual-val', 'cfg-rating-manual-val-mob'].forEach(id => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) {
        el.value = (ratingVal !== null && ratingVal !== undefined && !isNaN(ratingVal)) ? ratingVal : '';
        if (typeof el._syncDatalistControls === 'function') el._syncDatalistControls();
      }
    });`;

if (!pf.includes(targetSyncDom)) {
  console.error('Target targetSyncDom not found!');
  process.exit(1);
}
pf = pf.replace(targetSyncDom, replacementSyncDom);

const targetSyncDomSales = `    ['cfg-sales-manual-val', 'cfg-sales-manual-val-mob'].forEach(id => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) {
        el.value = (salesVal !== null && salesVal !== undefined && !isNaN(salesVal)) ? salesVal : '';
      }
    });`;

const replacementSyncDomSales = `    ['cfg-sales-manual-val', 'cfg-sales-manual-val-mob'].forEach(id => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) {
        el.value = (salesVal !== null && salesVal !== undefined && !isNaN(salesVal)) ? salesVal : '';
        if (typeof el._syncDatalistControls === 'function') el._syncDatalistControls();
      }
    });`;

if (!pf.includes(targetSyncDomSales)) {
  console.error('Target targetSyncDomSales not found!');
  process.exit(1);
}
pf = pf.replace(targetSyncDomSales, replacementSyncDomSales);
console.log('8. Updated syncMetricSourcesDOM with _syncDatalistControls.');

// 7. Update syncRatingManualInput & validateRatingManualInput
const targetSyncRating = `    // Rating Manual Value Input (Desktop & Mobile Sync)
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
    };`;

const replacementSyncRating = `    // Rating Manual Value Input (Desktop & Mobile Sync)
    const syncRatingManualInput = (sourceEl, otherId) => {
      const raw = sourceEl.value;
      const otherEl = document.getElementById(otherId);
      if (otherEl && otherEl.value !== raw) {
        otherEl.value = raw;
        if (typeof otherEl._syncDatalistControls === 'function') otherEl._syncDatalistControls();
      }
      if (typeof sourceEl._syncDatalistControls === 'function') sourceEl._syncDatalistControls();
      const metrics = getPreviewMetricsConfig();
      if (raw.trim() === '') {
        metrics.rating.manual_value = null;
      } else {
        const norm = raw.replace(',', '.').trim();
        const num = parseFloat(norm);
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
        if (otherEl) {
          otherEl.value = '';
          if (typeof otherEl._syncDatalistControls === 'function') otherEl._syncDatalistControls();
        }
      } else {
        const norm = raw.replace(',', '.').trim();
        let num = parseFloat(norm);
        if (isNaN(num) || !isFinite(num) || num < 0) {
          num = 0;
        } else if (num > 5) {
          num = 5;
        }
        num = parseFloat(num.toFixed(1));
        metrics.rating.manual_value = num;
        el.value = num;
        const otherEl = document.getElementById(otherId);
        if (otherEl) {
          otherEl.value = num;
          if (typeof otherEl._syncDatalistControls === 'function') otherEl._syncDatalistControls();
        }
      }
      if (typeof el._syncDatalistControls === 'function') el._syncDatalistControls();
      syncMetricSourcesDOM();
      updateProductCardLivePreview();
    };`;

if (!pf.includes(targetSyncRating)) {
  console.error('Target targetSyncRating not found!');
  process.exit(1);
}
pf = pf.replace(targetSyncRating, replacementSyncRating);
console.log('9. Updated syncRatingManualInput & validateRatingManualInput.');

// 8. Update syncSalesManualInput & validateSalesManualInput
const targetSyncSales = `    // Sales Manual Value Input (Desktop & Mobile Sync)
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
    };`;

const replacementSyncSales = `    // Sales Manual Value Input (Desktop & Mobile Sync)
    const syncSalesManualInput = (sourceEl, otherId) => {
      const raw = sourceEl.value;
      const otherEl = document.getElementById(otherId);
      if (otherEl && otherEl.value !== raw) {
        otherEl.value = raw;
        if (typeof otherEl._syncDatalistControls === 'function') otherEl._syncDatalistControls();
      }
      if (typeof sourceEl._syncDatalistControls === 'function') sourceEl._syncDatalistControls();
      const metrics = getPreviewMetricsConfig();
      if (raw.trim() === '') {
        metrics.sales.manual_value = null;
      } else {
        const cleanDigits = raw.replace(/[.,]/g, '').trim();
        const num = parseInt(cleanDigits, 10);
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
        if (otherEl) {
          otherEl.value = '';
          if (typeof otherEl._syncDatalistControls === 'function') otherEl._syncDatalistControls();
        }
      } else {
        const cleanDigits = raw.replace(/[.,]/g, '').trim();
        let num = parseInt(cleanDigits, 10);
        if (isNaN(num) || !isFinite(num) || num < 0) {
          num = 0;
        }
        metrics.sales.manual_value = num;
        el.value = num;
        const otherEl = document.getElementById(otherId);
        if (otherEl) {
          otherEl.value = num;
          if (typeof otherEl._syncDatalistControls === 'function') otherEl._syncDatalistControls();
        }
      }
      if (typeof el._syncDatalistControls === 'function') el._syncDatalistControls();
      syncMetricSourcesDOM();
      updateProductCardLivePreview();
    };`;

if (!pf.includes(targetSyncSales)) {
  console.error('Target targetSyncSales not found!');
  process.exit(1);
}
pf = pf.replace(targetSyncSales, replacementSyncSales);
console.log('10. Updated syncSalesManualInput & validateSalesManualInput.');

// Clean trailing whitespaces
pf = pf.replace(/[ \t]+(\n)/g, '$1');

if (isCrlf) {
  pf = pf.replace(/\n/g, '\r\n');
}

fs.writeFileSync('js/product-form.js', pf, 'utf8');
console.log('SUCCESS: All metric combobox changes applied to js/product-form.js!');
