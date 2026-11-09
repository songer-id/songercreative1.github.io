const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');
const isCrlf = pf.includes('\r\n');
if (isCrlf) {
  pf = pf.replace(/\r\n/g, '\n');
}

// 1. Remove Desktop Badge
const targetDeskBadge = `              <!-- Penanda Data Contoh Desktop (Task SC-ADMIN-CARD-METRIC-SOURCES-10) -->
              <div id="preview-sample-data-badge" class="hidden inline-flex items-center justify-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mb-2 font-normal select-none">
                <i class="bi bi-info-circle text-[10px]"></i>
                <span>Data contoh</span>
              </div>
`;

if (pf.includes(targetDeskBadge)) {
  pf = pf.replace(targetDeskBadge, '');
  console.log('1. Removed Desktop preview-sample-data-badge.');
} else {
  console.log('Target Desktop Badge not found, trying fallback matching...');
  pf = pf.replace(/[ \t]*<!-- Penanda Data Contoh Desktop[\s\S]*?<div id="preview-sample-data-badge"[\s\S]*?<\/div>\n?/g, '');
}

// 2. Remove Mobile Badge
const targetMobBadge = `              <!-- Penanda Data Contoh Mobile (Task SC-ADMIN-CARD-METRIC-SOURCES-10) -->
              <div id="preview-sample-data-badge-mob" class="hidden inline-flex items-center justify-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mb-2 font-normal select-none">
                <i class="bi bi-info-circle text-[10px]"></i>
                <span>Data contoh</span>
              </div>
`;

if (pf.includes(targetMobBadge)) {
  pf = pf.replace(targetMobBadge, '');
  console.log('2. Removed Mobile preview-sample-data-badge-mob.');
} else {
  console.log('Target Mobile Badge not found, trying fallback matching...');
  pf = pf.replace(/[ \t]*<!-- Penanda Data Contoh Mobile[\s\S]*?<div id="preview-sample-data-badge-mob"[\s\S]*?<\/div>\n?/g, '');
}

// 3. Remove isSampleDataActive evaluation block
const targetEvalBlock = `    // Evaluasi Penanda "Data contoh" di Area Pratinjau Admin (Task SC-ADMIN-CARD-METRIC-SOURCES-10)
    let isSampleDataActive = false;
    if (variant === 'B') {
      if (cfg.show_sales && hasPreviewSales) {
        isSampleDataActive = (salesSource === 'manual');
      } else if (cfg.show_rating && hasPreviewRating) {
        isSampleDataActive = (ratingSource === 'manual');
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
`;

if (pf.includes(targetEvalBlock)) {
  pf = pf.replace(targetEvalBlock, '');
  console.log('3. Removed isSampleDataActive evaluation block.');
} else {
  console.log('Target eval block not exact, checking lines...');
}

// 4. Remove all `<p class="text-[10px] text-slate-400 font-normal">Data contoh</p>`
pf = pf.replace(/[ \t]*<p class="text-\[10px\] text-slate-400 font-normal">Data contoh<\/p>\n?/g, '');
console.log('4. Removed subpanel "Data contoh" paragraph texts.');

// Clean trailing whitespaces
pf = pf.replace(/[ \t]+(\n)/g, '$1');

if (isCrlf) {
  pf = pf.replace(/\n/g, '\r\n');
}

fs.writeFileSync('js/product-form.js', pf, 'utf8');
console.log('SUCCESS: All sample data badges and texts removed from js/product-form.js!');

