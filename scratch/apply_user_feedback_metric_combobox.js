const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');
const isCrlf = pf.includes('\r\n');
if (isCrlf) {
  pf = pf.replace(/\r\n/g, '\n');
}

// 1. Update datalist-sales-manual-options:
// 50, 100, 500, 1RB+ (1001), 10RB+ (10001)
const targetSalesOptions = `    } else if (listId === 'datalist-sales-manual-options') {
      return [
        { value: '50', label: '50' },
        { value: '100', label: '100 (100+)' },
        { value: '500', label: '500 (500+)' },
        { value: '1000', label: '1000 (1RB+)' },
        { value: '10000', label: '10000 (10RB+)' }
      ];`;

const replacementSalesOptions = `    } else if (listId === 'datalist-sales-manual-options') {
      return [
        { value: '50', label: '50' },
        { value: '100', label: '100' },
        { value: '500', label: '500' },
        { value: '1001', label: '1RB+' },
        { value: '10001', label: '10RB+' }
      ];`;

if (!pf.includes(targetSalesOptions)) {
  console.error('Target targetSalesOptions not found!');
  process.exit(1);
}
pf = pf.replace(targetSalesOptions, replacementSalesOptions);
console.log('1. Updated sales options.');

// 2. Remove "Tidak ada saran yang cocok" - simply close popover
const targetNoMatch = `        if (filtered.length === 0) {
          popover.innerHTML = '<div class="px-3 py-2 text-[11px] text-slate-400 italic text-center select-none">Tidak ada saran yang cocok</div>';
          popover.classList.remove('hidden');
          return;
        }`;

const replacementNoMatch = `        if (filtered.length === 0) {
          closePopover();
          return;
        }`;

if (!pf.includes(targetNoMatch)) {
  console.error('Target targetNoMatch not found!');
  process.exit(1);
}
pf = pf.replace(targetNoMatch, replacementNoMatch);
console.log('2. Removed "Tidak ada saran yang cocok" message.');

// 3. Update Desktop Rating & Sales markup: text-left, pl-2.5, placeholder="Pilih/Input", "Data contoh"
const targetDeskRating = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-rating-manual-val" class="text-[10px] text-slate-600 font-normal">Rating (0–5)</label>
                              <div class="relative w-28 clean-datalist-wrapper">
                                <input type="text" id="cfg-rating-manual-val" list="datalist-rating-manual-options" data-datalist-id="datalist-rating-manual-options" autocomplete="off" placeholder="Contoh: 4.8" class="clean-datalist-input w-full px-2.5 pr-8 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              </div>
                            </div>
                            <p class="text-[10px] text-slate-400 font-normal">Data contoh untuk pratinjau Admin.</p>`;

const replacementDeskRating = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-rating-manual-val" class="text-[10px] text-slate-600 font-normal">Rating (0–5)</label>
                              <div class="relative w-32 clean-datalist-wrapper">
                                <input type="text" id="cfg-rating-manual-val" list="datalist-rating-manual-options" data-datalist-id="datalist-rating-manual-options" autocomplete="off" placeholder="Pilih/Input" class="clean-datalist-input w-full pl-2.5 pr-8 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-left focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              </div>
                            </div>
                            <p class="text-[10px] text-slate-400 font-normal">Data contoh</p>`;

if (!pf.includes(targetDeskRating)) {
  console.error('Target targetDeskRating not found!');
  process.exit(1);
}
pf = pf.replace(targetDeskRating, replacementDeskRating);
console.log('3. Updated Desktop Rating markup.');

const targetDeskSales = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-sales-manual-val" class="text-[10px] text-slate-600 font-normal">Jumlah Terjual</label>
                              <div class="relative w-36 clean-datalist-wrapper">
                                <input type="text" id="cfg-sales-manual-val" list="datalist-sales-manual-options" data-datalist-id="datalist-sales-manual-options" autocomplete="off" placeholder="Contoh: 150" class="clean-datalist-input w-full px-2.5 pr-8 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              </div>
                            </div>
                            <p class="text-[10px] text-slate-400 font-normal">Data contoh untuk pratinjau Admin.</p>`;

const replacementDeskSales = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-sales-manual-val" class="text-[10px] text-slate-600 font-normal">Jumlah Terjual</label>
                              <div class="relative w-36 clean-datalist-wrapper">
                                <input type="text" id="cfg-sales-manual-val" list="datalist-sales-manual-options" data-datalist-id="datalist-sales-manual-options" autocomplete="off" placeholder="Pilih/Input" class="clean-datalist-input w-full pl-2.5 pr-8 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-left focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              </div>
                            </div>
                            <p class="text-[10px] text-slate-400 font-normal">Data contoh</p>`;

