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

function replaceAllExact(name, target, replacement, expectedCount = null) {
  const normTarget = target.replace(/\r\n/g, '\n').replace(/\n/g, eol);
  const normReplacement = replacement.replace(/\r\n/g, '\n').replace(/\n/g, eol);
  const count = pf.split(normTarget).length - 1;
  if (count === 0 || (expectedCount !== null && count !== expectedCount)) {
    console.error(`Target count mismatch for: ${name}. Found: ${count}, Expected: ${expectedCount}`);
    process.exit(1);
  }
  pf = pf.split(normTarget).join(normReplacement);
  console.log(`Replaced ${count} occurrences of: ${name}`);
}

// 1. TEXT CHANGE: Desktop & Mobile "Ketebalan Garis Tepi" -> "Garis Tepi" and border width presets + labels
const deskBorderTarget = `<label for="cfg-border-width" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Ketebalan Garis Tepi</label>
                          <span id="cfg-border-width-val" class="text-[11px] font-mono font-normal text-slate-700">1 px</span>
                        </div>
                        <input type="range" id="cfg-border-width" min="0" max="3" step="1" value="1" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        <div class="flex items-center gap-1 pt-0.5">
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="1">1 px</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="2">2 px</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="3">3 px</button>
                        </div>`;

const deskBorderReplacement = `<label for="cfg-border-width" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Garis Tepi</label>
                          <span id="cfg-border-width-val" class="text-[11px] font-mono font-normal text-slate-700" title="1 px" aria-label="Tipis (1 px)">Tipis</span>
                        </div>
                        <input type="range" id="cfg-border-width" min="0" max="3" step="1" value="1" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        <div class="flex items-center gap-1 pt-0.5">
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0" title="Tanpa (0 px)" aria-label="Tanpa (0 px)">Tanpa</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="1" title="Tipis (1 px)" aria-label="Tipis (1 px)">Tipis</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="2" title="Sedang (2 px)" aria-label="Sedang (2 px)">Sedang</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="3" title="Tebal (3 px)" aria-label="Tebal (3 px)">Tebal</button>
                        </div>`;

replaceExact('desktop-border-width-markup', deskBorderTarget, deskBorderReplacement);

const mobBorderTarget = `<label for="cfg-border-width-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Ketebalan Garis Tepi</label>
                          <span id="cfg-border-width-val-mob" class="text-[11px] font-mono font-normal text-slate-700">1 px</span>
                        </div>
                        <input type="range" id="cfg-border-width-mob" min="0" max="3" step="1" value="1" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        <div class="flex items-center gap-1 pt-0.5">
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="1">1 px</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="2">2 px</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="3">3 px</button>
                        </div>`;

const mobBorderReplacement = `<label for="cfg-border-width-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Garis Tepi</label>
                          <span id="cfg-border-width-val-mob" class="text-[11px] font-mono font-normal text-slate-700" title="1 px" aria-label="Tipis (1 px)">Tipis</span>
                        </div>
                        <input type="range" id="cfg-border-width-mob" min="0" max="3" step="1" value="1" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        <div class="flex items-center gap-1 pt-0.5">
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0" title="Tanpa (0 px)" aria-label="Tanpa (0 px)">Tanpa</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="1" title="Tipis (1 px)" aria-label="Tipis (1 px)">Tipis</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="2" title="Sedang (2 px)" aria-label="Sedang (2 px)">Sedang</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="3" title="Tebal (3 px)" aria-label="Tebal (3 px)">Tebal</button>
                        </div>`;

replaceExact('mobile-border-width-markup', mobBorderTarget, mobBorderReplacement);

// 2. TEXT CHANGE: Desktop & Mobile "Warna Judul" -> "Judul Produk", "Warna Harga" -> "Harga Utama"
replaceAllExact(
  'title-color-labels',
  '<label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Judul</label>',
  '<label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Judul Produk</label>',
  2
);

replaceAllExact(
  'price-color-labels',
  '<label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Harga</label>',
  '<label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Harga Utama</label>',
  2
);