if (!pf.includes(targetDeskSales)) {
  console.error('Target targetDeskSales not found!');
  process.exit(1);
}
pf = pf.replace(targetDeskSales, replacementDeskSales);
console.log('4. Updated Desktop Sales markup.');

// 4. Update Mobile Rating & Sales markup: text-left, pl-2.5, placeholder="Pilih/Input", "Data contoh"
const targetMobRating = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-rating-manual-val-mob" class="card-tool-label text-[11px] leading-4 text-slate-600 font-normal">Rating (0–5)</label>
                              <div class="relative w-28 clean-datalist-wrapper">
                                <input type="text" id="cfg-rating-manual-val-mob" list="datalist-rating-manual-options" data-datalist-id="datalist-rating-manual-options" autocomplete="off" placeholder="Contoh: 4.8" class="clean-datalist-input w-full px-2.5 pr-8 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              </div>
                            </div>
                            <p class="text-[10px] text-slate-400 font-normal">Data contoh untuk pratinjau Admin.</p>`;

const replacementMobRating = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-rating-manual-val-mob" class="card-tool-label text-[11px] leading-4 text-slate-600 font-normal">Rating (0–5)</label>
                              <div class="relative w-32 clean-datalist-wrapper">
                                <input type="text" id="cfg-rating-manual-val-mob" list="datalist-rating-manual-options" data-datalist-id="datalist-rating-manual-options" autocomplete="off" placeholder="Pilih/Input" class="clean-datalist-input w-full pl-2.5 pr-8 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-left focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              </div>
                            </div>
                            <p class="text-[10px] text-slate-400 font-normal">Data contoh</p>`;

if (!pf.includes(targetMobRating)) {
  console.error('Target targetMobRating not found!');
  process.exit(1);
}
pf = pf.replace(targetMobRating, replacementMobRating);
console.log('5. Updated Mobile Rating markup.');

const targetMobSales = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-sales-manual-val-mob" class="card-tool-label text-[11px] leading-4 text-slate-600 font-normal">Jumlah Terjual</label>
                              <div class="relative w-36 clean-datalist-wrapper">
                                <input type="text" id="cfg-sales-manual-val-mob" list="datalist-sales-manual-options" data-datalist-id="datalist-sales-manual-options" autocomplete="off" placeholder="Contoh: 150" class="clean-datalist-input w-full px-2.5 pr-8 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              </div>
                            </div>
                            <p class="text-[10px] text-slate-400 font-normal">Data contoh untuk pratinjau Admin.</p>`;

const replacementMobSales = `<div class="flex items-center justify-between gap-2">
                              <label for="cfg-sales-manual-val-mob" class="card-tool-label text-[11px] leading-4 text-slate-600 font-normal">Jumlah Terjual</label>
                              <div class="relative w-36 clean-datalist-wrapper">
                                <input type="text" id="cfg-sales-manual-val-mob" list="datalist-sales-manual-options" data-datalist-id="datalist-sales-manual-options" autocomplete="off" placeholder="Pilih/Input" class="clean-datalist-input w-full pl-2.5 pr-8 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-left focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              </div>
                            </div>
                            <p class="text-[10px] text-slate-400 font-normal">Data contoh</p>`;

if (!pf.includes(targetMobSales)) {
  console.error('Target targetMobSales not found!');
  process.exit(1);
}
pf = pf.replace(targetMobSales, replacementMobSales);
console.log('6. Updated Mobile Sales markup.');

// Clean trailing whitespace
pf = pf.replace(/[ \t]+(\n)/g, '$1');

if (isCrlf) {
  pf = pf.replace(/\n/g, '\r\n');
}

fs.writeFileSync('js/product-form.js', pf, 'utf8');
console.log('SUCCESS: All adjustments applied to js/product-form.js!');