// 3. TEXT CHANGE: Desktop & Mobile Gaya Label Khusus: "Latar" -> "Solid", "Garis Tepi" -> "Outline"
replaceAllExact(
  'badge-style-solid-buttons',
  'data-style="bg">Latar</button>',
  'data-style="bg">Solid</button>',
  2
);

replaceAllExact(
  'badge-style-outline-buttons',
  'data-style="border">Garis Tepi</button>',
  'data-style="border">Outline</button>',
  2
);

// 4. Update updateBorderWidthPresetButtons function to use terms Tanpa, Tipis, Sedang, Tebal and tooltips
const fnBwPresetTarget = `  function updateBorderWidthPresetButtons(val) {
    const num = parseBorderWidth(val, 1);
    document.querySelectorAll('.btn-border-width-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (btnVal === num) {
        btn.className = 'btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const valLabelDesk = document.getElementById('cfg-border-width-val');
    const valLabelMob = document.getElementById('cfg-border-width-val-mob');
    if (valLabelDesk) valLabelDesk.textContent = \`\${num} px\`;
    if (valLabelMob) valLabelMob.textContent = \`\${num} px\`;
  }`;

const fnBwPresetReplacement = `  function getBorderWidthLabel(num) {
    if (num === 0) return 'Tanpa';
    if (num === 1) return 'Tipis';
    if (num === 2) return 'Sedang';
    if (num === 3) return 'Tebal';
    return \`\${num} px\`;
  }

  function updateBorderWidthPresetButtons(val) {
    const num = parseBorderWidth(val, 1);
    document.querySelectorAll('.btn-border-width-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (btnVal === num) {
        btn.className = 'btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const valLabelDesk = document.getElementById('cfg-border-width-val');
    const valLabelMob = document.getElementById('cfg-border-width-val-mob');
    const term = getBorderWidthLabel(num);
    if (valLabelDesk) {
      valLabelDesk.textContent = term;
      valLabelDesk.title = \`\${num} px\`;
      valLabelDesk.setAttribute('aria-label', \`\${term} (\${num} px)\`);
    }
    if (valLabelMob) {
      valLabelMob.textContent = term;
      valLabelMob.title = \`\${num} px\`;
      valLabelMob.setAttribute('aria-label', \`\${term} (\${num} px)\`);
    }
  }`;

replaceExact('fn-updateBorderWidthPresetButtons', fnBwPresetTarget, fnBwPresetReplacement);

// Update return object and window export for getBorderWidthLabel
const returnAnchor = `    parseDiscountBadgeRadius,
    updateDiscountBadgeRadiusPresetButtons,`;

const returnReplacement = `    getBorderWidthLabel,
    parseDiscountBadgeRadius,
    updateDiscountBadgeRadiusPresetButtons,`;

replaceExact('export-getBorderWidthLabel', returnAnchor, returnReplacement);

const winAnchor = `window.parseDiscountBadgeRadius = ProductForm.parseDiscountBadgeRadius;`;
const winReplacement = `window.getBorderWidthLabel = ProductForm.getBorderWidthLabel;
window.parseDiscountBadgeRadius = ProductForm.parseDiscountBadgeRadius;`;

replaceExact('window-getBorderWidthLabel', winAnchor, winReplacement);

// 5. Swap preview calculation blocks (Reorder config resolution to before origStrikePrice & renderCardPhoto)
const p1 = pf.indexOf('// Countdown configs & simulation toggle');
const p2 = pf.indexOf('// 6. Config Styling & Display Toggles');
const p3 = pf.indexOf('// Footer 1 Custom Styles (Khusus Card C)');

if (p1 === -1 || p2 === -1 || p3 === -1 || !(p1 < p2 && p2 < p3)) {
  console.error('Indices invalid for swap:', { p1, p2, p3 });
  process.exit(1);
}

const before = pf.slice(0, p1);
const partA = pf.slice(p1, p2);
const partB = pf.slice(p2, p3);
const after = pf.slice(p3);

pf = before + partB + partA + after;
console.log('Swapped preview calculation blocks successfully!');

fs.writeFileSync('js/product-form.js', pf, 'utf8');
console.log('All changes applied successfully to js/product-form.js!');
